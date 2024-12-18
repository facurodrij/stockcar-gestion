import pytest
from decimal import Decimal
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
from ..base_fixtures import *


@pytest.mark.usefixtures(
    "new_tributo",
    "new_alicuota_iva",
    "new_moneda",
    "new_tipo_documento",
    "new_cliente",
    "new_tipo_comprobante",
    "new_punto_venta",
)
@pytest.mark.parametrize(
    "data",
    [
        {
            "cliente": 1,
            "tipo_comprobante": 1,
            "punto_venta": 1,
            "descuento": 0,
            "recargo": 0,
            "created_by": 1,
            "updated_by": 1,
            "items": [
                {
                    "articulo_id": 1,
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
            "cliente": 1,
            "tipo_comprobante": 1,
            "punto_venta": 1,
            "descuento": 0,
            "recargo": 0,
            "created_by": 1,
            "updated_by": 1,
            "items": [
                {
                    "articulo_id": 1,
                    "descripcion": "PRODUCTO B",
                    "cantidad": 2.00,
                    "precio_unidad": 200.00,
                    "alicuota_iva": 21,
                    "subtotal_iva": 34.72,
                    "subtotal_gravado": 165.28,
                    "subtotal": 200,
                }
            ],
            "tributos": [1],
        },
        # ...more test cases...
    ],
)
def test_create(test_app, session, data):
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
