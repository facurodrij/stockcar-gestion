import os
import pytest
import pandas as pd
from faker import Faker

from server import BASE_DIR
from server.core.models import (
    AlicuotaIVA,
    Articulo,
    Cliente,
    TipoComprobante,
    Moneda,
    TipoDocumento,
    PuntoVenta,
    Tributo,
    TipoTributo,
    TipoResponsable,
    Provincia,
    Genero,
    TipoArticulo,
    Comercio,
    TipoUnidad,
    TipoPago,
)
from server.tests.conftest import test_app, session


@pytest.fixture
def load_fixtures(session):
    """Load data from JSON files into the database."""
    if session.query(AlicuotaIVA).count() > 0:
        return session

    for model, filename in [
        (AlicuotaIVA, "tipo_alicuota_iva.json"),
        (Comercio, "comercio.json"),
        (Genero, "genero.json"),
        (Moneda, "moneda.json"),
        (Provincia, "provincia.json"),
        (TipoArticulo, "tipo_articulo.json"),
        (TipoComprobante, "tipo_comprobante.json"),
        (TipoDocumento, "tipo_documento.json"),
        (TipoPago, "tipo_pago.json"),
        (TipoResponsable, "tipo_responsable.json"),
        (TipoTributo, "tipo_tributo.json"),
        (TipoUnidad, "tipo_unidad.json"),
        (Tributo, "tributo.json"),
    ]:
        filepath = os.path.join(BASE_DIR, "fixtures", filename)

        df = pd.read_json(filepath)
        for _, row in df.iterrows():
            record = model(**row.to_dict())
            try:
                session.add(record)
                session.commit()
            except Exception as e:
                print(f"Error loading {model.__name__}: {e}")
                session.rollback()
    return session


@pytest.fixture
def new_punto_venta(session):
    if session.query(PuntoVenta).count() > 0:
        return session.query(PuntoVenta).first()

    punto_venta = PuntoVenta(
        numero=1,
        nombre_fantasia="Test Punto de Venta",
        domicilio="Test Domicilio",
        comercio_id=1,
    )
    session.add(punto_venta)
    session.commit()
    return punto_venta


@pytest.fixture
def multiple_clientes(session):
    if session.query(Cliente).count() > 0:
        return session.query(Cliente).all()

    clientes = []
    clientes_data = [
        {
            "nro_documento": "1",
            "razon_social": "Cliente 1 (DNI)",
            "direccion": "Direccion 1",
            "localidad": "Localidad 1",
            "codigo_postal": "1234",
            "tipo_documento_id": 2,
            "tipo_responsable_id": 1,
            "provincia_id": 1,
            "created_by": 1,
            "updated_by": 1,
        },
        {
            "nro_documento": "20222222223",
            "razon_social": "Cliente 2 (CUIT)",
            "direccion": "Direccion 2",
            "localidad": "Localidad 2",
            "codigo_postal": "4321",
            "tipo_documento_id": 1,
            "tipo_responsable_id": 1,
            "provincia_id": 1,
            "created_by": 1,
            "updated_by": 1,
        },
    ]
    for data in clientes_data:
        cliente = Cliente(**data)
        session.add(cliente)
        session.commit()
        clientes.append(cliente)
    return clientes


@pytest.fixture
def faker_articulos(session):
    if session.query(Articulo).count() > 0:
        return session

    fake = Faker()
    fake_articles = []
    for _ in range(10):
        fake_article = Articulo(
            codigo_principal=fake.unique.ean13(),
            codigo_secundario=fake.ean13(),
            codigo_terciario=fake.ean13(),
            codigo_cuaternario=fake.ean13(),
            codigo_adicional=[fake.ean13() for _ in range(3)],
            descripcion=fake.text(max_nb_chars=50),
            linea_factura=fake.word(),
            stock_actual=fake.random_number(digits=5, fix_len=True),
            stock_minimo=fake.random_number(digits=3, fix_len=True),
            stock_maximo=fake.random_number(digits=5, fix_len=True),
            observacion=fake.sentence(),
            tipo_articulo_id=1,
            tipo_unidad_id=1,
            alicuota_iva_id=1,
            created_by=1,
            updated_by=1,
        )
        fake_articles.append(fake_article)
    session.bulk_save_objects(fake_articles)
    session.commit()
    return session
