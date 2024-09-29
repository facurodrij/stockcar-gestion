import pytest
import os
from pysimplesoap.client import SimpleXMLElement
from .wsfev1 import WSFEv1
from .wsaa import WSAA

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


@pytest.fixture
def wsfev1_instance():
    wsfev1 = WSFEv1(
        {
            "CUIT": 20428129572,
            "cert": os.path.join(BASE_DIR, "../instance", "afipws_test.cert"),
            "key": os.path.join(BASE_DIR, "../instance", "afipws_test.key"),
            "passphrase": "",
            "production": False,
        }
    )
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
            {"Id": 5, "BaseImp": 100, "Importe": 21},
            {"Id": 4, "BaseImp": 50, "Importe": 5.25},
        ],
    }
    response = wsfev1_instance.CAESolicitar(
        data, return_response=True, fetch_last_cbte=True
    )
    print(response)


def test_CompUltimoAutorizado(wsfev1_instance):
    response = wsfev1_instance.CompUltimoAutorizado(3, 6)
    assert isinstance(response, int)
    print(response)


def test_ParamGetTiposCbte(wsfev1_instance):
    response = wsfev1_instance.ParamGetTiposCbte(return_response=False)
    assert isinstance(response, list)
    print(response)


def test_ParamGetTiposConcepto(wsfev1_instance):
    response = wsfev1_instance.ParamGetTiposConcepto(return_response=False)
    assert isinstance(response, list)
    print(response)


def test_ParamGetTiposDoc(wsfev1_instance):
    response = wsfev1_instance.ParamGetTiposDoc(return_response=False)
    assert isinstance(response, list)
    print(response)


def test_ParamGetTiposIva(wsfev1_instance):
    response = wsfev1_instance.ParamGetTiposIva(return_response=False)
    assert isinstance(response, list)
    print(response)


def test_ParamGetTiposMonedas(wsfev1_instance):
    response = wsfev1_instance.ParamGetTiposMonedas(return_response=False)
    assert isinstance(response, list)
    print(response)


def test_ParamGetTiposOpcional(wsfev1_instance):
    response = wsfev1_instance.ParamGetTiposOpcional(return_response=False)
    assert isinstance(response, list)
    print(response)


def test_ParamGetTiposTributos(wsfev1_instance):
    response = wsfev1_instance.ParamGetTiposTributos(return_response=False)
    assert isinstance(response, list)
    print(response)


def test_ParamGetPtosVenta(wsfev1_instance):
    response = wsfev1_instance.ParamGetPtosVenta(return_response=False)
    assert isinstance(response, list)
    print(response)


def test_Dummy(wsfev1_instance):
    response = wsfev1_instance.Dummy()
    print(response)


def test_ParamGetTiposPaises(wsfev1_instance):
    response = wsfev1_instance.ParamGetTiposPaises(return_response=False)
    assert isinstance(response, list)
    print(response)


def test_ParamGetActividades(wsfev1_instance):
    response = wsfev1_instance.ParamGetActividades(return_response=False)
    assert isinstance(response, list)
    print(response)
