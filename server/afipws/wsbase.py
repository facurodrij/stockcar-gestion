import zeep
import ssl
import os

from requests import Session
from requests.adapters import HTTPAdapter
from zeep.transports import Transport
from urllib3.poolmanager import PoolManager
from .wsaa import WSAA


class TLSAdapter(HTTPAdapter):
    """
    Clase para configurar el adaptador TLS para el cliente HTTP
    """
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


class WSBase:
    """
    Clase base para los servicios web de AFIP
    Utilizado por los servicios WSFEv1, WSSrPadronA13
    """

    WSDL = ""
    URL = ""
    WSDL_TEST = ""
    URL_TEST = ""
    SERVICE = ""
    CACERT = os.path.join(os.path.dirname(__file__), "cacert.pem")

    def __init__(self, options: dict):
        self._validate_options(options)
        self.CUIT = options.get("CUIT")
        self.production = options.get("production", False)

        self.client = self._configure_client()
        self.wsaa = self._configure_wsaa(options)

        self.token = str(self.wsaa.credentials.token)
        self.sign = str(self.wsaa.credentials.sign)
        self.expiration_time = str(self.wsaa.header.expirationTime)

    def _validate_options(self, options: dict):
        """
        Valida que las opciones mínimas estén presentes
        """
        required_keys = ["CUIT", "cert", "key"]
        for key in required_keys:
            if not options.get(key):
                raise Exception(
                    f"Faltan datos de configuración ({', '.join(required_keys)})"
                )

    def _configure_client(self):
        """
        Configura el cliente zeep
        """
        if self.production:
            session = Session()
            session.verify = self.CACERT
            adapter = TLSAdapter()
            session.mount("https://", adapter)
            return zeep.Client(wsdl=self.WSDL, transport=Transport(session=session))
        else:
            return zeep.Client(wsdl=self.WSDL_TEST)

    def _configure_wsaa(self, options: dict):
        """
        Configura el objeto WSAA
        """
        return WSAA(
            {
                "cert": options.get("cert"),
                "key": options.get("key"),
                "passphrase": options.get("passphrase", ""),
                "service": self.SERVICE,
                "production": self.production,
            }
        ).get_ticket_access()
