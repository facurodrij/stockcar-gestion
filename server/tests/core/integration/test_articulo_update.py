import pytest
from server.core.controllers import ArticuloController
from server.core.models import Articulo, MovimientoStock, MovimientoStockItem
from server.core.models.movimiento_stock import TipoMovimiento, OrigenMovimiento
from server.tests.conftest import test_app, session
from ..base_fixtures import *


@pytest.mark.usefixtures("load_fixtures")
def test_articulo_update(test_app, session):
    # Create initial articulo
    initial_data = {
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

    articulo_id = ArticuloController.create(initial_data, session)
    articulo = session.get(Articulo, articulo_id)

    stock_actual = articulo.stock_actual

    # Update articulo
    update_data = {
        "codigo_principal": "TEST001_UPDATED",
        "codigo_secundario": "TEST002_UPDATED",
        "codigo_terciario": "TEST003_UPDATED",
        "codigo_cuaternario": "TEST004_UPDATED",
        "codigo_adicional": ["TEST005_UPDATED", "TEST006_UPDATED"],
        "descripcion": "Articulo de prueba actualizado",
        "linea_factura": "Linea 2",
        "stock_actual": 15.00,
        "stock_minimo": 7.00,
        "stock_maximo": 25.00,
        "observacion": "Observacion de prueba actualizada",
        "tipo_articulo_id": 2,
        "tipo_unidad_id": 2,
        "alicuota_iva_id": 2,
        "created_by": 1,
        "updated_by": 1,
    }

    ArticuloController.update(update_data, session, articulo)
    updated_articulo = session.get(Articulo, articulo_id)

    assert updated_articulo is not None
    assert updated_articulo.codigo_principal == update_data["codigo_principal"]
    assert updated_articulo.codigo_secundario == update_data["codigo_secundario"]
    assert updated_articulo.codigo_terciario == update_data["codigo_terciario"]
    assert updated_articulo.codigo_cuaternario == update_data["codigo_cuaternario"]
    assert updated_articulo.codigo_adicional == update_data["codigo_adicional"]
    assert updated_articulo.descripcion == update_data["descripcion"]
    assert updated_articulo.linea_factura == update_data["linea_factura"]
    assert updated_articulo.stock_actual == update_data["stock_actual"]
    assert updated_articulo.stock_minimo == update_data["stock_minimo"]
    assert updated_articulo.stock_maximo == update_data["stock_maximo"]
    assert updated_articulo.observacion == update_data["observacion"]
    assert updated_articulo.tipo_articulo_id == update_data["tipo_articulo_id"]
    assert updated_articulo.tipo_unidad_id == update_data["tipo_unidad_id"]
    assert updated_articulo.alicuota_iva_id == update_data["alicuota_iva_id"]
    assert updated_articulo.created_by == update_data["created_by"]
    assert updated_articulo.updated_by == update_data["updated_by"]

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
    assert movimiento.created_by == updated_articulo.created_by
    assert movimiento.updated_by == updated_articulo.updated_by

    movimiento_item = (
        session.query(MovimientoStockItem)
        .filter_by(movimiento_stock_id=movimiento.id, articulo_id=updated_articulo.id)
        .one_or_none()
    )
    assert movimiento_item is not None
    assert movimiento_item.cantidad == updated_articulo.stock_actual - stock_actual
    assert movimiento_item.codigo_principal == updated_articulo.codigo_principal
    assert movimiento_item.stock_posterior == updated_articulo.stock_actual
