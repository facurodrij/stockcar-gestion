import pytest
from server.core.models import (
    AlicuotaIVA,
    Cliente,
    TipoComprobante,
    Moneda,
    TipoDocumento,
    PuntoVenta,
    Venta,
    Tributo,
    TipoTributo,
)
from server.core.controllers import VentaController
from server.tests.conftest import test_app, session


@pytest.fixture
def new_tributo(session):
    if session.query(Tributo).first():
        return session.query(Tributo).first()

    tipo_tributo = TipoTributo(
        descripcion="Impuesto",
        codigo_afip=6,
    )
    session.add(tipo_tributo)
    session.commit()

    tributo = Tributo(
        descripcion="Impuesto Municipal",
        alicuota=3.31,
        minimo_imponible=0,
        base_calculo="neto",
        tipo_tributo_id=tipo_tributo.id,
    )
    session.add(tributo)
    session.commit()
    return tributo


@pytest.fixture
def new_alicuota_iva(session):
    # Create a new AlicuotaIVA instance if not exists any
    alicuota_iva = session.query(AlicuotaIVA).filter_by(descripcion="21%").first()
    if alicuota_iva:
        return alicuota_iva
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
        nombre="Peso Argentino", simbolo="$", codigo_iso="ARS", codigo_afip="PES"
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