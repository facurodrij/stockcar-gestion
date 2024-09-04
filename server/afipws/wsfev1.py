import zeep
import ssl
import os

from requests import Session
from requests.adapters import HTTPAdapter
from zeep.transports import Transport
from urllib3.poolmanager import PoolManager
from .wsaa import WSAA


class TLSAdapter(HTTPAdapter):
    def init_poolmanager(self, connections, maxsize, block=False):
        """Create and initialize the urllib3 PoolManager."""
        ctx = ssl.create_default_context()
        ctx.set_ciphers("DEFAULT@SECLEVEL=1")
        self.poolmanager = PoolManager(
            num_pools=connections,
            maxsize=maxsize,
            block=block,
            ssl_version=ssl.PROTOCOL_TLS,
            ssl_context=ctx,
        )


class WSFEv1:
    WSDL = "https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL"
    URL = "https://servicios1.afip.gov.ar/wsfev1/service.asmx"
    WSDL_TEST = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL"
    URL_TEST = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx"
    SERVICE = "wsfe"
    CACERT = os.path.join(os.path.dirname(__file__), "cacert.pem")

    def __init__(self, options: dict):
        if not (options.get("CUIT")) or not (
            options.get("cert") and options.get("key")
        ):
            raise Exception("Faltan datos de configuración (CUIT, cert, key)")
        self.CUIT = options.get("CUIT")

        if options.get("production"):
            "!Produccion"
            session = Session()
            session.verify = self.CACERT
            adapter = TLSAdapter()
            session.mount("https://", adapter)
            transport = Transport(session=session)
            self.client = zeep.Client(wsdl=self.WSDL, transport=transport)
            self.production = True
        else:
            self.client = zeep.Client(wsdl=self.WSDL_TEST)
            self.production = False

        self.wsaa = WSAA(
            {
                "cert": options.get("cert"),
                "key": options.get("key"),
                "passphrase": (
                    options.get("passphrase") if options.get("passphrase") else ""
                ),
                "service": self.SERVICE,
                "production": self.production,
            }
        ).get_ticket_access()

        self.token = str(
            self.wsaa.credentials.token
        )  # Token de acceso obtenido por WSAA
        self.sign = str(self.wsaa.credentials.sign)  # Sign obtenido por WSAA
        self.expiration_time = str(
            self.wsaa.header.expirationTime
        )  # Fecha de expiración del token

    def CAESolicitar(
        self, data: dict, return_response: bool = False, fetch_last_cbte: bool = False
    ):
        """Solicitar CAE a AFIP para un comprobante.

        :param data: dict con los datos del comprobante
        :param return_response: bool, si se debe devolver la respuesta completa o solo los datos del CAE
        :param fetch_last_cbte: bool, si se debe obtener el último comprobante autorizado
        """
        data = data.copy()

        Auth = {"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}

        if fetch_last_cbte:
            last_cbte = self.CompUltimoAutorizado(data["PtoVta"], data["CbteTipo"])

        Req = {
            "FeCabReq": {
                "CantReg": 1,  # int
                "PtoVta": data["PtoVta"],  # int
                "CbteTipo": data["CbteTipo"],  # int
            },
            "FeDetReq": {
                "FECAEDetRequest": {
                    "Concepto": data["Concepto"],  # int
                    "DocTipo": data["DocTipo"],  # int
                    "DocNro": data["DocNro"],  # long
                    "CbteDesde": (
                        last_cbte + 1 if fetch_last_cbte else data["CbteDesde"]
                    ),  # long
                    "CbteHasta": (
                        last_cbte + 1 if fetch_last_cbte else data["CbteHasta"]
                    ),  # long
                    # string
                    "CbteFch": data["CbteFch"],
                    "ImpTotal": data["ImpTotal"],  # double
                    "ImpTotConc": data["ImpTotConc"],  # double
                    "ImpNeto": data["ImpNeto"],  # double
                    "ImpOpEx": data["ImpOpEx"],  # double
                    "ImpTrib": data["ImpTrib"],  # double
                    "ImpIVA": data["ImpIVA"],  # double
                    "MonId": data["MonId"],  # string
                    "MonCotiz": data["MonCotiz"],  # double
                }
            },
        }

        if data.get("Concepto") == 2 or data.get("Concepto") == 3:
            if (
                not data.get("FchServDesde")
                or not data.get("FchServHasta")
                or not data.get("FchVtoPago")
            ):
                raise Exception(
                    "FchServDesde, FchServHasta y FchVtoPago son obligatorios para Concepto 2 y 3"
                )
            Req["FeDetReq"]["FECAEDetRequest"]["FchServDesde"] = data["FchServDesde"]
            Req["FeDetReq"]["FECAEDetRequest"]["FchServHasta"] = data["FchServHasta"]
            Req["FeDetReq"]["FECAEDetRequest"]["FchVtoPago"] = data["FchVtoPago"]

        """
        La forma correcta de enviar estructuras de datos es la siguiente:
        "Objs": {
            'Obj': [
                {'a1': 1, 'a2': 1}, 
                {'a1': 2, 'a2': 2}
            ]
        }
        """

        if data.get("CbtesAsoc"):
            Req["FeDetReq"]["FECAEDetRequest"]["CbtesAsoc"] = {
                "CbteAsoc": [
                    {
                        "Tipo": cbte["Tipo"],
                        "PtoVta": cbte["PtoVta"],
                        "Nro": cbte["Nro"],
                        "Cuit": cbte["Cuit"] if cbte.get("Cuit") else None,
                        "CbteFch": cbte["CbteFch"] if cbte.get("CbteFch") else None,
                    }
                    for cbte in data["CbtesAsoc"]
                ]
            }

        if data.get("Tributos"):
            Req["FeDetReq"]["FECAEDetRequest"]["Tributos"] = {
                "Tributo": [
                    {
                        "Id": tributo["Id"],  # int
                        "Desc": tributo["Desc"],  # string
                        "BaseImp": tributo["BaseImp"],  # double
                        "Alic": tributo["Alic"],  # double
                        "Importe": tributo["Importe"],  # double
                    }
                    for tributo in data["Tributos"]
                ]
            }

        if data.get("Iva"):
            Req["FeDetReq"]["FECAEDetRequest"]["Iva"] = {
                "AlicIva": [
                    {
                        "Id": iva["Id"],  # int
                        "BaseImp": iva["BaseImp"],  # double
                        "Importe": iva["Importe"],  # double
                    }
                    for iva in data["Iva"]
                ]
            }

        if data.get("Opcionales"):
            Req["FeDetReq"]["FECAEDetRequest"]["Opcionales"] = {
                "Opcional": [
                    {
                        "Id": opcional["Id"],  # int
                        "Valor": opcional["Valor"],  # string
                    }
                    for opcional in data["Opcionales"]
                ]
            }

        if data.get("Compradores"):
            Req["FeDetReq"]["FECAEDetRequest"]["Compradores"] = {
                "Comprador": [
                    {
                        "DocTipo": comprador["DocTipo"],  # int
                        "DocNro": comprador["DocNro"],  # long
                        "Porcentaje": comprador["Porcentaje"],  # double
                    }
                    for comprador in data["Compradores"]
                ]
            }

        if data.get("PeriodoAsoc"):
            Req["FeDetReq"]["FECAEDetRequest"]["PeriodoAsoc"] = {
                "FchDesde": data["PeriodoAsoc"]["FchDesde"],  # string
                "FchHasta": data["PeriodoAsoc"]["FchHasta"],  # string
            }

        if data.get("Actividades"):
            Req["FeDetReq"]["FECAEDetRequest"]["Actividades"] = {
                "Actividad": [
                    {"Id": actividad["Id"]} for actividad in data["Actividades"]  # int
                ]
            }

        res = self.client.service.FECAESolicitar(Auth=Auth, FeCAEReq=Req)

        if return_response:
            return res

        if not res["FeCabResp"]["Resultado"] == "A":
            if "Errors" in res and res["Errors"] is not None:
                raise Exception(res["Errors"])
            if "Observaciones" in res["FeDetResp"]["FECAEDetResponse"][0]:
                raise Exception(
                    res["FeDetResp"]["FECAEDetResponse"][0]["Observaciones"]
                )
            raise Exception("Error desconocido:", res)

        events = []
        if "Events" in res and res["Events"] is not None:
            for event in res["Events"]["Evt"]:
                events.append({"Code": event["Code"], "Msg": event["Msg"]})

        if type(res["FeDetResp"]["FECAEDetResponse"]) == list:
            det = res["FeDetResp"]["FECAEDetResponse"][0]
        else:
            det = res["FeDetResp"]["FECAEDetResponse"]

        return {
            "NroCbte": det["CbteDesde"],
            "CAE": det["CAE"],
            "CAEFchVto": det["CAEFchVto"],
        }

    def CompUltimoAutorizado(
        self, PtoVta: int, CbteTipo: int, return_response: bool = False
    ) -> int:
        "Obtener el ultimo comprobante autorizado"
        res = self.client.service.FECompUltimoAutorizado(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT},
            PtoVta=PtoVta,
            CbteTipo=CbteTipo,
        )
        if return_response:
            return res
        return res["CbteNro"]
