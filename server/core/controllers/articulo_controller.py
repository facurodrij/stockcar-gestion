import pytz
from datetime import datetime
from server.core.models import MovimientoStock, Articulo, MovimientoStockItem
from server.core.schemas import ArticuloFormSchema

local_tz = pytz.timezone("America/Argentina/Buenos_Aires")
articulo_form_schema = ArticuloFormSchema()


class ArticuloController:

    @staticmethod
    def create(data, session) -> int:
        """
        Crea un nuevo artículo en la base de datos y registra un movimiento de stock
        si el stock actual del artículo es distinto de cero.
        """

        new_articulo = articulo_form_schema.load(data, session=session)
        session.add(new_articulo)

        if new_articulo.stock_actual != 0:
            cantidad = float(new_articulo.stock_actual)
            tipo_movimiento = "egreso" if cantidad < 0 else "ingreso"
            movimiento = MovimientoStock(
                tipo_movimiento=tipo_movimiento,
                origen="ajuste",
                fecha_hora=datetime.now(tz=local_tz),
                observacion="Ajuste de stock desde formulario de artículo",
                created_by=new_articulo.updated_by,
                updated_by=new_articulo.updated_by,
            )
            session.add(movimiento)

            stock_posterior = float(new_articulo.stock_actual)

            movimiento_item = MovimientoStockItem(
                articulo=new_articulo,
                movimiento_stock=movimiento,
                codigo_principal=new_articulo.codigo_principal,
                cantidad=cantidad,
                stock_posterior=stock_posterior,
            )
            session.add(movimiento_item)

        session.commit()
        return new_articulo.id

    @staticmethod
    def update(data, session, instance: Articulo) -> int:
        """
        Actualiza un artículo en la base de datos y registra un movimiento de stock
        si el stock actual del artículo es distinto al stock anterior.
        """

        articulo_form_schema.context["instance"] = instance

        stock_anterior = float(instance.stock_actual)

        updated_articulo = articulo_form_schema.load(
            data, instance=instance, session=session
        )

        stock_actual = float(updated_articulo.stock_actual)

        if stock_anterior != stock_actual:
            cantidad = stock_actual - stock_anterior
            tipo_movimiento = "egreso" if cantidad < 0 else "ingreso"
            movimiento = MovimientoStock(
                tipo_movimiento=tipo_movimiento,
                origen="ajuste",
                fecha_hora=datetime.now(tz=local_tz),
                observacion="Ajuste de stock desde formulario de artículo",
                created_by=updated_articulo.updated_by,
                updated_by=updated_articulo.updated_by,
            )
            session.add(movimiento)

            stock_posterior = float(updated_articulo.stock_actual)

            movimiento_item = MovimientoStockItem(
                articulo=updated_articulo,
                movimiento_stock=movimiento,
                codigo_principal=updated_articulo.codigo_principal,
                cantidad=cantidad,
                stock_posterior=stock_posterior,
            )
            session.add(movimiento_item)

        session.commit()
        return updated_articulo.id
