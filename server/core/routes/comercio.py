import pytz

from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from server.config import db
from server.core.models import Comercio, TipoResponsable, Provincia, PuntoVenta
from server.core.decorators import admin_required

comercio_bp = Blueprint("comercio_bp", __name__)

model = "comercios"


def get_select_options():
    tipo_responsable = TipoResponsable.query.all()
    provincia = Provincia.query.all()

    return {
        "tipo_responsable": list(map(lambda x: x.to_json(), tipo_responsable)),
        "provincia": list(map(lambda x: x.to_json(), provincia)),
    }


def comercio_json_to_model(comercio_json: dict) -> dict:
    for key, value in comercio_json.items():
        if value == "":
            comercio_json[key] = None
    comercio_json["inicio_actividades"] = datetime.fromisoformat(
        comercio_json["inicio_actividades"]
    )
    return comercio_json


@comercio_bp.route("/comercios", methods=["GET"])
@jwt_required()
@admin_required
def index():
    comercios = Comercio.query.all()
    comercios_json = list(map(lambda x: x.to_json(), comercios))
    return jsonify({"comercios": comercios_json}), 200


@comercio_bp.route("/comercios/create", methods=["GET", "POST"])
@jwt_required()
@admin_required
def create():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        comercio_json = comercio_json_to_model(data["comercio"])
        try:
            comercio = Comercio(**comercio_json)
            db.session.add(comercio)
            db.session.flush()
            puntos_venta = data["puntos_venta"]
            for item in puntos_venta:
                punto_venta = PuntoVenta(
                    numero=item["numero"],
                    nombre_fantasia=item["nombre_fantasia"],
                    domicilio=item["domicilio"],
                    comercio_id=comercio.id
                )
                db.session.add(punto_venta)
            db.session.commit()
            return jsonify({"comercio_id": comercio.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


@comercio_bp.route("/comercios/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@admin_required
def update(pk):
    comercio = Comercio.query.get_or_404(pk, "Comercio no encontrado")
    puntos_venta = PuntoVenta.query.filter_by(comercio_id=pk).all()
    if request.method == "GET":
        return (
            jsonify(
                {
                    "select_options": get_select_options(),
                    "comercio": comercio.to_json(),
                    "puntos_venta": list(map(lambda x: x.to_json(), puntos_venta)),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        comercio_json = comercio_json_to_model(data["comercio"])
        try:
            for key, value in comercio_json.items():
                setattr(comercio, key, value)
            current_puntos_venta_ids = list(map(lambda x: x.id, puntos_venta))
            new_puntos_venta = data["puntos_venta"]
            for item in new_puntos_venta:
                if item["id"] in current_puntos_venta_ids:
                    punto_venta = PuntoVenta.query.get(item["id"])
                    for key, value in item.items():
                        setattr(punto_venta, key, value)
                    current_puntos_venta_ids.remove(item["id"])
                else:
                    punto_venta = PuntoVenta(
                        numero=item["numero"],
                        nombre_fantasia=item["nombre_fantasia"],
                        domicilio=item["domicilio"],
                        comercio_id=comercio.id
                    )
                    db.session.add(punto_venta)
            for id in current_puntos_venta_ids:
                punto_venta = PuntoVenta.query.get(id)
                db.session.delete(punto_venta)
            db.session.commit()
            return jsonify({"comercio_id": comercio.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()
