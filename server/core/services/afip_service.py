import re
import os

from server import BASE_DIR
from server.core.models import Venta
from server.afipws import WSFEv1, WSSrPadronA13


class AfipServiceError(Exception):
    "Error en el servicio de AFIP."

    def __init__(self, original_exception):
        super().__init__(f"Afip Service error: {original_exception}")
        self.original_exception = original_exception


class AfipService:
    """
    Servicio para interactuar con los servicios web de AFIP y los modelos de la base de datos.

    Este servicio se encarga de conectar con los servicios web de AFIP para la generación de
    comprobantes y la obtención de datos de personas. Dado que los servicios de AFIP devuelven
    una gran cantidad de datos, este servicio filtra y extrae únicamente la información necesaria
    para el funcionamiento de la aplicación.

    Atributos:
    - CUIT: Número de CUIT del contribuyente que utiliza el servicio.
    - CERT: Ruta al certificado digital.
    - KEY: Ruta a la clave privada.
    - PASSPHRASE: Frase de contraseña para la clave privada.
    - PRODUCTION: Indicador de si se está en modo producción o homologación.

    Métodos:
    - obtener_cae: Solicita el CAE para una venta.
    - anular_cae: Anula el CAE de una venta mediante una Nota de Crédito.
    - get_persona: Obtiene los datos de una persona a partir de su identificador (CUIT).
    """

    CUIT = 20428129572
    CERT = os.path.join(BASE_DIR, "instance", "afipws_test.cert")
    KEY = os.path.join(BASE_DIR, "instance", "afipws_test.key")
    PASSPHRASE = ""
    PRODUCTION = False

    def __init__(self):
        "Inicializar los servicios de AFIP."
        self.wsfev1 = None
        self.ws_sr_padron_a13 = None

    def _initialize_wsfev1(self):
        """Inicializar el servicio WSFEv1 si no está ya inicializado."""
        try:
            if self.wsfev1 is None:
                self.wsfev1 = WSFEv1(
                    {
                        "CUIT": self.CUIT,
                        "cert": self.CERT,
                        "key": self.KEY,
                        "passphrase": self.PASSPHRASE,
                        "production": self.PRODUCTION,
                    }
                )
        except Exception as e:
            raise AfipServiceError(f"Error inicializando el servicio WSFEv1: {e}")

    def _initialize_ws_sr_padron_a13(self):
        """Inicializar el servicio WSSrPadronA13 si no está ya inicializado."""
        try:
            if self.ws_sr_padron_a13 is None:
                self.ws_sr_padron_a13 = WSSrPadronA13(
                    {
                        "CUIT": self.CUIT,
                        "cert": self.CERT,
                        "key": self.KEY,
                        "passphrase": self.PASSPHRASE,
                        "production": self.PRODUCTION,
                    }
                )
        except Exception as e:
            raise AfipServiceError(
                f"Error inicializando el servicio WSSrPadronA13: {e}"
            )

    def obtener_cae(self, venta: Venta):
        "Obtener el CAE para una venta."
        self._initialize_wsfev1()
        try:
            data = {
                "CantReg": 1,  # Cantidad de facturas a registrar
                "PtoVta": venta.punto_venta.numero,  # Punto de venta
                # Tipo de comprobante (ver tipos disponibles)
                "CbteTipo": venta.tipo_comprobante.codigo_afip,
                # Concepto del Comprobante: (1)Productos, (2)Servicios, (3)Productos y Servicios
                "Concepto": 1,
                # Tipo de documento del comprador (ver tipos disponibles)
                "DocTipo": venta.cliente.tipo_documento.codigo_afip,
                "DocNro": venta.cliente.nro_documento,  # Numero de documento del comprador
                # Numero de comprobante se obtiene con CompUltimoAutorizado
                "CbteDesde": None,
                "CbteHasta": None,
                # Fecha del comprobante (yyyymmdd)
                "CbteFch": venta.fecha_hora.strftime("%Y%m%d"),
                # Fecha de servicio (yyyymmdd), obligatorio para Concepto 2 y 3
                "FchServDesde": None,
                "FchServHasta": None,
                "FchVtoPago": None,
                # Importe total del comprobante
                "ImpTotal": float(
                    "{:.2f}".format(
                        venta.gravado + venta.total_iva + venta.total_tributos
                    )
                ),
                "ImpTotConc": 0,  # Importe neto no gravado
                "ImpNeto": float(
                    "{:.2f}".format(venta.gravado)
                ),  # Importe neto gravado
                "ImpOpEx": 0,  # Importe exento de IVA
                "ImpIVA": float(
                    "{:.2f}".format(venta.total_iva)
                ),  # Importe total de IVA
                # Importe total de tributos
                "ImpTrib": float("{:.2f}".format(venta.total_tributos)),
                # Tipo de moneda usada en el comprobante (ver tipos disponibles)('PES' para pesos argentinos)
                "MonId": venta.moneda.codigo_afip,
                # Cotización de la moneda usada (1 para pesos argentinos)
                "MonCotiz": float(venta.moneda_cotizacion),
                "Iva": (
                    [
                        {
                            "Id": iva["Id"],
                            "BaseImp": float("{:.2f}".format(iva["BaseImp"])),
                            "Importe": float("{:.2f}".format(iva["Importe"])),
                        }
                        for iva in venta.get_iva_alicuota()
                    ]
                    if venta.get_iva_alicuota()
                    else None
                ),
                "Tributos": (
                    [
                        {
                            "Id": tributo.tipo_tributo.codigo_afip,
                            "Desc": tributo.descripcion,
                            "BaseImp": float("{:.2f}".format(venta.gravado)),
                            "Alic": float("{:.2f}".format(tributo.alicuota)),
                            "Importe": float(
                                "{:.2f}".format(venta.get_tributo_importe(tributo.id))
                            ),
                        }
                        for tributo in venta.tributos
                    ]
                    if venta.tributos
                    else None
                ),
            }
            res = self.wsfev1.CAESolicitar(data, fetch_last_cbte=True)
            return {
                "numero": res["NroCbte"],
                "cae": res["CAE"],
                "vencimiento_cae": self.formatDate(res["CAEFchVto"]),
            }
        except Exception as e:
            raise AfipServiceError(f"Error obteniendo CAE: {e}")

    def anular_cae(self, venta: Venta):
        "Anular el CAE de una venta con una Nota de Crédito."
        self._initialize_wsfev1()
        try:
            data = {
                "CantReg": 1,
                "PtoVta": venta.punto_venta.numero,
                "CbteTipo": venta.tipo_comprobante.codigo_afip,
                "Concepto": 1,
                "DocTipo": venta.cliente.tipo_documento.codigo_afip,
                "DocNro": venta.cliente.nro_documento,
                "CbteDesde": venta.numero,
                "CbteHasta": venta.numero,
                "CbteFch": venta.fecha_hora.strftime("%Y%m%d"),
                "FchServDesde": None,
                "FchServHasta": None,
                "FchVtoPago": None,
                "ImpTotal": float(
                    "{:.2f}".format(
                        venta.gravado + venta.total_iva + venta.total_tributos
                    )
                ),
                "ImpTotConc": 0,
                "ImpNeto": float("{:.2f}".format(venta.gravado)),
                "ImpOpEx": 0,
                "ImpIVA": float("{:.2f}".format(venta.total_iva)),
                "ImpTrib": float("{:.2f}".format(venta.total_tributos)),
                "MonId": venta.moneda.codigo_afip,
                "MonCotiz": float(venta.moneda_cotizacion),
                "CbtesAsoc": (
                    [
                        {
                            "Tipo": venta.venta_asociada.tipo_comprobante.codigo_afip,
                            "PtoVta": venta.venta_asociada.punto_venta.numero,
                            "Nro": venta.venta_asociada.numero,
                            "Cuit": venta.venta_asociada.get_cbte_asoc_cuit(),
                            "CbteFch": venta.venta_asociada.fecha_hora.strftime(
                                "%Y%m%d"
                            ),
                        }
                    ]
                ),
                "Iva": (
                    [
                        {
                            "Id": iva["Id"],
                            "BaseImp": float("{:.2f}".format(iva["BaseImp"])),
                            "Importe": float("{:.2f}".format(iva["Importe"])),
                        }
                        for iva in venta.venta_asociada.get_iva_alicuota()
                    ]
                    if venta.venta_asociada.get_iva_alicuota()
                    else None
                ),
                "Tributos": (
                    [
                        {
                            "Id": tributo.tipo_tributo.codigo_afip,
                            "Desc": tributo.descripcion,
                            "BaseImp": float("{:.2f}".format(venta.gravado)),
                            "Alic": float("{:.2f}".format(tributo.alicuota)),
                            "Importe": float(
                                "{:.2f}".format(
                                    venta.venta_asociada.get_tributo_importe(tributo.id)
                                )
                            ),
                        }
                        for tributo in venta.venta_asociada.tributos
                    ]
                    if venta.venta_asociada.tributos
                    else None
                ),
            }
            res = self.wsfev1.CAESolicitar(data, fetch_last_cbte=True)
            return {
                "numero": res["NroCbte"],
                "cae": res["CAE"],
                "vencimiento_cae": self.formatDate(res["CAEFchVto"]),
            }
        except Exception as e:
            raise AfipServiceError(f"Error anulando CAE: {e}")

    def formatDate(self, date: int) -> str:
        """
        Cambia el formato de la fecha de AFIP (yyyymmdd) a yyyy-mm-dd
        """
        m = re.search(r"(\d{4})(\d{2})(\d{2})", str(date))
        return "%s-%s-%s" % (m.group(1), m.group(2), m.group(3))

    def get_persona(self, identifier: int):
        "Obtener los datos de una persona."
        self._initialize_ws_sr_padron_a13()
        try:
            res = self.ws_sr_padron_a13.GetPersona(identifier)
            if "persona" in res:
                res = res["persona"]

            return {
                "tipo_responsable_id": 1,
                "razon_social": res["razonSocial"],
                "direccion": res["domicilio"][0]["direccion"],
                "provincia_id": res["domicilio"][0]["idProvincia"],
                "localidad": res["domicilio"][0]["localidad"],
                "codigo_postal": res["domicilio"][0]["codigoPostal"],
            }
        except Exception as e:
            raise AfipServiceError(f"Error obteniendo datos de la persona: {e}")
