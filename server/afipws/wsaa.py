#!/usr/bin/python
# -*- coding: utf8 -*-
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by the
# Free Software Foundation; either version 3, or (at your option) any later
# version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTIBILITY
# or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
# for more details.

"Módulo para obtener un ticket de autorización del web service WSAA de AFIP"
from __future__ import print_function
from __future__ import absolute_import
from __future__ import unicode_literals

# Basado en wsaa-client.php de Gerardo Fisanotti - DvSHyS/DiOPIN/AFIP - 13-apr-07
# Definir WSDL, CERT, PRIVATEKEY, PASSPHRASE, SERVICE, WSAAURL
# Devuelve TA.xml (ticket de autorización de WSAA)


__author__ = "Mariano Reingart (reingart@gmail.com)"
__copyright__ = "Copyright (C) 2008-2021 Mariano Reingart"
__license__ = "LGPL-3.0-or-later"
__version__ = "3.13a"

import email
import hashlib
import os
import shutil
import sys
import time
import traceback
import unicodedata
import warnings
import zeep


from datetime import datetime, timedelta, timezone
from pysimplesoap.client import SimpleXMLElement

from cryptography import __version__ as cryptography_version, x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.bindings.openssl.binding import Binding
from cryptography.hazmat.primitives.serialization import pkcs7
from subprocess import Popen, PIPE
from base64 import b64encode

WSDL_HOMO = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl' # Homologación
URL_HOMO = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms' # Homologación
#WSDL = 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl' # Producción
#URL = 'https://wsaa.afip.gov.ar/ws/services/LoginCms' # Producción

CERT_HOMO = '/workspaces/stockcar-gestion/server/instance/afipws_test.cert' # El certificado X.509 obtenido de AFIP
PRIVATEKEY_HOMO = '/workspaces/stockcar-gestion/server/instance/afipws_test.key' # La clave privada del certificado
PASSPHRASE_HOMO = '' 
SERVICE = 'wsfe' # Servicio a utilizar (ej: wsfe, wsfex, ws_sr_padron_a13, etc.)

# Crear el cliente SOAP para WSAA
#client_wsaa = zeep.Client(wsdl=WSAA_WSDL)

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

