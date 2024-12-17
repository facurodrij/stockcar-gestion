import pytest
from server.core.models import AlicuotaIVA, Cliente, TipoComprobante, Moneda, TipoDocumento, PuntoVenta, Venta
from server.core.controllers import VentaController
from ..conftest import test_app, session

@pytest.fixture
def new_alicuota_iva(session):
    alicuota_iva = AlicuotaIVA(
        descripcion="21%",
        porcentaje=21,
        codigo_afip=5,
    )
    session.add(alicuota_iva)
    session.commit()
    return alicuota_iva


@pytest.fixture
def new_moneda(session):
    moneda = Moneda(
        nombre="Peso Argentino",
        simbolo="$",
        codigo_iso="ARS",
        codigo_afip="PES"
    )
    session.add(moneda)
    session.commit()
    return moneda


@pytest.fixture
def new_tipo_documento(session):
    tipo_documento = TipoDocumento(
        descripcion="Documento Nacional de Identidad",
        codigo_afip=96,
    )
    session.add(tipo_documento)
    session.commit()
    return tipo_documento


@pytest.fixture
def new_cliente(session):
    cliente = Cliente(
        nro_documento="1",
        razon_social="Consumidor Final",
        direccion="Test Direccion",
        localidad="Test Localidad",
        codigo_postal="1234",
        tipo_documento_id=1,
        tipo_responsable_id=1,
        provincia_id=1,
        created_by=1,
        updated_by=1,
    )
    session.add(cliente)
    session.commit()
    return cliente


@pytest.fixture
def new_tipo_comprobante(session):
    tipo_comprobante = TipoComprobante(
        nombre="Remito",
        descripcion="Remito",
        letra="R",
        codigo_afip=6,
        descontar_stock=False,
    )
    session.add(tipo_comprobante)
    session.commit()
    return tipo_comprobante


@pytest.fixture
def new_punto_venta(session):
    punto_venta = PuntoVenta(
        numero=1,
        nombre_fantasia="Test Punto de Venta",
        domicilio="Test Domicilio",
        comercio_id=1,
    )
    session.add(punto_venta)
    session.commit()
    return punto_venta


@pytest.mark.usefixtures("new_alicuota_iva", "new_moneda", "new_tipo_documento", "new_cliente", "new_tipo_comprobante", "new_punto_venta")
@pytest.mark.parametrize("data", [
    {
        "numero": 1,
        "cliente": 1,
        "tipo_comprobante": 1,
        "punto_venta": 1,
        "descuento": 0,
        "recargo": 0,
        "created_by": 1,
        "updated_by": 1,
        "items": [
            {
                "articulo_id": 5,
                "descripcion": "RULEMAN CAZOLETA-T/ ORIGINAL- ",
                "cantidad": 1.00,
                "precio_unidad": 100,
                "alicuota_iva": 21,
                "subtotal_iva": 17.36,
                "subtotal_gravado": 82.64,
                "subtotal": 100.00,
            }
        ],
        "tributos": [],
    },
    {
        "numero": 2,
        "cliente": 1,
        "tipo_comprobante": 1,
        "punto_venta": 1,
        "descuento": 10,
        "recargo": 5,
        "created_by": 1,
        "updated_by": 1,
        "items": [
            {
                "articulo_id": 6,
                "descripcion": "PRODUCTO B",
                "cantidad": 2.00,
                "precio_unidad": 200.00,
                "alicuota_iva": 21,
                "subtotal_iva": 34.72,
                "subtotal_gravado": 165.28,
                "subtotal": 200,
            }
        ],
        "tributos": [],
    },
    # ...more test cases...
])


def test_create_venta(test_app, session, data):
    venta_id = VentaController.create(data, session)
    venta = session.get(Venta, venta_id)
    print(venta.estado)

    assert venta is not None
    assert venta.id == venta_id
    assert venta.cae is not None
