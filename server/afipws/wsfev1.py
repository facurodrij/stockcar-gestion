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
        if not (options.get("CUIT")) or not (options.get("cert") and options.get("key")):
            raise Exception("Faltan datos de configuración (CUIT, cert, key)")
        self.CUIT = options.get("CUIT")

        if options.get("production"):
            "!Produccion"
            self.client = SoapClient(wsdl=self.WSDL)
            self.production = True
        else:
            # self.client = SoapClient(wsdl=self.WSDL_TEST, trace=True)
            self.client = SoapClient(wsdl=self.WSDL_TEST)
            self.production = False

        # self.environment: str = "prod" if self.production == True else "dev"

        self.wsaa = WSAA({
            "cert": options.get("cert"),
            "key": options.get("key"),
            "passphrase": options.get("passphrase") if options.get("passphrase") else "",
            "service": self.SERVICE,
            "production": self.production
        }).get_ticket_access()

        self.token = str(self.wsaa.credentials.token) # Token de acceso obtenido por WSAA
        self.sign = str(self.wsaa.credentials.sign) # Sign obtenido por WSAA
        self.expiration_time = str(self.wsaa.header.expirationTime) # Fecha de expiración del token

    def CAESolicitar(self, data: dict, return_response: bool = False, fetch_last_cbte: bool = False):
        """Solicitar CAE a AFIP para un comprobante
        data: dict con los datos del comprobante
        return_response: bool, si se debe devolver la respuesta completa o solo los datos del CAE
        fetch_last_cbte: bool, si se debe obtener el último comprobante autorizado
        """
        data = data.copy()

        Auth = {"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}

        if fetch_last_cbte:
            last_cbte = self.CompUltimoAutorizado(data["PtoVta"], data["CbteTipo"])

        Req = {
            "FeCabReq": {
                "CantReg": 1,  # int
                "PtoVta": data["PtoVta"],  # int
                "CbteTipo": data["CbteTipo"]  # int
            },
            "FeDetReq": {
                "FECAEDetRequest": {
                    "Concepto": data["Concepto"],  # int
                    "DocTipo": data["DocTipo"],  # int
                    "DocNro": data["DocNro"],  # long
                    "CbteDesde": last_cbte + 1 if fetch_last_cbte else data["CbteDesde"],  # long
                    "CbteHasta": last_cbte + 1 if fetch_last_cbte else data["CbteHasta"],  # long
                    # string
                    "CbteFch": data["CbteFch"] if data.get("CbteFch") else None,
                    "ImpTotal": data["ImpTotal"],  # double
                    "ImpTotConc": data["ImpTotConc"],  # double
                    "ImpNeto": data["ImpNeto"],  # double
                    "ImpOpEx": data["ImpOpEx"],  # double
                    "ImpTrib": data["ImpTrib"],  # double
                    "ImpIVA": data["ImpIVA"],  # double
                    # string
                    "FchServDesde": data["FchServDesde"] if data.get("FchServDesde") else None,
                    # string
                    "FchServHasta": data["FchServHasta"] if data.get("FchServHasta") else None,
                    # string
                    "FchVtoPago": data["FchVtoPago"] if data.get("FchVtoPago") else None,
                    "MonId": data["MonId"],  # string
                    "MonCotiz": data["MonCotiz"],  # double
                }
            }
        }

        if data.get("CbtesAsoc"):
            Req["FeDetReq"]["FECAEDetRequest"]["CbtesAsoc"] = {
                "CbteAsoc": {
                    "Tipo": cbte["Tipo"],  # int
                    "PtoVta": cbte["PtoVta"],  # int
                    "Nro": cbte["Nro"],  # long
                    "Cuit": cbte["Cuit"] if cbte.get("Cuit") else None,  # long
                    # string
                    "CbteFch": cbte["CbteFch"] if cbte.get("CbteFch") else None
                }
                for cbte in data["CbtesAsoc"]
            }

        if data.get("Tributos"):
            Req["FeDetReq"]["FECAEDetRequest"]["Tributos"] = {
                "Tributo": {
                    "Id": tributo["Id"],  # int
                    "Desc": tributo["Desc"],  # string
                    "BaseImp": tributo["BaseImp"],  # double
                    "Alic": tributo["Alic"],  # double
                    "Importe": tributo["Importe"]  # double
                }
                for tributo in data["Tributos"]
            }

        if data.get("Iva"):
            Req["FeDetReq"]["FECAEDetRequest"]["Iva"] = {
                "AlicIva": {
                    "Id": iva["Id"],  # int
                    "BaseImp": iva["BaseImp"],  # double
                    "Importe": iva["Importe"]  # double
                }
                for iva in data["Iva"]
            }

        if data.get("Opcionales"):
            Req["FeDetReq"]["FECAEDetRequest"]["Opcionales"] = {
                "Opcional": {
                    "Id": opcional["Id"],  # int
                    "Valor": opcional["Valor"]  # string
                }
                for opcional in data["Opcionales"]
            }

        if data.get("Compradores"):
            Req["FeDetReq"]["FECAEDetRequest"]["Compradores"] = {
                "Comprador": {
                    "DocTipo": comprador["DocTipo"],  # int
                    "DocNro": comprador["DocNro"],  # long
                    "Porcentaje": comprador["Porcentaje"]  # double
                }
                for comprador in data["Compradores"]
            }

        if data.get("PeriodoAsoc"):
            Req["FeDetReq"]["FECAEDetRequest"]["PeriodoAsoc"] = {
                "FchDesde": data["PeriodoAsoc"]["FchDesde"],  # string
                "FchHasta": data["PeriodoAsoc"]["FchHasta"]  # string
            }

        if data.get("Actividades"):
            Req["FeDetReq"]["FECAEDetRequest"]["Actividades"] = {
                "Actividad": {
                    "Id": actividad["Id"]  # int
                }
                for actividad in data["Actividades"]
            }

        res = self.client.FECAESolicitar(Auth=Auth, FeCAEReq=Req)

        if return_response:
            return res

        if not res["FECAESolicitarResult"]["FeCabResp"]["Resultado"] == "A":
            if "Errors" in res["FECAESolicitarResult"]:
                raise Exception(res["FECAESolicitarResult"]["Errors"])
            if "Observaciones" in res["FECAESolicitarResult"]["FeDetResp"]["FECAEDetResponse"][0]:
                raise Exception(res["FECAESolicitarResult"]["FeDetResp"]
                                ["FECAEDetResponse"][0]["Observaciones"])
            raise Exception("Error desconocido:", res)

        events = []
        if "Events" in res["FECAESolicitarResult"]:
            for event in res["FECAESolicitarResult"]["Events"]["Evt"]:
                events.append({
                    "Code": event["Code"],
                    "Msg": event["Msg"]
                })

        if type(res["FECAESolicitarResult"]["FeDetResp"]["FECAEDetResponse"]) == list:
            det = res["FECAESolicitarResult"]["FeDetResp"]["FECAEDetResponse"][0]
        else:
            det = res["FECAESolicitarResult"]["FeDetResp"]["FECAEDetResponse"]

        return {
            "NroCbte": det["CbteDesde"],
            "CAE": det["CAE"],
            "CAEFchVto": det["CAEFchVto"]
        }

    def CompUltimoAutorizado(self, PtoVta: int, CbteTipo: int, return_respose: bool = False) -> int:
        "Obtener el ultimo comprobante autorizado"
        res = self.client.FECompUltimoAutorizado(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT},
            PtoVta=PtoVta,
            CbteTipo=CbteTipo
        )
        if return_respose:
            return res
        return res["FECompUltimoAutorizadoResult"]["CbteNro"]