class WSAA(object):
    "Clase para obtener un ticket de autorización del web service WSAA de AFIP"

    def __init__(self, homologacion=True):
        "Inicializar el objeto WSAA"
        if homologacion:
            self.wsdl = WSDL_HOMO
            self.url = URL_HOMO
            self.cert = CERT_HOMO
            self.privatekey = PRIVATEKEY_HOMO
            self.passphrase = PASSPHRASE_HOMO
            self.client = zeep.Client(wsdl=WSDL_HOMO)
        else:
           "!Produccion" 
            #self.wsdl = WSDL
            #self.url = URL
            #self.cert = CERT
            #self.privatekey = PRIVATEKEY
            #self.passphrase = PASSPHRASE
            #self.client = zeep.Client(wsdl=WSDL)
        self.service: str = None
        self.ta_xml: SimpleXMLElement = None
        self.token: str = None
        self.sign: str = None
        self.expiration_time: str = None

    
    def create_tra(self, ttl=2400):
        "Crear un Ticket de Requerimiento de Acceso (TRA)"
        "self: objeto WSAA"
        "ttl: tiempo de vida del TRA en minutos, por defecto 2400 (24hs)"

        tra = SimpleXMLElement(
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<loginTicketRequest version="1.0">'
            "</loginTicketRequest>"
        )
        tra.add_child("header")
        # El source y destination es opcional. Si falta, toma la firma (recomendado).
        # tra.header.addChild('source','subject=...')
        # tra.header.addChild('destination','cn=wsaahomo,o=afip,c=ar,serialNumber=CUIT 33693450239')
        tra.header.add_child("uniqueId", str(int(datetime.now().timestamp())))
        tra.header.add_child("generationTime", str(date("c", date("U") - ttl)))
        tra.header.add_child("expirationTime", str(date("c", date("U") + ttl)))
        tra.add_child("service", self.service)
        return tra.as_xml()
    
    
    def sign_tra(self, tra):
        "Firmar el Ticket de Requerimiento de Acceso (TRA)"
        "self: objeto WSAA"
        "tra: Ticket de Requerimiento de Acceso (TRA) a firmar"
        "return: CMS (Cryptographic Message Syntax), firmado con el certificado y clave privada"

        # Load the certificate and private key
        if not self.cert.startswith("-----BEGIN CERTIFICATE-----"):
            cert = open(self.cert).read()
            if isinstance(cert, str):
                cert = cert.encode("utf-8")

        cert = x509.load_pem_x509_certificate(cert)

        if not self.privatekey.startswith("-----BEGIN RSA PRIVATE KEY-----"):
            privatekey = open(self.privatekey).read()
            if isinstance(privatekey, str):
                privatekey = privatekey.encode("utf-8")

        password = self.passphrase if self.passphrase else None

        private_key = serialization.load_pem_private_key(
            privatekey, password, default_backend()
        )

        # Sign the TRA
        p7 = pkcs7.PKCS7SignatureBuilder().set_data(tra).add_signer(
            cert, private_key, hashes.SHA256()
        ).sign(serialization.Encoding.SMIME, [pkcs7.PKCS7Options.Binary])

        # Generar p7 en formato mail y recortar headers
        msg = email.message_from_string(p7.decode("utf8"))
        for part in msg.walk():
            filename = part.get_filename()
            if filename and filename.startswith("smime.p7"):
                # Si es la parte firmada, devolver el CMS
                return part.get_payload(decode=False)
        else:
            raise RuntimeError("Part not found")
        
    
    def login_cms(self, cms):
        "Solicitar el Ticket de Autorización (TA) al WSAA"
        """
        self: objeto WSAA
        cms: Cryptographic Message Syntax (CMS) firmado con el certificado y clave privada
        return: Ticket de Autorización (TA) del WSAA
        """    
        response = self.client.service.loginCms(in0=cms)
        ta_xml = SimpleXMLElement(response)
        return ta_xml
    
    
    def load_ta_from_file(self):
        "Cargar el Ticket de Autorización (TA) desde un archivo XML"
        "return: Ticket de Autorización (TA) del WSAA si existe y no ha expirado, False en caso contrario"
        try:          
            with open(os.path.join("/workspaces/stockcar-gestion/server/afipws/instance", "loginTicketResponse.xml"), "r") as f:
                ta_xml = SimpleXMLElement(f.read())
        except FileNotFoundError:
            return False
        expiration_time = str(ta_xml.header.expirationTime)
        current_time = datetime.now(timezone.utc)
        expiration_time_fmt = datetime.fromisoformat(expiration_time).astimezone(timezone.utc)
        
        return ta_xml if current_time < expiration_time_fmt else False
        

    def get_ticket_access(self, service=SERVICE):
        "Obtener un Ticket de Autorización (TA) del WSAA"
        "service: servicio a utilizar (ej: wsfe, wsfex, ws_sr_padron_a13, etc.)"
        "return: Ticket de Autorización (TA) del WSAA"
        ta_xml = self.load_ta_from_file()
        if not ta_xml:
            self.service = service
            tra = self.create_tra()
            cms = self.sign_tra(tra)
            ta_xml = self.login_cms(cms)        
            "Guardar el TA en un archivo XML"
            try:
                with open(os.path.join("/workspaces/stockcar-gestion/server/afipws/instance", "loginTicketResponse.xml"), "w") as f:
                    f.write(ta_xml.as_xml().decode("utf-8"))
            except Exception as e:
                print("Error al guardar el TA en un archivo XML:", e)

        self.ta_xml = ta_xml
        self.token = str(ta_xml.credentials.token)
        self.sign = str(ta_xml.credentials.sign)
        self.expiration_time = str(ta_xml.header.expirationTime)
        return ta_xml


def main():
    "Obtener un ticket de autorización del web service WSAA de AFIP"
    wsaa = WSAA()
    ta_xml = wsaa.get_ticket_access()
    print(ta_xml.as_xml())

if __name__ == "__main__":
    main()