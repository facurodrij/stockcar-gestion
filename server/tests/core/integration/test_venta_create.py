import pytest
from decimal import Decimal
from server.core.models import Venta, Cliente, PuntoVenta, TipoComprobante
from server.core.controllers import VentaController
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
        {
            "cliente": 1,
            "tipo_comprobante": 5,  # Factura B
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
        {
            "cliente": 1,
            "tipo_comprobante": 5,  # Factura B
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
        # ...more test cases...
    ],
)
def test_facturas_b(test_app, session, data):
    venta_id = VentaController.create(data, session)
    venta = session.get(Venta, venta_id)

    total_tributos = 0
    if venta.tributos:
        for tributo in venta.tributos:
            assert tributo.tipo_tributo_id is not None
            assert tributo.descripcion is not None
            assert tributo.minimo_imponible is not None
            assert tributo.alicuota is not None
            assert tributo.base_calculo is not None
            importe = venta.get_tributo_importe(tributo.id)
            total_tributos += Decimal(importe)

    assert venta.id is not None
    assert venta.numero is not None
    assert venta.cae is not None
    assert venta.vencimiento_cae is not None
    assert venta.cliente_id == data["cliente"]
    assert venta.tipo_comprobante_id == data["tipo_comprobante"]
    assert venta.punto_venta_id == data["punto_venta"]
    assert venta.descuento == data["descuento"]
    assert venta.recargo == data["recargo"]
    assert venta.created_by == data["created_by"]
    assert venta.updated_by == data["updated_by"]
    assert venta.items is not None
    total = sum([item.subtotal for item in venta.items])
    # Se debe redondear debido a que el total se redondea al agregarse a la base de datos.
    assert venta.total == round(total + total_tributos, 2)


@pytest.mark.usefixtures(
    "load_fixtures",
    "new_punto_venta",
    "multiple_clientes",
    "faker_articulos",
)
@pytest.mark.parametrize(
    "data",
    [
        {
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
                    "precio_unidad": 100,
                    "alicuota_iva": 21,
                    "subtotal_iva": 17.36,
                    "subtotal_gravado": 82.64,
                    "subtotal": 100.00,
                }
            ],
            "tributos": [1], # DGR 3.31%
        },
        {
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
            "tributos": [1], # DGR 3.31%
        },
        # ...more test cases...
    ],
)
def test_facturas_a(test_app, session, data):
    venta_id = VentaController.create(data, session)
    venta = session.get(Venta, venta_id)

    total_tributos = 0
    if venta.tributos:
        for tributo in venta.tributos:
            assert tributo.tipo_tributo_id is not None
            assert tributo.descripcion is not None
            assert tributo.minimo_imponible is not None
            assert tributo.alicuota is not None
            assert tributo.base_calculo is not None
            importe = venta.get_tributo_importe(tributo.id)
            total_tributos += Decimal(importe)

    assert venta.id is not None
    assert venta.numero is not None
    assert venta.cae is not None
    assert venta.vencimiento_cae is not None
    assert venta.cliente_id == data["cliente"]
    assert venta.tipo_comprobante_id == data["tipo_comprobante"]
    assert venta.punto_venta_id == data["punto_venta"]
    assert venta.descuento == data["descuento"]
    assert venta.recargo == data["recargo"]
    assert venta.created_by == data["created_by"]
    assert venta.updated_by == data["updated_by"]
    assert venta.items is not None
    total = sum([item.subtotal for item in venta.items])
    # Se debe redondear debido a que el total se redondea al agregarse a la base de datos.
    assert venta.total == round(total + total_tributos, 2)
