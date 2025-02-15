from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, current_user

from server.config import db
from server.core.models import Comercio, TipoResponsable, Provincia
from server.auth.decorators import permission_required
from server.utils.utils import get_select_options
from server.core.schemas import ComercioFormSchema, ComercioReadSchema
from server.core.decorators import error_handler

comercio_bp = Blueprint("comercio_bp", __name__)
comercio_schema = ComercioReadSchema()
comercio_form_schema = ComercioFormSchema()


@comercio_bp.route("/comercios", methods=["GET"])
@jwt_required()
@permission_required("comercio.view_all")
@error_handler()
def index():
    comercios = Comercio.query.all()
    comercios_dict = comercio_schema.dump(comercios, many=True)
    return jsonify({"comercios": comercios_dict}), 200


@comercio_bp.route("/comercios/create", methods=["GET", "POST"])
@jwt_required()
@permission_required("comercio.create")
@error_handler(session_rollback=True)
def create():
    if request.method == "GET":
        return jsonify(get_select_options([TipoResponsable, Provincia])), 200
    if request.method == "POST":
        data = request.json
        data["created_by"] = current_user.id
        data["updated_by"] = current_user.id
        new_comercio = comercio_form_schema.load(data, session=db.session)
        db.session.add(new_comercio)
        db.session.commit()
        return jsonify({"comercio_id": new_comercio.id}), 201


@comercio_bp.route("/comercios/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@permission_required("comercio.update")
@error_handler(session_rollback=True)
def update(pk):
    comercio = db.session.query(Comercio).get_or_404(pk, "Comercio no encontrado")
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options([TipoResponsable, Provincia]),
                    "comercio": comercio_form_schema.dump(comercio)
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        data["created_by"] = comercio.created_by
        data["updated_by"] = current_user.id
        comercio = comercio_form_schema.load(data, instance=comercio, session=db.session)
        db.session.commit()
        return jsonify({"comercio_id": comercio.id}), 200
