from flask import Blueprint, jsonify, request, abort
from flask_jwt_extended import jwt_required, get_jwt_identity

from server.config import db
from server.core.models import (
    Proveedor,
    TipoDocumento,
    TipoResponsable,
    Provincia,
    Usuario,
)
from server.core.decorators import permission_required
from server.core.services import AfipService

proveedor_bp = Blueprint("proveedor_bp", __name__)


def get_select_options():
    """
    Obtiene los datos necesarios para los campos select de los formularios de proveedores.
    """
    tipo_documento = TipoDocumento.query.all()
    tipo_responsable = TipoResponsable.query.all()
    provincia = Provincia.query.all()
    return {
        "tipo_documento": list(map(lambda x: x.to_json(), tipo_documento)),
        "tipo_responsable": list(map(lambda x: x.to_json(), tipo_responsable)),
        "provincia": list(map(lambda x: x.to_json(), provincia)),
    }


def proveedor_json_to_model(proveedor_json: dict) -> dict:
    """
    Convierte los datos obtenidos del formulario a un diccionario
    """
    for key, value in proveedor_json.items():
        if value == "":
            proveedor_json[key] = None
    return proveedor_json


@proveedor_bp.route("/proveedores", methods=["GET"])
@jwt_required()
@permission_required("proveedor.view_all")
def index():
    """
    Devuelve la lista de proveedores.
    """
    proveedores = Proveedor.query.all()
    proveedores_json = list(map(lambda x: x.to_json(), proveedores))
    return jsonify({"proveedores": proveedores_json}), 200


@proveedor_bp.route("/proveedores/create", methods=["GET", "POST"])
@jwt_required()
@permission_required("proveedor.create")
def create():
    """
    Crea un nuevo proveedor.
    """
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        proveedor_json = proveedor_json_to_model(data["proveedor"])
        try:
            user = Usuario.query.filter_by(
                username=get_jwt_identity()["username"]
            ).first()
            proveedor = Proveedor(
                **proveedor_json, created_by=user.id, updated_by=user.id
            )
            db.session.add(proveedor)
            db.session.commit()
            return jsonify({"proveedor_id": proveedor.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


@proveedor_bp.route("/proveedores/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@permission_required("proveedor.update")
def update(pk):
    proveedor = Proveedor.query.get_or_404(pk, "Proveedor no encontrado")
    if request.method == "GET":
        return (
            jsonify(
                {
                    "select_options": get_select_options(),
                    "proveedor": proveedor.to_json(),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        proveedor_json = proveedor_json_to_model(data["proveedor"])
        try:
            user = Usuario.query.filter_by(
                username=get_jwt_identity()["username"]
            ).first()
            proveedor.updated_by = user.id
            for key, value in proveedor_json.items():
                setattr(proveedor, key, value)
            db.session.commit()
            return jsonify({"proveedor_id": proveedor.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


@proveedor_bp.route("/proveedores/<int:pk>", methods=["GET"])
@jwt_required()
@permission_required("proveedor.view")
def detail(pk):
    proveedor = Proveedor.query.get_or_404(pk, "Proveedor no encontrado")
    return jsonify({"proveedor": proveedor.to_json()}), 200


@proveedor_bp.route("/proveedores/<int:pk>/delete", methods=["DELETE"])
@jwt_required()
@permission_required("proveedor.delete")
def delete(pk):
    try:
        proveedor: Proveedor = Proveedor.query.get_or_404(pk, "Proveedor no encontrado")
        if proveedor.is_deleted():
            abort(404, "Proveedor no encontrado")
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400
    try:
        proveedor.delete()
        db.session.commit()
        return jsonify({"message": "Proveedor eliminado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({"error": str(e)}), 400
    finally:
        db.session.close()


@proveedor_bp.route("/proveedores/afip", methods=["GET"])
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
