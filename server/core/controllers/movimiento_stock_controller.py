import pytz
from datetime import datetime
from flask import request, jsonify
from server.config import db
from server.core.models import MovimientoStock, Articulo, MovimientoStockItem, Venta

local_tz = pytz.timezone("America/Argentina/Buenos_Aires")


class MovimientoStockController:

    @staticmethod
    def movimiento_json_to_model(movimiento_json: dict) -> dict:
        """
        Convierte un movimiento de stock en formato JSON a un diccionario
        con los datos necesarios para crear un objeto
        """
        for key, value in movimiento_json.items():
            if value == "":
                movimiento_json[key] = None
        if (
            "fecha_hora" in movimiento_json
            and movimiento_json["fecha_hora"] is not None
        ):
            movimiento_json["fecha_hora"] = datetime.fromisoformat(
                movimiento_json["fecha_hora"]
            ).astimezone(local_tz)
        else:
            movimiento_json["fecha_hora"] = datetime.now(tz=local_tz)
        return movimiento_json

    @staticmethod
    def create_movimiento(data):
        """
        Crea un nuevo movimiento de stock en la base de datos y
        actualiza el stock de los artículos involucrados.
        """
        try:
            movimiento_json = MovimientoStockController.movimiento_json_to_model(
                data["movimiento"]
            )
            movimiento = MovimientoStock(**movimiento_json)
            db.session.add(movimiento)
            db.session.flush()
            renglones = data["renglones"]
            for item in renglones:
                articulo = Articulo.query.get(item["articulo_id"])
                movimiento_item = MovimientoStockItem(
                    articulo=articulo,
                    movimiento_stock_id=movimiento.id,
                    codigo_principal=item["codigo_principal"],
                    cantidad=item["cantidad"],
                )
                if movimiento.tipo_movimiento == "ingreso":
                    articulo.stock_actual += item["cantidad"]
                else:
                    articulo.stock_actual -= item["cantidad"]
                movimiento_item.stock_posterior = articulo.stock_actual
                db.session.add(movimiento_item)
                db.session.add(articulo)
            db.session.commit()
            return jsonify({"movimiento_id": movimiento.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()

    @staticmethod
    def create_movimiento_from_venta(venta: Venta):
        """
        Crea un nuevo movimiento de stock en la base de datos a partir de una venta
        y actualiza el stock de los artículos involucrados.

        Importante: el `db.session.commit()` debe realizarse dentro de la función
        que llame a este método.
        """
        try:
            movimiento = MovimientoStock(
                tipo_movimiento="egreso",
                origen="venta",
                fecha_hora=datetime.now(tz=local_tz),
                observacion="Venta nro. " + str(venta.id),
            )
            db.session.add(movimiento)
            db.session.flush()
            for item in venta.items:
                articulo = Articulo.query.get(item.articulo_id)
                movimiento_item = MovimientoStockItem(
                    articulo=articulo,
                    movimiento_stock_id=movimiento.id,
                    codigo_principal=articulo.codigo_principal,
                    cantidad=item.cantidad,
                )
                articulo.stock_actual -= item.cantidad
                movimiento_item.stock_posterior = articulo.stock_actual
                db.session.add(movimiento_item)
                db.session.add(articulo)
        except Exception as e:
            db.session.rollback()
            print(e)
            raise e
