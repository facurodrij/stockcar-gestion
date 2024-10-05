import pytest
import os
from pysimplesoap.client import SimpleXMLElement
from ..ws_sr_padron import WSSrPadronA13

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


@pytest.fixture
def ws_sr_padron_instance():
    ws_sr_padron = WSSrPadronA13(
        {
            "CUIT": 20428129572,
            "cert": os.path.join(BASE_DIR, "../../instance", "afipws_test.cert"),
            "key": os.path.join(BASE_DIR, "../../instance", "afipws_test.key"),
            "passphrase": "",
            "production": False,
        }
    )
    assert ws_sr_padron.token == str(ws_sr_padron.wsaa.find("credentials/token").text)
    assert ws_sr_padron.sign == str(ws_sr_padron.wsaa.find("credentials/sign").text)
    assert ws_sr_padron.expiration_time == str(ws_sr_padron.wsaa.find("header/expirationTime").text)
    return ws_sr_padron


def test_GetPersona(ws_sr_padron_instance):
    response = ws_sr_padron_instance.GetPersona(30615429038)
    print(response)

def test_ServerStatus(ws_sr_padron_instance):
    response = ws_sr_padron_instance.ServerStatus()
    print(response)
