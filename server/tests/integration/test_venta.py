import pytest
from server.core.models import Cliente, TipoComprobante, PuntoVenta, Venta
from server.core.schemas import VentaFormSchema
from ..test_conftest import test_app, session


@pytest.fixture
def new_cliente(session):
    cliente = Cliente(
        nro_documento="12345678",
        razon_social="Test Cliente",
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
        nombre="Factura A",
        descripcion="Factura A",
        letra="A",
        codigo_afip=1,
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


def test_create_venta(
    test_app, new_cliente, new_tipo_comprobante, new_punto_venta, session
):
    data = {
        "numero": 1,
        "nombre_cliente": "Test Cliente",
        "cliente": new_cliente.id,
        "tipo_comprobante": new_tipo_comprobante.id,
        "punto_venta": new_punto_venta.id,
        "descuento": 0,
        "recargo": 0,
        "created_by": 1,
        "updated_by": 1,
        "items": [
            {
                "articulo_id": 5,
                "descripcion": "RULEMAN CAZOLETA-T/ ORIGINAL- ",
                "cantidad": "1.00",
                "precio_unidad": "100.00",
                "alicuota_iva": "21.00",
                "subtotal_iva": "17.36",
                "subtotal_gravado": "82.64",
                "subtotal": "100.00",
            }
        ],
        "tributos": [],
    }
    schema = VentaFormSchema()
    venta_data = schema.load(data, session=session)
    session.add(venta_data)
    session.commit()

    assert venta_data.nombre_cliente == "Test Cliente"
    assert venta_data.cliente_id == new_cliente.id
    assert venta_data.tipo_comprobante_id == new_tipo_comprobante.id


def test_update_venta(
    test_app, new_cliente, new_tipo_comprobante, new_punto_venta, session
):
    new_data = {
        "numero": 1,
        "nombre_cliente": "Test Cliente",
        "cliente": new_cliente.id,
        "tipo_comprobante": new_tipo_comprobante.id,
        "punto_venta": new_punto_venta.id,
        "descuento": 0,
        "recargo": 0,
        "created_by": 1,
        "updated_by": 1,
        "items": [
            {
                "articulo_id": 5,
                "descripcion": "RULEMAN CAZOLETA-T/ ORIGINAL- ",
                "cantidad": "1.00",
                "precio_unidad": "100.00",
                "alicuota_iva": "21.00",
                "subtotal_iva": "17.36",
                "subtotal_gravado": "82.64",
                "subtotal": "100.00",
            },
            {
                "articulo_id": 6,
                "descripcion": "RULEMAN CAZOLETA-T/ ORIGINAL- ",
                "cantidad": "1.00",
                "precio_unidad": "100.00",
                "alicuota_iva": "21.00",
                "subtotal_iva": "17.36",
                "subtotal_gravado": "82.64",
                "subtotal": "100.00",
            },
        ],
        "tributos": [],
    }
    schema = VentaFormSchema()
    venta_data = schema.load(new_data, session=session)
    session.add(venta_data)
    session.commit()
    print("Total de Venta creada: ", venta_data.total)

    venta = session.query(Venta).first()
    update_data = {
        "numero": 1,
        "nombre_cliente": "Test Cliente",
        "cliente": new_cliente.id,
        "tipo_comprobante": new_tipo_comprobante.id,
        "punto_venta": new_punto_venta.id,
        "descuento": 0,
        "recargo": 0,
        "created_by": 1,
        "updated_by": 1,
        "items": [
            {
                "articulo_id": 5,
                "descripcion": "RULEMAN CAZOLETA-T/ ORIGINAL- ",
                "cantidad": "1.00",
                "precio_unidad": "100.00",
                "alicuota_iva": "21.00",
                "subtotal_iva": "17.36",
                "subtotal_gravado": "82.64",
                "subtotal": "100.00",
            },
            {
                "articulo_id": 7,
                "descripcion": "RULEMAN CAZOLETA-T/ ORIGINAL- ",
                "cantidad": "1.00",
                "precio_unidad": "100.00",
                "alicuota_iva": "21.00",
                "subtotal_iva": "17.36",
                "subtotal_gravado": "82.64",
                "subtotal": "100.00",
            },
        ],
        "tributos": [],
    }

    # Crear un conjunto de articulo_ids para una búsqueda más rápida
    articulo_ids = {i["articulo_id"] for i in update_data["items"]}

    # Borrar los items de venta que posean un articulo_id que no esté en la lista de items a actualizar
    for item in venta.items:
        if item.articulo_id not in articulo_ids:
            session.delete(item)
        else:
            print("Item a actualizar: ", item.articulo_id)
            print("Id del item a actualizar: ", item.id)
            # Agregar atributo id al update_data del item a actualizar
            for i in update_data["items"]:
                if i["articulo_id"] == item.articulo_id:
                    i["id"] = item.id
                    break  # Salir del bucle una vez que se encuentra el item correspondiente

            # IMPORTANTE: Para que Marshmallow funcione correctamente con la relación many-to-many entre Venta y VentaItem,
            # si el articulo_id ya existe en la base de datos, se debe agregar el id del item a la lista de items
            # a actualizar en el formato {id: item.id, articulo_id: item.articulo_id, ...}.
            # Esto permite que Marshmallow identifique el item en la base de datos y lo actualice correctamente.

    session.commit()

    update_schema = VentaFormSchema()
    update_venta_data = update_schema.load(update_data, instance=venta, session=session)
    session.add(update_venta_data)
    session.commit()
    print(update_venta_data.items)
    print("Total de Venta actualizada: ", update_venta_data.total)

    assert venta_data.nombre_cliente == "Test Cliente"
    assert venta_data.cliente_id == new_cliente.id
    assert venta_data.tipo_comprobante_id == new_tipo_comprobante.id
