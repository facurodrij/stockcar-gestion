import pytest
from decimal import Decimal
from server.core.models import Venta, EstadoVenta
from server.core.controllers import VentaController
from server.tests.conftest import test_app, session
from ..base_fixtures import *


@pytest.fixture
def new_orden_venta(session):
    """Create a new Venta instance."""
    venta = {
        "cliente": 1,
        "tipo_comprobante": 9,
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
    }
    venta_id = VentaController.create(venta, session, orden=True)
    return session.query(Venta).get(venta_id)


@pytest.mark.usefixtures(
    "load_fixtures",
    "new_punto_venta",
    "multiple_clientes",
    "faker_articulos",
    "new_orden_venta",
)
@pytest.mark.parametrize(
    "data",
    [
        {
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
            "tributos": [1],
        },
        # ...more test cases...
    ],
)
def test_orden_to_factura_a(test_app, session, data):
    """Test updating a Venta instance."""
    venta = session.query(Venta).get(1)

    venta_updated_id = VentaController.update(data, session, venta)
    venta_updated = session.query(Venta).get(venta_updated_id)

    assert venta_updated.numero is not None
    assert venta_updated.cae is not None
    assert venta_updated.vencimiento_cae is not None
    assert venta_updated.estado == EstadoVenta.facturado
    assert venta_updated.tipo_comprobante.letra == "A"


@pytest.mark.usefixtures(
    "load_fixtures",
    "new_punto_venta",
    "multiple_clientes",
    "faker_articulos",
    "new_orden_venta",
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
            "tributos": [1],
        },
        # ...more test cases...
    ],
)
def test_orden_to_factura_b(test_app, session, data):
    """Test updating a Venta instance."""
    venta = session.query(Venta).get(1)

    venta_updated_id = VentaController.update(data, session, venta)
    venta_updated = session.query(Venta).get(venta_updated_id)

    assert venta_updated.numero is not None
    assert venta_updated.cae is not None
    assert venta_updated.vencimiento_cae is not None
    assert venta_updated.estado == EstadoVenta.facturado
    assert venta_updated.tipo_comprobante.letra == "B"
    assert venta_updated.total_iva == Decimal("208.26")
    assert venta_updated.gravado == Decimal("991.74")
    assert venta_updated.items[0].subtotal == Decimal("200.00")
    assert venta_updated.items[1].subtotal == Decimal("1000.00")
