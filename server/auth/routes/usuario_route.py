from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError

from server.auth.models import Usuario, Permiso
from server.auth.schemas import usuario_schema
from server.config import db
from server.auth.decorators import permission_required
from server.utils.utils import get_datagrid_options

usuario_bp = Blueprint("usuario_bp", __name__)


@usuario_bp.route("/usuarios", methods=["GET"])
@jwt_required()
@permission_required("usuario.view_all")
def index():
    usuarios = Usuario.query.all()
    usuarios_dict: list = list(map(lambda x: x.to_dict(), usuarios))
    return jsonify({"usuarios": usuarios_dict}), 200


@usuario_bp.route("/usuarios/create", methods=["GET", "POST"])
@jwt_required()
@permission_required("usuario.create")
def create():
    if request.method == "GET":
        return (jsonify(get_datagrid_options([Permiso])), 200)

    if request.method == "POST":
        data = request.json
        try:
            new_usuario = usuario_schema.load(data, session=db.session)
            db.session.add(new_usuario)
            db.session.commit()
            return jsonify({"usuario_id": new_usuario.id}), 201
        except ValidationError as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": e.messages}), 400
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


@usuario_bp.route("/usuarios/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@permission_required("usuario.update")
def update(pk):
    usuario: Usuario = Usuario.query.get_or_404(pk)
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_datagrid_options([Permiso]),
                    "usuario": usuario.to_dict(include_relationships=True),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        try:
            updated_usuario = usuario_schema.load(
                data, instance=usuario, session=db.session
            )
            db.session.commit()
            return jsonify({"usuario_id": updated_usuario.id}), 200
        except ValidationError as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": e.messages}), 400
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()
