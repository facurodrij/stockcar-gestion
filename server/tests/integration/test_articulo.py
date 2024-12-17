import pytest
from server.core.models import Articulo
from ..conftest import test_app, session


@pytest.fixture(scope="module")
def new_articulo_data():
    return {
        "codigo_principal": "0001",
        "codigo_secundario": "0001",
        "codigo_terciario": "0001",
        "codigo_cuaternario": "0001",
        "codigo_adicional": ["0001"],
        "descripcion": "Test Articulo",
        "linea_factura": "Test Linea Factura",
        "stock_actual": 10,
        "stock_minimo": 5,
        "stock_maximo": 20,
        "observacion": "Test Observacion",
        "tipo_articulo_id": 1,
        "tipo_unidad_id": 1,
        "alicuota_iva_id": 1,
        "created_by": 1,
        "updated_by": 1,
    }


def test_create_articulo(test_app, new_articulo_data, session):
    with test_app.app_context():
        articulo = Articulo(**new_articulo_data)
        test_app.db.session.add(articulo)
        test_app.db.session.commit()

        assert articulo.id is not None
        assert articulo.codigo_principal == new_articulo_data["codigo_principal"]
        assert articulo.codigo_secundario == new_articulo_data["codigo_secundario"]
        assert articulo.codigo_terciario == new_articulo_data["codigo_terciario"]
        assert articulo.codigo_cuaternario == new_articulo_data["codigo_cuaternario"]
        assert articulo.codigo_adicional == new_articulo_data["codigo_adicional"]
        assert articulo.descripcion == new_articulo_data["descripcion"]
        assert articulo.linea_factura == new_articulo_data["linea_factura"]
        assert articulo.stock_actual == new_articulo_data["stock_actual"]
        assert articulo.stock_minimo == new_articulo_data["stock_minimo"]
        assert articulo.stock_maximo == new_articulo_data["stock_maximo"]
        assert articulo.observacion == new_articulo_data["observacion"]
        assert articulo.tipo_articulo_id == new_articulo_data["tipo_articulo_id"]
        assert articulo.tipo_unidad_id == new_articulo_data["tipo_unidad_id"]
        assert articulo.alicuota_iva_id == new_articulo_data["alicuota_iva_id"]
