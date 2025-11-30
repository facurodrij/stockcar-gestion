import pytz
from flask import jsonify
from datetime import datetime
from server.config import db
from server.core.models import (
    Compra,
    CompraItem,
    Proveedor,
    TipoComprobante,
    Articulo,
)
from server.core.schemas import CompraFormSchema
from .movimiento_stock_controller import MovimientoStockController

local_tz = pytz.timezone("America/Argentina/Buenos_Aires")
compra_form_schema = CompraFormSchema()


class CompraController:

    @staticmethod
    def create(data, session, orden: bool = False) -> int:
        """
        Crea una nueva compra en la base de datos y registra los movimientos de stock correspondientes.
        """
        compra = compra_form_schema.load(data, session=session)
        session.add(compra)
        session.flush()  # para obtener el id de la compra creada

        # Registrar movimiento de stock si no es una orden
        if not orden:
            if compra.tipo_comprobante.estado_compra is None:
                # Si el tipo de comprobante no tiene un estado de compra asociado, se asume que es confirmada
                compra.estado = "confirmada"
            else:
                compra.estado = compra.tipo_comprobante.estado_compra

            # Registrar movimiento de stock (ingreso)
            MovimientoStockController.create_movimiento_from_compra(compra)

        session.commit()
        return compra.id

    @staticmethod
    def update(data, session, instance: Compra, orden: bool = False) -> int:
        """
        Actualiza una compra en la base de datos.
        """
        articulo_ids = {i["articulo_id"] for i in data["items"]}

        # Eliminar los items de compra que no están en la lista de articulo_ids y actualizar los ids de los items que se van a actualizar.
        for item in instance.items:
            if item.articulo_id not in articulo_ids:
                session.delete(item)
            else:
                for i in data["items"]:
                    if i["articulo_id"] == item.articulo_id:
                        i["id"] = item.id
                        break
        session.commit()

        compra_form_schema.load(data, instance=instance, session=session)
        session.flush()

        # Registrar movimiento de stock si no es una orden
        if not orden:
            if instance.estado.value == "Orden":
                if instance.tipo_comprobante.estado_compra is None:
                    # Si el tipo de comprobante no tiene un estado de compra asociado, se asume que es confirmada
                    instance.estado = "confirmada"
                else:
                    instance.estado = instance.tipo_comprobante.estado_compra

                # Registrar movimiento de stock (ingreso)
                MovimientoStockController.create_movimiento_from_compra(instance)

        session.commit()
        return instance.id

    @staticmethod
    def anular(instance: Compra) -> tuple:
        """
        Anula una compra y genera el movimiento de stock inverso (egreso).
        """
        match instance.estado.value:
            case "Confirmada":
                instance.estado = "anulada"
                # Generar movimiento de stock inverso (egreso)
                MovimientoStockController.create_movimiento_from_devolucion_compra(
                    instance
                )
                db.session.commit()
                return instance.id, "Compra anulada correctamente"
            case "Orden":
                raise Exception("No se puede anular una orden de compra")
            case "Anulada":
                raise Exception("La compra ya fue anulada")
