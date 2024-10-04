"Módulo para obtener un ticket de autorización del web service WSAA de AFIP"
from __future__ import print_function
from __future__ import absolute_import
from __future__ import unicode_literals

# Basado en wsaa-client.php de Gerardo Fisanotti - DvSHyS/DiOPIN/AFIP - 13-apr-07
# Definir WSDL, CERT, PRIVATEKEY, PASSPHRASE, SERVICE, WSAAURL
# Devuelve TA.xml (ticket de autorización de WSAA)

import email
import os
import time
import zeep
import xml.etree.ElementTree as ET

from datetime import datetime, timezone
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import pkcs7


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def date(fmt=None, timestamp=None):
    "Manejo de fechas (simil PHP)"
    if fmt == "U":  # return timestamp
        # use localtime to later convert to UTC timezone
        t = datetime.now()
        return int(time.mktime(t.timetuple()))
    if fmt == "c":  # return isoformat
        # use universal standard time to avoid timezone differences
        d = datetime.fromtimestamp(timestamp, timezone.utc)
        return d.isoformat()
    if fmt == "Ymd":
        d = datetime.now()
        return d.strftime("%Y%m%d")


class WSAA:
    "Clase para obtener un ticket de autorización del web service WSAA de AFIP"
    WSDL_TEST = "https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl"  # Homologación
    URL_TEST = "https://wsaahomo.afip.gov.ar/ws/services/LoginCms"  # Homologación
    WSDL = "https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl"  # Producción
    URL = "https://wsaa.afip.gov.ar/ws/services/LoginCms"  # Producción

    def __init__(self, options: dict):
        "Inicializar el objeto WSAA"
        self._validate_options(options)
        self.service: str = options.get("service")
        self.cert: str = options.get("cert")
        self.key: str = options.get("key")
        self.passphrase: str = options.get("passphrase", "")
        self.production: bool = options.get("production", False)

        if self.production:
            self.client = zeep.Client(wsdl=self.WSDL)
        else:
            self.client = zeep.Client(wsdl=self.WSDL_TEST)

    def _validate_options(self, options: dict):
        """
        Valida que las opciones mínimas estén presentes
        """
        required_keys = ["service", "cert", "key"]
        for key in required_keys:
            if not options.get(key):
                raise Exception(
                    f"Faltan datos de configuración ({', '.join(required_keys)})"
                )

    def create_tra(self, ttl=2400):
        """
        Crear un Ticket de Requerimiento de Acceso (TRA)
        self: objeto WSAA
        ttl: tiempo de vida del TRA en minutos, por defecto 2400 (24hs)
        """
        root = ET.Element("loginTicketRequest", {"version": "1.0"})

        header = ET.SubElement(root, "header")

        unique_id = ET.SubElement(header, "uniqueId")
        unique_id.text = str(int(datetime.now().timestamp()))

        generation_time = ET.SubElement(header, "generationTime")
        generation_time.text = str(date("c", date("U") - ttl))

        expiration_time = ET.SubElement(header, "expirationTime")
        expiration_time.text = str(date("c", date("U") + ttl))

        service = ET.SubElement(root, "service")
        service.text = self.service

        return ET.tostring(root, encoding="utf-8", method="xml")

    def sign_tra(self, tra):
        """
        Firmar el Ticket de Requerimiento de Acceso (TRA).

        self: objeto WSAA
        tra: Ticket de Requerimiento de Acceso (TRA) a firmar
        return: CMS (Cryptographic Message Syntax), firmado con el certificado y clave privada
        """
        try:
            # Load certificate
            if not self.cert.startswith("-----BEGIN CERTIFICATE-----"):
                with open(self.cert, "rb") as cert_file:
                    cert = cert_file.read()
            else:
                cert = self.cert.encode("utf-8")
            cert = x509.load_pem_x509_certificate(cert, default_backend())

            # Load key
            if not self.key.startswith("-----BEGIN RSA PRIVATE KEY-----"):
                with open(self.key, "rb") as key_file:
                    key = key_file.read()
            else:
                key = self.key.encode("utf-8")
            password = self.passphrase.encode("utf-8") if self.passphrase else None
            key = serialization.load_pem_private_key(key, password, default_backend())

            # Sign the TRA
            p7 = (
                pkcs7.PKCS7SignatureBuilder()
                .set_data(tra)
                .add_signer(cert, key, hashes.SHA256())
                .sign(serialization.Encoding.SMIME, [pkcs7.PKCS7Options.Binary])
            )

            # Generate P7 in mail format (PEM)
            msg = email.message_from_string(p7.decode("utf8"))
            for part in msg.walk():
                filename = part.get_filename()
                if filename and filename.startswith("smime.p7"):
                    return part.get_payload(decode=False)
            else:
                raise RuntimeError("Signed part not found in the CMS")
        except Exception as e:
            raise RuntimeError(f"Error al firmar el TRA: {e}")

    def login_cms(self, cms):
        """
        Solicitar el Ticket de Autorización (TA) al WSAA.

        self: objeto WSAA
        cms: Cryptographic Message Syntax (CMS) firmado con el certificado y clave privada
        return: Ticket de Autorización (TA) del WSAA
        """
        try:
            response = self.client.service.loginCms(in0=cms)
            ta_xml = ET.fromstring(response)
            return ta_xml
        except Exception as e:
            raise RuntimeError(f"Error en login_cms: {e}")

    def load_ta_from_file(self):
        """
        Cargar el Ticket de Autorización (TA) desde un archivo XML.

        return: Ticket de Autorización (TA) del WSAA si existe y no ha expirado, False en caso contrario
        """
        try:
            file_path = os.path.join(
                BASE_DIR, "instance", f"loginTicketResponse_{self.service}.xml"
            )
            tree = ET.parse(file_path)
            ta_xml = tree.getroot()
            expiration_time = ta_xml.find("header/expirationTime").text
            current_time = datetime.now(timezone.utc)
            expiration_time_fmt = datetime.fromisoformat(expiration_time).astimezone(
                timezone.utc
            )
            return ta_xml if current_time < expiration_time_fmt else False
        except FileNotFoundError:
            return False
        except Exception as e:
            raise RuntimeError(f"Error al cargar el TA desde el archivo: {e}")

    def save_ta_to_file(self, ta_xml: ET.Element):
        """
        Guardar el Ticket de Autorización (TA) en un archivo XML.

        ta_xml: Ticket de Autorización (TA) del WSAA
        """
        try:
            instance_dir = os.path.join(BASE_DIR, "instance")
            if not os.path.exists(instance_dir):
                os.makedirs(instance_dir)

            file_name = f"loginTicketResponse_{self.service}.xml"
            file_path = os.path.join(instance_dir, file_name)
            tree = ET.ElementTree(ta_xml)
            tree.write(file_path, encoding="utf-8", xml_declaration=True)
        except Exception as e:
            raise RuntimeError(f"Error al guardar el TA en el archivo: {e}")

    def get_ticket_access(self) -> ET.Element:
        """
        Obtener un Ticket de Autorización (TA) del WSAA.

        return: Ticket de Autorización (TA) del WSAA
        """
        ta_xml = self.load_ta_from_file()
        if ta_xml is None or ta_xml is False:
            tra = self.create_tra()
            cms = self.sign_tra(tra)
            ta_xml = self.login_cms(cms)
            self.save_ta_to_file(ta_xml)
        return ta_xml
