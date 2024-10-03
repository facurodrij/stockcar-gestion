import zeep
from .wsbase import WSBase


class WSSrPadronA13(WSBase):
    """
    Clase para el servicio web de padron A13
    """

    WSDL = "https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA13?WSDL"
    URL = "https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA13"
    WSDL_TEST = (
        "https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA13?WSDL"
    )
    URL_TEST = "https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA13"
    SERVICE = "ws_sr_padron_a13"

    def __init__(self, options: dict):
        super().__init__(options)

    def GetPersona(self, identifier: int):
        """
        Obtiene los datos de una persona
        """
        try:
            res = self.client.service.getPersona(
                sign=self.sign,
                token=self.token,
                cuitRepresentada=self.CUIT,
                idPersona=identifier,
            )
        except zeep.exceptions.Fault as e:
            raise Exception(e.message)
        return res

    def ServerStatus(self):
        """
        Obtiene el estado del servidor
        """
        res = self.client.service.dummy()
        return res
