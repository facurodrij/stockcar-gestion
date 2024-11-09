from flask import Blueprint, jsonify, request, abort
from flask_jwt_extended import jwt_required, current_user

from server.config import db
from server.core.models import Proveedor, TipoDocumento, TipoResponsable, Provincia
from server.auth.decorators import permission_required
from server.core.services import AfipService
from server.utils.utils import get_select_options
from server.core.schemas import proveedor_schema

proveedor_bp = Blueprint("proveedor_bp", __name__)


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
    proveedores_dict = proveedor_schema.dump(proveedores, many=True)
    return jsonify({"proveedores": proveedores_dict}), 200


@proveedor_bp.route("/proveedores/create", methods=["GET", "POST"])
@jwt_required()
@permission_required("proveedor.create")
def create():
    """
    Crea un nuevo proveedor.
    """
    if request.method == "GET":
        return (
            jsonify(get_select_options([TipoDocumento, TipoResponsable, Provincia])),
            200,
        )
    if request.method == "POST":
        data = request.json
        try:
            data["created_by"] = current_user.id
            data["updated_by"] = current_user.id
            new_proveedor = proveedor_schema.load(data, session=db.session)
            db.session.add(new_proveedor)
            db.session.commit()
            return jsonify({"proveedor_id": new_proveedor.id}), 201
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
    proveedor: Proveedor = Proveedor.query.get_or_404(pk, "Proveedor no encontrado")
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options([TipoDocumento, TipoResponsable, Provincia]),
                    "proveedor": proveedor.to_dict(),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        try:
            data["created_by"] = proveedor.created_by
            data["updated_by"] = current_user.id
            updated_proveedor = proveedor_schema.load(
                data, instance=proveedor, session=db.session
            )
            db.session.commit()
            return jsonify({"proveedor_id": updated_proveedor.id}), 201
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
    proveedor: Proveedor = Proveedor.query.get_or_404(pk, "Proveedor no encontrado")
    return jsonify({"proveedor": proveedor.to_dict()}), 200


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
