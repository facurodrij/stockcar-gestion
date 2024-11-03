from datetime import date, datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from server.config import db
from server.models import (
    Cliente,
    TipoDocumento,
    TipoResponsable,
    Provincia,
    Genero,
    TipoPago,
    Moneda,
    Tributo
)
from server.auth.models import Usuario
from server.api.decorators import permission_required
from server.api.services import AfipService

cliente_bp = Blueprint("cliente_bp", __name__)


def get_select_options():
    """
    Obtiene los datos necesarios para los campos select de los formularios de clientes.
    """
    tipo_documento = TipoDocumento.query.all()
    tipo_responsable = TipoResponsable.query.all()
    provincia = Provincia.query.all()
    genero = Genero.query.all()
    tipo_pago = TipoPago.query.all()
    moneda = Moneda.query.all()
    tributo = Tributo.query.all()
    return {
        "tipo_documento": list(map(lambda x: x.to_json(), tipo_documento)),
        "tipo_responsable": list(map(lambda x: x.to_json(), tipo_responsable)),
        "provincia": list(map(lambda x: x.to_json(), provincia)),
        "genero": list(map(lambda x: x.to_json(), genero)),
        "tipo_pago": list(map(lambda x: x.to_json(), tipo_pago)),
        "moneda": list(map(lambda x: x.to_json(), moneda)),
        "tributo": list(map(lambda x: x.to_json(), tributo)),
    }


def cliente_json_to_model(cliente_json: dict) -> dict:
    for key, value in cliente_json.items():
        if value == "":
            cliente_json[key] = None
    if (
        "fecha_nacimiento" in cliente_json
        and cliente_json["fecha_nacimiento"] is not None
    ):
        cliente_json["fecha_nacimiento"] = datetime.fromisoformat(
            cliente_json["fecha_nacimiento"]
        )
    return cliente_json


@cliente_bp.route("/clientes", methods=["GET"])
@jwt_required()
@permission_required(["cliente.view_all"])
def index():
    clientes = Cliente.query.all()
    clientes_json = list(map(lambda x: x.to_json(), clientes))
    return jsonify({"clientes": clientes_json}), 200


@cliente_bp.route("/clientes/create", methods=["GET", "POST"])
@jwt_required()
@permission_required(["cliente.create"])
def create():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        cliente_json = cliente_json_to_model(data["cliente"])
        try:
            user = Usuario.query.filter_by(
                username=get_jwt_identity()["username"]
            ).first()
            cliente = Cliente(**cliente_json, created_by=user.id, updated_by=user.id)
            db.session.add(cliente)
            for tributo_id in data["tributos"]:
                tributo = Tributo.query.get_or_404(tributo_id)
                cliente.tributos.append(tributo)
            db.session.commit()
            return jsonify({"cliente_id": cliente.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


@cliente_bp.route("/clientes/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@permission_required(["cliente.update"])
def update(pk):
    cliente = Cliente.query.get_or_404(pk, "Cliente no encontrado")
    if request.method == "GET":
        return (
            jsonify(
                {"select_options": get_select_options(), "cliente": cliente.to_json()}
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        cliente_json = cliente_json_to_model(data["cliente"])
        try:
            user = Usuario.query.filter_by(
                username=get_jwt_identity()["username"]
            ).first()
            cliente.updated_by = user.id
            for key, value in cliente_json.items():
                setattr(cliente, key, value)
            cliente.tributos = []
            nuevos_tributos = Tributo.query.filter(
                Tributo.id.in_(data["tributos"])
            ).all()
            for tributo in nuevos_tributos:
                cliente.tributos.append(tributo)
            db.session.commit()
            return jsonify({"cliente_id": cliente.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


@cliente_bp.route("/clientes/<int:pk>", methods=["GET"])
@jwt_required()
@permission_required(["cliente.view"])
def detail(pk):
    cliente = Cliente.query.get_or_404(pk, "Cliente no encontrado")
    return jsonify({"cliente": cliente.to_json()}), 200


@cliente_bp.route("/clientes/afip", methods=["GET"])
@jwt_required()
def get_afip_data():
    """
    Obtiene los datos de un proveedor desde la API de AFIP.
    """
    try:
        nro_documento: int = int(request.args.get("nro_documento"))
        afip = AfipService()
        res = afip.get_persona(nro_documento)

        return (
            jsonify(
                {
                    "tipo_responsable_id": res["tipo_responsable_id"],
                    "razon_social": res["razon_social"],
                    "direccion": res["direccion"],
                    "localidad": res["localidad"],
                    "provincia_id": res["provincia_id"],
                    "codigo_postal": res["codigo_postal"],
                }
            ),
            200,
        )
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400
