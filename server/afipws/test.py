import pytest
import json
from .wsfev1 import WSFEv1
from .wsaa import WSAA

@pytest.fixture
def wsfev1_instance():
    wsfev1 = WSFEv1({
        "CUIT": 20428129572,
        "cert": "/workspaces/stockcar-gestion/server/instance/afipws_test.cert",
        "key": "/workspaces/stockcar-gestion/server/instance/afipws_test.key",
        "passphrase": "",
        "production": False
    })
    assert wsfev1.token == str(wsfev1.wsaa.credentials.token)
    assert wsfev1.sign == str(wsfev1.wsaa.credentials.sign)
    assert wsfev1.expiration_time == str(wsfev1.wsaa.header.expirationTime)
    return wsfev1


def test_CAESolicitar(wsfev1_instance):
    data = {
        "PtoVta": 1,
        "CbteTipo": 6,
        "Concepto": 1,
        "DocTipo": 99,
        "DocNro": 0,
        "CbteDesde": None,
        "CbteHasta": None,
        "CbteFch": "20240802",
        "ImpTotal": 10,
        "ImpTotConc": 0,
        "ImpNeto": 8.26, 
        "ImpOpEx": 0,
        "ImpIVA": 1.73,
        "ImpTrib": 0,
        "MonId": "PES",
        "MonCotiz": 1,
        "Iva": [
            {
                "Id": 5,
                "BaseImp": 8.26,
                "Importe": 1.73
            }
        ]
    }
    response = wsfev1_instance.CAESolicitar(data, return_response=False, fetch_last_cbte=True)
    assert isinstance(response, dict)
    print(json.dumps(response, indent=4))
    

def test_CompUltimoAutorizado(wsfev1_instance):
    response = wsfev1_instance.CompUltimoAutorizado(1, 6)
    assert isinstance(response, int)
    print(response)
