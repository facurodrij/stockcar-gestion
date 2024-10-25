from flask import jsonify
from server.config import db
from server.models import Articulo, Tributo
from server.api.controllers import MovimientoStockController


class ArticuloController:

    @staticmethod
    def articulo_json_to_model(articulo_json: dict) -> dict:
        for key, value in articulo_json.items():
            if value == "":
                articulo_json[key] = None
        return articulo_json

    @staticmethod
    def create_articulo(data):
        try:
            articulo_json = ArticuloController.articulo_json_to_model(data["articulo"])
            force = data.get("force", False)

            # Verificar si ya existen artículos con el mismo código principal
            codigo_principal = articulo_json.get("codigo_principal")
            if codigo_principal and not force:
                articulos_existentes = Articulo.query.filter_by(
                    codigo_principal=codigo_principal
                ).all()
                if articulos_existentes:
                    ids_existentes = [articulo.id for articulo in articulos_existentes]
                    return (
                        jsonify(
                            {
                                "warning": "Ya existen Artículos con el mismo código principal",
                                "ids": ids_existentes,
                            }
                        ),
                        409,
                    )

            articulo = Articulo(
                **articulo_json,
                created_by=data["created_by"],
                updated_by=data["updated_by"]
            )

            if articulo.stock_actual != 0:
                cantidad = float(articulo.stock_actual)
                MovimientoStockController.create_movimiento_from_articulo(
                    articulo, cantidad
                )

            db.session.add(articulo)
            for tributo_id in data["tributos"]:
                tributo = Tributo.query.get_or_404(tributo_id)
                articulo.tributos.append(tributo)
            db.session.commit()
            return jsonify({"articulo_id": articulo.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()

    @staticmethod
    def update_articulo(data, articulo: Articulo):
        try:
            articulo_json = ArticuloController.articulo_json_to_model(data["articulo"])
            force = data.get("force", False)

            # Verificar si ya existen artículos con el mismo código principal
            codigo_principal = articulo_json.get("codigo_principal")
            if (
                codigo_principal
                and codigo_principal != articulo.codigo_principal
                and not force
            ):
                articulos_existentes = Articulo.query.filter_by(
                    codigo_principal=codigo_principal
                ).all()
                if articulos_existentes:
                    ids_existentes = [articulo.id for articulo in articulos_existentes]
                    return (
                        jsonify(
                            {
                                "warning": "Existen Artículos con el mismo código principal",
                                "ids": ids_existentes,
                            }
                        ),
                        409,
                    )

            if float(articulo.stock_actual) != float(articulo_json.get("stock_actual")):
                cantidad = float(articulo_json.get("stock_actual")) - float(
                    articulo.stock_actual
                )
                MovimientoStockController.create_movimiento_from_articulo(
                    articulo, cantidad
                )

            for key, value in articulo_json.items():
                setattr(articulo, key, value)
            articulo.tributos = []
            nuevos_tributos = Tributo.query.filter(
                Tributo.id.in_(data["tributos"])
            ).all()
            for tributo in nuevos_tributos:
                articulo.tributos.append(tributo)
            db.session.commit()
            return jsonify({"articulo_id": articulo.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()
