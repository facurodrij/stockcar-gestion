import re

from server.core.models import Venta
from server.afipws import WSFEv1


class AfipServiceError(Exception):
    "Error en el servicio de AFIP."

    def __init__(self, original_exception):
        super().__init__(f"Afip Service error: {original_exception}")
        self.original_exception = original_exception


class AfipService:
    "Servicio para interactuar con la API de AFIP y los modelos de la base de datos."
    CUIT = 20428129572
    CERT = "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/instance/afipws_test.cert"
    KEY = "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/instance/afipws_test.key"
    PASSPHRASE = ""
    PRODUCTION = False

    def __init__(self):
        "Inicializar el servicio de AFIP."
        try:
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
            raise AfipServiceError(e)

    def obtener_cae(self, venta: Venta):
        "Obtener el CAE para una venta."
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
        except Exception as e:
            raise AfipServiceError(e)
        return {
            "numero": res["NroCbte"],
            "cae": res["CAE"],
            "vencimiento_cae": self.formatDate(res["CAEFchVto"]),
        }

    def anular_cae(self, venta: Venta):
        "Anular el CAE de una venta con una Nota de Crédito."
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
                "ImpNeto": float(
                    "{:.2f}".format(venta.gravado)
                ),
                "ImpOpEx": 0,
                "ImpIVA": float(
                    "{:.2f}".format(venta.total_iva)
                ),
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
                            "CbteFch": venta.venta_asociada.fecha_hora.strftime("%Y%m%d"),
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
                                "{:.2f}".format(venta.venta_asociada.get_tributo_importe(tributo.id))
                            ),
                        }
                        for tributo in venta.venta_asociada.tributos
                    ]
                    if venta.venta_asociada.tributos
                    else None
                )
            }
            res = self.wsfev1.CAESolicitar(data, fetch_last_cbte=True)
        except Exception as e:
            raise AfipServiceError(e)
        return {
            "numero": res["NroCbte"],
            "cae": res["CAE"],
            "vencimiento_cae": self.formatDate(res["CAEFchVto"]),
        }

    # Change date from AFIP used format (yyyymmdd) to yyyy-mm-dd
    def formatDate(self, date: int) -> str:
        m = re.search(r"(\d{4})(\d{2})(\d{2})", str(date))
        return "%s-%s-%s" % (m.group(1), m.group(2), m.group(3))
