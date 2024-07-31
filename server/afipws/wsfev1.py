from pysimplesoap.client import (
    SimpleXMLElement,
    SoapClient,
    SoapFault,
    parse_proxy,
    set_http_wrapper,
)

from .wsaa import WSAA


class WSFEv1:
    WSDL = "https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL"
    URL = "https://servicios1.afip.gov.ar/wsfev1/service.asmx"
    WSDL_TEST = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL"
    URL_TEST = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx"
    SERVICE = "wsfe"

    def __init__(self, options: dict):
        if not (options.get("CUIT")):
            raise Exception("CUIT field is required in options")
        self.CUIT = options.get("CUIT")

        if options.get("production"):
            "!Produccion"
            self.client = SoapClient(wsdl=self.WSDL, trace=True)
            self.production = True
        else:
            self.client = SoapClient(wsdl=self.WSDL_TEST, trace=True)
            self.production = False

        # self.environment: str = "prod" if self.production == True else "dev"

        if not (options.get("cert") and options.get("key")):
            raise Exception("cert and key fields are required in options")

        self.wsaa = WSAA({
            "cert": options.get("cert"),
            "key": options.get("key"),
            "passphrase": options.get("passphrase") if options.get("passphrase") else "",
            "service": self.SERVICE,
            "production": self.production
        }).get_ticket_access()

        self.token = str(self.wsaa.credentials.token)
        self.sign = str(self.wsaa.credentials.sign)
        self.expiration_time = str(self.wsaa.header.expirationTime)

    def CAESolicitar(self, data: dict):
        "Solicitar CAE a AFIP"
        data = data.copy()

        res = self.client.FECAESolicitar(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT},
            FeCAEReq={
                "FeCabReq": {
                    "CantReg": 1,  # Cantidad de facturas a registrar
                    "PtoVta": data["PtoVta"],  # Punto de venta
                    # Tipo de comprobante (ver tipos disponibles)
                    "CbteTipo": data["CbteTipo"]
                },
                "FeDetReq": {
                    "FECAEDetRequest": {
                        # Concepto del Comprobante: (1)Productos, (2)Servicios, (3)Productos y Servicios
                        "Concepto": 1,
                        # Tipo de documento del comprador (ver tipos disponibles)
                        "DocTipo": data["DocTipo"],
                        # Numero de documento del comprador
                        "DocNro": data["DocNro"],
                        # Numero de comprobante o numero del primer comprobante en caso de ser mas de uno
                        "CbteDesde": data["CbteDesde"],
                        # Numero de comprobante o numero del ultimo comprobante en caso de ser mas de uno
                        "CbteHasta": data["CbteHasta"],
                        # (Opcional) Fecha del comprobante (yyyymmdd) o fecha actual si es nulo
                        "CbteFch": data["CbteFch"],
                        # Importe total del comprobante
                        "ImpTotal": data["ImpTotal"],
                        # Importe neto no gravado
                        "ImpTotConc": data["ImpTotConc"],
                        "ImpNeto": data["ImpNeto"],  # Importe neto gravado
                        # Importe exento de IVA
                        "ImpOpEx": data["ImpOpEx"],
                        "ImpIVA": data["ImpIVA"],  # Importe total de IVA
                        # Importe total de tributos
                        "ImpTrib": data["ImpTrib"],
                        # Tipo de moneda usada en el comprobante (ver tipos disponibles)('PES' para pesos argentinos)
                        "MonId": data["MonId"],
                        # Cotización de la moneda usada (1 para pesos argentinos)
                        "MonCotiz": data["MonCotiz"],
                        "Iva": {
                            "AlicIva": {
                                "Id": iva["Id"],
                                "BaseImp": iva["BaseImp"],
                                "Importe": iva["Importe"]
                            }
                            for iva in data["Iva"]
                        }
                        # TODO: Agregar tributos, comprobantes asociados, etc.
                    }
                }
            }
        )

        return res

    def CompUltimoAutorizado(self, PtoVta: int, CbteTipo: int):
        "Obtener el ultimo comprobante autorizado"
        client = SoapClient(wsdl=self.WSDL_TEST, trace=True)
        res = client.FECompUltimoAutorizado(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT},
            PtoVta=PtoVta,
            CbteTipo=CbteTipo
        )

        return res
