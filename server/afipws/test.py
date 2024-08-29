import pytest
import json
from pysimplesoap.client import SimpleXMLElement
from .wsfev1 import WSFEv1
from .wsaa import WSAA

@pytest.fixture
def wsfev1_instance():
    wsfev1 = WSFEv1({
        "CUIT": 20428129572,
        "cert": "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/instance/afipws_test.cert",
        "key": "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/instance/afipws_test.key",
        "passphrase": "",
        "production": False
    })
    assert wsfev1.token == str(wsfev1.wsaa.credentials.token)
    assert wsfev1.sign == str(wsfev1.wsaa.credentials.sign)
    assert wsfev1.expiration_time == str(wsfev1.wsaa.header.expirationTime)
    return wsfev1


def test_CAESolicitar(wsfev1_instance):
    data = {
        "PtoVta": 3,
        "CbteTipo": 6,
        "Concepto": 1,
        "DocTipo": 99,
        "DocNro": 0,
        "CbteDesde": None,
        "CbteHasta": None,
        "CbteFch": "20240829",
        "ImpTotal": 176.25,
        "ImpTotConc": 0,
        "ImpNeto": 150,
        "ImpOpEx": 0,
        "ImpIVA": 26.25,
        "ImpTrib": 0,
        "MonId": "PES",
        "MonCotiz": 1,
        "Iva": [
            {
                "Id": 5,
                "BaseImp": 100,
                "Importe": 21
            },
            {
                "Id": 4,
                "BaseImp": 50,
                "Importe": 5.25
            }
        ]
    }
    response = wsfev1_instance.CAESolicitar(data, return_response=True, fetch_last_cbte=True)
    print(response)
    #assert isinstance(response, dict)
    #print(json.dumps(response, indent=4))
    

def test_CompUltimoAutorizado(wsfev1_instance):
    response = wsfev1_instance.CompUltimoAutorizado(3, 6)
    assert isinstance(response, int)
    print(response)


@pytest.fixture
def wsaa_instance():
    wsaa = WSAA({
        "cert": "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/instance/afipws_prod.crt",
        "key": "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/instance/afipws_prod.key",
        "passphrase": "",
        "service": "wsfe",
        "production": True
    })
    return wsaa

def test_get_ticket_access(wsaa_instance):
    response = wsaa_instance.get_ticket_access()
    assert isinstance(response, SimpleXMLElement)
    print(response.as_xml())