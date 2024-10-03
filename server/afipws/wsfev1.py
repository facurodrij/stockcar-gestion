from .wsbase import WSBase


class WSFEv1(WSBase):
    WSDL = "https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL"
    URL = "https://servicios1.afip.gov.ar/wsfev1/service.asmx"
    WSDL_TEST = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL"
    URL_TEST = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx"
    SERVICE = "wsfe"

    def __init__(self, options: dict):
        super().__init__(options)

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

        if "Errors" in res and res["Errors"] is not None:
            raise Exception(res["Errors"])

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

    def ParamGetTiposCbte(self, return_response: bool = False):
        "Obtener los tipos de comprobantes"
        res = self.client.service.FEParamGetTiposCbte(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}
        )
        if return_response:
            return res
        return res["ResultGet"]["CbteTipo"]

    def ParamGetTiposConcepto(self, return_response: bool = False):
        "Obtener los tipos de concepto"
        res = self.client.service.FEParamGetTiposConcepto(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}
        )
        if return_response:
            return res
        return res["ResultGet"]["ConceptoTipo"]

    def ParamGetTiposDoc(self, return_response: bool = False):
        "Obtener los tipos de documentos"
        res = self.client.service.FEParamGetTiposDoc(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}
        )
        if return_response:
            return res
        return res["ResultGet"]["DocTipo"]

    def ParamGetTiposIva(self, return_response: bool = False):
        "Obtener los tipos de IVA"
        res = self.client.service.FEParamGetTiposIva(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}
        )
        if return_response:
            return res
        return res["ResultGet"]["IvaTipo"]

    def ParamGetTiposMonedas(self, return_response: bool = False):
        "Obtener los tipos de monedas"
        res = self.client.service.FEParamGetTiposMonedas(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}
        )
        if return_response:
            return res
        return res["ResultGet"]["Moneda"]

    def ParamGetTiposOpcional(self, return_response: bool = False):
        "Obtener los tipos de opcionales"
        res = self.client.service.FEParamGetTiposOpcional(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}
        )
        if return_response:
            return res
        return res["ResultGet"]["OpcionalTipo"]

    def ParamGetTiposTributos(self, return_response: bool = False):
        "Obtener los tipos de tributos"
        res = self.client.service.FEParamGetTiposTributos(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}
        )
        if return_response:
            return res
        return res["ResultGet"]["TributoTipo"]

    def ParamGetPtosVenta(self, return_response: bool = False):
        "Obtener los puntos de venta asignados a Facturación Electrónica que soporten CAE o CAEA vía WS"
        res = self.client.service.FEParamGetPtosVenta(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}
        )
        if return_response:
            return res
        if res["ResultGet"] is not None:
            return res["ResultGet"]["PtoVenta"]
        return []

    def ParamGetCotizacion(self, MonId: str, return_response: bool = False):
        "Obtener la cotización de la moneda"
        res = self.client.service.FEParamGetCotizacion(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT},
            MonId=MonId,
        )
        if return_response:
            return res
        return res["ResultGet"]["MonCotiz"]

    def ServerStatus(self):
        "Verificar el funcionamiento del servicio"
        res = self.client.service.FEDummy()
        return res

    def ParamGetTiposPaises(self, return_response: bool = False):
        "Obtener los tipos de paises"
        res = self.client.service.FEParamGetTiposPaises(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}
        )
        if return_response:
            return res
        return res["ResultGet"]["PaisTipo"]

    def ParamGetActividades(self, return_response: bool = False):
        "Obtener las actividades"
        res = self.client.service.FEParamGetActividades(
            Auth={"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}
        )
        if return_response:
            return res
        return res["ResultGet"]["ActividadesTipo"]

    def CompConsultar(self, data: dict, return_response: bool = False):
        "Consultar comprobante"
        data = data.copy()
        Auth = {"Token": self.token, "Sign": self.sign, "Cuit": self.CUIT}
        Req = {
            "FeCompConsReq": {
                "CbteTipo": data["CbteTipo"],  # int
                "PtoVta": data["PtoVta"],  # int
                "CbteNro": data["CbteNro"],  # long
            }
        }
        res = self.client.service.FECompConsultar(Auth=Auth, FeCompConsReq=Req)
        if return_response:
            return res
        return res["Resultado"]
