from .wsaa import WSAA

class WSFEv1:
    WSDL = "https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL"
    URL = "https://servicios1.afip.gov.ar/wsfev1/service.asmx"
    WSDL_TEST = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL"
    URL_TEST = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx"
    SERVICE = "wsfe"

    def __init__(self, options: dict):
        if not(options.get("CUIT")):
            raise Exception("CUIT field is required in options")
        self.CUIT: int = options.get("CUIT")
        self.production: bool = options.get("production") if options.get("production") == True else False
        self.environment: str = "prod" if self.production == True else "dev"
        
        if not(options.get("cert") and options.get("key")):
            raise Exception("cert and key fields are required in options")

        self.wsaa = WSAA({
            "cert": options.get("cert"), 
            "key": options.get("key"),
            "service": self.SERVICE,
            "production": self.production
        }).get_ticket_access()

        self.token = str(self.wsaa.credentials.token)
        self.sign = str(self.wsaa.credentials.sign)
        self.expiration_time = str(self.wsaa.header.expirationTime)
    
    # TODO solicitar CAE
    def CAESolicitar(self, data: dict):
        pass
    