from flask.config import T
import pytest
from decimal import Decimal
from server.core.models import Venta, EstadoVenta, MovimientoStock, MovimientoStockItem
from server.core.controllers import VentaController
from server.core.models.movimiento_stock import OrigenMovimiento, TipoMovimiento
from server.tests.conftest import test_app, session
from ..base_fixtures import *


@pytest.mark.usefixtures(
    "load_fixtures",
    "new_punto_venta",
    "multiple_clientes",
    "faker_articulos",
)
@pytest.mark.parametrize(
    "data",
    [
        {  # 1 item
            "cliente": 1,
            "tipo_comprobante": 5,
            "punto_venta": 1,
            "descuento": 0,
            "recargo": 0,
            "created_by": 1,
            "updated_by": 1,
            "items": [
                {
                    "articulo_id": 1,
                    "descripcion": "PRODUCTO A",
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
        {  # 2 items
            "cliente": 1,
            "tipo_comprobante": 5,
            "punto_venta": 1,
            "descuento": 0,
            "recargo": 0,
            "created_by": 1,
            "updated_by": 1,
            "items": [
                {
                    "articulo_id": 1,
                    "descripcion": "PRODUCTO A",
                    "cantidad": 1.00,
                    "precio_unidad": 200.00,
                    "alicuota_iva": 21,
                    "subtotal_iva": 34.71,
                    "subtotal_gravado": 165.29,
                    "subtotal": 200,
                },
                {
                    "articulo_id": 2,
                    "descripcion": "PRODUCTO B",
                    "cantidad": 5.00,
                    "precio_unidad": 200.00,
                    "alicuota_iva": 21,
                    "subtotal_iva": 173.55,
                    "subtotal_gravado": 826.45,
                    "subtotal": 1000,
                },
            ],
            "tributos": [],
        },
        {  # 1 item + 1 tributo
            "cliente": 1,
            "tipo_comprobante": 5,
            "punto_venta": 1,
            "descuento": 0,
            "recargo": 0,
            "created_by": 1,
            "updated_by": 1,
            "items": [
                {
                    "articulo_id": 1,
                    "descripcion": "PRODUCTO A",
                    "cantidad": 1.00,
                    "precio_unidad": 100,
                    "alicuota_iva": 21,
                    "subtotal_iva": 17.36,
                    "subtotal_gravado": 82.64,
                    "subtotal": 100.00,
                }
            ],
            "tributos": [1],  # DGR 3.31%
        },
        {  # 2 items + 1 tributo
            "cliente": 1,
            "tipo_comprobante": 5,
            "punto_venta": 1,
            "descuento": 0,
            "recargo": 0,
            "created_by": 1,
            "updated_by": 1,
            "items": [
                {
                    "articulo_id": 1,
                    "descripcion": "PRODUCTO A",
                    "cantidad": 1.00,
                    "precio_unidad": 200.00,
                    "alicuota_iva": 21,
                    "subtotal_iva": 34.71,
                    "subtotal_gravado": 165.29,
                    "subtotal": 200,
                },
                {
                    "articulo_id": 2,
                    "descripcion": "PRODUCTO B",
                    "cantidad": 5.00,
                    "precio_unidad": 200.00,
                    "alicuota_iva": 21,
                    "subtotal_iva": 173.55,
                    "subtotal_gravado": 826.45,
                    "subtotal": 1000,
                },
            ],
            "tributos": [1],  # DGR 3.31%
        },
    ],
)
def test_facturas_b(test_app, session, data):
    venta_id = VentaController.create(data, session)
    venta = session.get(Venta, venta_id)

    assert venta.id is not None
    assert venta.numero is not None
    assert venta.estado == EstadoVenta.facturado
    assert venta.cae is not None
    assert venta.vencimiento_cae is not None
    assert venta.cliente_id == data["cliente"]
    assert venta.tipo_comprobante_id == data["tipo_comprobante"]
    assert venta.punto_venta_id == data["punto_venta"]
    assert venta.descuento == data["descuento"]
    assert venta.recargo == data["recargo"]
    assert venta.created_by == data["created_by"]
    assert venta.updated_by == data["updated_by"]

    total_tributos = 0
    for tributo in venta.tributos:
        assert tributo.tipo_tributo_id is not None
        assert tributo.descripcion is not None
        assert tributo.minimo_imponible is not None
        assert tributo.alicuota is not None
        assert tributo.base_calculo is not None
        importe = venta.get_tributo_importe(tributo.id)
        total_tributos += Decimal(importe)

    total = 0
    for item in venta.items:
        assert item.articulo_id is not None
        assert item.descripcion is not None
        assert item.cantidad is not None
        assert item.precio_unidad is not None
        assert item.alicuota_iva is not None
        assert item.subtotal_iva is not None
        assert item.subtotal_gravado is not None
        assert item.subtotal is not None
        total += item.subtotal

    assert venta.total == round(total + total_tributos, 2)

    # Verify stock movement
    movimiento = (
        session.query(MovimientoStock)
        .filter_by(origen="venta", observacion=f"Venta nro. {venta.id}")
        .one_or_none()
    )
    assert movimiento is not None
    assert movimiento.tipo_movimiento == TipoMovimiento.egreso
    assert movimiento.origen == OrigenMovimiento.venta
    assert movimiento.observacion == f"Venta nro. {venta.id}"
    assert movimiento.created_by == venta.created_by
    assert movimiento.updated_by == venta.updated_by

    for item in venta.items:
        movimiento_item = (
            session.query(MovimientoStockItem)
            .filter_by(movimiento_stock_id=movimiento.id, articulo_id=item.articulo_id)
            .one_or_none()
        )
        assert movimiento_item is not None
        assert movimiento_item.cantidad == item.cantidad
        assert movimiento_item.codigo_principal == item.articulo.codigo_principal
        assert movimiento_item.stock_posterior == item.articulo.stock_actual


@pytest.mark.usefixtures(
    "load_fixtures",
    "new_punto_venta",
    "multiple_clientes",
    "faker_articulos",
)
@pytest.mark.parametrize(
    "data",
    [
        {  # 1 item, 1 tributo
            "cliente": 2,
            "tipo_comprobante": 1,
            "punto_venta": 1,
            "descuento": 0,
            "recargo": 0,
            "created_by": 1,
            "updated_by": 1,
            "items": [
                {
                    "articulo_id": 1,
                    "descripcion": "PRODUCTO A",
                    "cantidad": 1.00,
                    "precio_unidad": 100,
                    "alicuota_iva": 21,
                    "subtotal_iva": 17.36,
                    "subtotal_gravado": 82.64,
                    "subtotal": 100.00,
                }
            ],
            "tributos": [1],  # DGR 3.31%
        },
        {  # 2 items, 1 tributo
            "cliente": 2,
            "tipo_comprobante": 1,  # Factura A
            "punto_venta": 1,
            "descuento": 0,
            "recargo": 0,
            "created_by": 1,
            "updated_by": 1,
            "items": [
                {
                    "articulo_id": 1,
                    "descripcion": "PRODUCTO A",
                    "cantidad": 1.00,
                    "precio_unidad": 200.00,
                    "alicuota_iva": 21,
                    "subtotal_iva": 34.71,
                    "subtotal_gravado": 165.29,
                    "subtotal": 200,
                },
                {
                    "articulo_id": 2,
                    "descripcion": "PRODUCTO B",
                    "cantidad": 5.00,
                    "precio_unidad": 200.00,
                    "alicuota_iva": 21,
                    "subtotal_iva": 173.55,
                    "subtotal_gravado": 826.45,
                    "subtotal": 1000,
                },
            ],
            "tributos": [1],  # DGR 3.31%
        },
    ],
)
def test_facturas_a(test_app, session, data):
    venta_id = VentaController.create(data, session)
    venta = session.get(Venta, venta_id)

    assert venta.id is not None
    assert venta.numero is not None
    assert venta.cliente_id == data["cliente"]
    assert venta.tipo_comprobante_id == data["tipo_comprobante"]
    assert venta.punto_venta_id == data["punto_venta"]
    assert venta.descuento == data["descuento"]
    assert venta.recargo == data["recargo"]
    assert venta.created_by == data["created_by"]
    assert venta.updated_by == data["updated_by"]

    # Afip Service
    assert venta.tipo_comprobante.codigo_afip is not None
    assert venta.estado == venta.tipo_comprobante.estado_venta
    assert venta.cae is not None
    assert venta.vencimiento_cae is not None

    total_tributos = 0
    for tributo in venta.tributos:
        assert tributo.tipo_tributo_id is not None
        assert tributo.descripcion is not None
        assert tributo.minimo_imponible is not None
        assert tributo.alicuota is not None
        assert tributo.base_calculo is not None
        importe = venta.get_tributo_importe(tributo.id)
        total_tributos += Decimal(importe)

    total = 0
    for item in venta.items:
        assert item.articulo_id is not None
        assert item.descripcion is not None
        assert item.cantidad is not None
        assert item.precio_unidad is not None
        assert item.alicuota_iva is not None
        assert item.subtotal_iva is not None
        assert item.subtotal_gravado is not None
        assert item.subtotal is not None
        total += item.subtotal

    assert venta.total == round(total + total_tributos, 2)

    # Verify stock movement
    movimiento = (
        session.query(MovimientoStock)
        .filter_by(origen="venta", observacion=f"Venta nro. {venta.id}")
        .one_or_none()
    )
    assert movimiento is not None
    assert movimiento.tipo_movimiento == TipoMovimiento.egreso
    assert movimiento.origen == OrigenMovimiento.venta
    assert movimiento.observacion == f"Venta nro. {venta.id}"
    assert movimiento.created_by == venta.created_by
    assert movimiento.updated_by == venta.updated_by

    for item in venta.items:
        movimiento_item = (
            session.query(MovimientoStockItem)
            .filter_by(movimiento_stock_id=movimiento.id, articulo_id=item.articulo_id)
            .one_or_none()
        )
        assert movimiento_item is not None
        assert movimiento_item.cantidad == item.cantidad
        assert movimiento_item.codigo_principal == item.articulo.codigo_principal
        assert movimiento_item.stock_posterior == item.articulo.stock_actual
