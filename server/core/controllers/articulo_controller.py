from server.config import db
from server.core.models import Articulo
from server.core.controllers import MovimientoStockController
from server.core.schemas.articulo_schema import articulo_schema


class ArticuloController:
    @staticmethod
    def create(data) -> int:
        """
        Crea un nuevo artículo en la base de datos y registra un movimiento de stock
        si el stock actual del artículo es distinto de cero.
        """

        new_articulo = articulo_schema.load(data, session=db.session)
        db.session.add(new_articulo)

        if new_articulo.stock_actual != 0:
            cantidad = float(new_articulo.stock_actual)
            MovimientoStockController.create_movimiento_from_articulo(
                articulo=new_articulo, cantidad=cantidad
            )

        db.session.commit()
        return new_articulo.id

    @staticmethod
    def update(data, instance: Articulo) -> int:
        """
        Actualiza un artículo en la base de datos y registra un movimiento de stock
        si el stock actual del artículo es distinto al stock anterior.
        """

        articulo_schema.context["instance"] = instance

        stock_anterior = float(instance.stock_actual)

        updated_articulo = articulo_schema.load(
            data, instance=instance, session=db.session
        )

        stock_actual = float(updated_articulo.stock_actual)

        if stock_anterior != stock_actual:
            cantidad = stock_actual - stock_anterior
            MovimientoStockController.create_movimiento_from_articulo(
                articulo=instance, cantidad=cantidad
            )

        db.session.commit()
        return updated_articulo.id
