import pytest
from server.core.controllers import ArticuloController
from server.core.models import Articulo, MovimientoStock, MovimientoStockItem
from server.core.models.movimiento_stock import TipoMovimiento, OrigenMovimiento
from server.tests.conftest import test_app, session
from ..base_fixtures import *


@pytest.mark.usefixtures("load_fixtures")
def test_articulo_create(test_app, session):
    data = {
        "codigo_principal": "TEST001",
        "codigo_secundario": "TEST002",
        "codigo_terciario": "TEST003",
        "codigo_cuaternario": "TEST004",
        "codigo_adicional": ["TEST005", "TEST006"],
        "descripcion": "Articulo de prueba",
        "linea_factura": "Linea 1",
        "stock_actual": 10.00,
        "stock_minimo": 5.00,
        "stock_maximo": 20.00,
        "observacion": "Observacion de prueba",
        "tipo_articulo_id": 1,
        "tipo_unidad_id": 1,
        "alicuota_iva_id": 1,
        "created_by": 1,
        "updated_by": 1,
    }

    articulo_id = ArticuloController.create(data, session)
    articulo = session.get(Articulo, articulo_id)

    assert articulo is not None
    assert articulo.codigo_principal == data["codigo_principal"]
    assert articulo.codigo_secundario == data["codigo_secundario"]
    assert articulo.codigo_terciario == data["codigo_terciario"]
    assert articulo.codigo_cuaternario == data["codigo_cuaternario"]
    assert articulo.codigo_adicional == data["codigo_adicional"]
    assert articulo.descripcion == data["descripcion"]
    assert articulo.linea_factura == data["linea_factura"]
    assert articulo.stock_actual == data["stock_actual"]
    assert articulo.stock_minimo == data["stock_minimo"]
    assert articulo.stock_maximo == data["stock_maximo"]
    assert articulo.observacion == data["observacion"]
    assert articulo.tipo_articulo_id == data["tipo_articulo_id"]
    assert articulo.tipo_unidad_id == data["tipo_unidad_id"]
    assert articulo.alicuota_iva_id == data["alicuota_iva_id"]
    assert articulo.created_by == data["created_by"]
    assert articulo.updated_by == data["updated_by"]

    # Verify stock movement
    movimientos = (
        session.query(MovimientoStock)
        .filter_by(observacion="Ajuste de stock desde formulario de artículo")
        .all()
    )
    assert len(movimientos) > 0
    movimiento = movimientos[-1]
    assert movimiento.tipo_movimiento == TipoMovimiento.ingreso
    assert movimiento.origen == OrigenMovimiento.ajuste
    assert movimiento.observacion == "Ajuste de stock desde formulario de artículo"
    assert movimiento.created_by == articulo.created_by
    assert movimiento.updated_by == articulo.updated_by

    movimiento_item = (
        session.query(MovimientoStockItem)
        .filter_by(movimiento_stock_id=movimiento.id, articulo_id=articulo.id)
        .one_or_none()
    )
    assert movimiento_item is not None
    assert movimiento_item.cantidad == articulo.stock_actual
    assert movimiento_item.codigo_principal == articulo.codigo_principal
    assert movimiento_item.stock_posterior == articulo.stock_actual
