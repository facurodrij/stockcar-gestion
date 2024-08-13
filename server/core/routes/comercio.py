import pytz

from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request

from server.config import db
from server.core.models import Comercio, TipoResponsable, Provincia

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
def index():
    comercios = Comercio.query.all()
    comercios_json = list(map(lambda x: x.to_json(), comercios))
    return jsonify({"comercios": comercios_json}), 200


@comercio_bp.route("/comercios/create", methods=["GET", "POST"])
def create():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        comercio_json = comercio_json_to_model(data["comercio"])
        comercio = Comercio(**comercio_json)
        try:
            db.session.add(comercio)
            db.session.commit()
            return jsonify({"comercio_id": comercio.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


@comercio_bp.route("/comercios/<int:id>/update", methods=["GET", "PUT"])
def update(id):
    comercio = Comercio.query.get_or_404(id, "Comercio no encontrado")
    if request.method == "GET":
        return (
            jsonify(
                {"select_options": get_select_options(), "comercio": comercio.to_json()}
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        comercio_json = comercio_json_to_model(data["comercio"])
        try:
            for key, value in comercio_json.items():
                setattr(comercio, key, value)
            db.session.commit()
            return jsonify({"comercio_id": comercio.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()
