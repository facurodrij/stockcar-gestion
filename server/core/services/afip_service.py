import re

from server.core.models import Venta
from server.afipws import WSFEv1


class AfipService:
    "Servicio para interactuar con la API de AFIP y los modelos de la base de datos."
    CUIT = 20428129572
    CERT = "/workspaces/stockcar-gestion/server/instance/afipws_test.cert"
    KEY = "/workspaces/stockcar-gestion/server/instance/afipws_test.key"
    PASSPHRASE = ""
    PRODUCTION = False

    def __init__(self):
        self.wsfev1 = WSFEv1({
            "CUIT": self.CUIT,
            "cert": self.CERT,
            "key": self.KEY,
            "passphrase": self.PASSPHRASE,
            "production": self.PRODUCTION
        })

    def obtener_cae(self, venta: Venta):
        "Obtener el CAE para una venta."
        data = {
            "CantReg": 1,  # Cantidad de facturas a registrar
            "PtoVta": venta.punto_venta,  # Punto de venta
            # Tipo de comprobante (ver tipos disponibles)
            "CbteTipo": venta.tipo_comprobante.codigo_afip,
            # Concepto del Comprobante: (1)Productos, (2)Servicios, (3)Productos y Servicios
            "Concepto": 1,
            # Tipo de documento del comprador (ver tipos disponibles)
            "DocTipo": venta.cliente.tipo_documento.codigo_afip,
            "DocNro": venta.cliente.nro_documento,  # Numero de documento del comprador
            # Numero de comprobante o numero del primer comprobante en caso de ser mas de uno
            "CbteDesde": venta.numero,
            # Numero de comprobante o numero del ultimo comprobante en caso de ser mas de uno
            "CbteHasta": venta.numero,
            # (Opcional) Fecha del comprobante (yyyymmdd) o fecha actual si es nulo
            "CbteFch": venta.fecha_hora.strftime("%Y%m%d"),
            "FchServDesde": None,
            "FchServHasta": None,
            "FchVtoPago": None,
            # Importe total del comprobante
            "ImpTotal": "{:.2f}".format(venta.gravado + venta.total_iva + venta.total_tributos),
            "ImpTotConc": 0,  # Importe neto no gravado
            "ImpNeto": "{:.2f}".format(venta.gravado),  # Importe neto gravado
            "ImpOpEx": 0,  # Importe exento de IVA
            "ImpIVA": "{:.2f}".format(venta.total_iva),  # Importe total de IVA
            # Importe total de tributos
            "ImpTrib": "{:.2f}".format(venta.total_tributos),
            # Tipo de moneda usada en el comprobante (ver tipos disponibles)('PES' para pesos argentinos)
            "MonId": venta.moneda.codigo_afip,
            # Cotización de la moneda usada (1 para pesos argentinos)
            "MonCotiz": 1,
            "Iva": [
                {
                    "Id": 5,
                    "BaseImp": "{:.2f}".format(venta.gravado),
                    "Importe": "{:.2f}".format(venta.total_iva)
                }
            ],
        }

        response: dict = self.wsfev1.CAESolicitar(data)

        return {
            "CAE": response["FECAESolicitarResult"]["FeDetResp"]["FECAEDetResponse"][0]["CAE"],
            "CAEFchVto": self.formatDate(response["FECAESolicitarResult"]["FeDetResp"]["FECAEDetResponse"][0]["CAEFchVto"])
        }

    # Change date from AFIP used format (yyyymmdd) to yyyy-mm-dd
    def formatDate(self, date: int) -> str:
        m = re.search(r"(\d{4})(\d{2})(\d{2})", str(date))
        return "%s-%s-%s" % (m.group(1), m.group(2), m.group(3))