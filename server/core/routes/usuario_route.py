from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from server.core.models import Usuario, Permiso, usuario_permiso
from server.config import db
from server.core.decorators import permission_required

usuario_bp = Blueprint("usuario_bp", __name__)


def get_select_options():
    """
    Obtiene los datos necesarios para los campos select de los formularios de usuarios.
    """
    permisos = Permiso.query.all()
    return {"permisos": list(map(lambda x: x.to_json(), permisos))}


@usuario_bp.route("/usuarios", methods=["GET"])
@jwt_required()
@permission_required("usuario.view_all")
def index():
    users = Usuario.query.all()
    users_json = list(map(lambda x: x.to_json(), users))
    return jsonify({"usuarios": users_json}), 200


@usuario_bp.route("/usuarios/create", methods=["GET", "POST"])
@jwt_required()
@permission_required("usuario.create")
def create():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        try:
            user = Usuario(**data["usuario"])
            db.session.add(user)
            db.session.flush()
            permisos = data["permisos"]
            permisos = Permiso.query.filter(Permiso.id.in_(data["permisos"])).all()
            for permiso in permisos:
                db.session.execute(
                    usuario_permiso.insert().values(
                        usuario_id=user.id, permiso_id=permiso.id
                    )
                )
            db.session.commit()
            return jsonify({"usuario_id": user.id}), 201
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
    user = Usuario.query.get(pk)
    if request.method == "GET":
        return (
            jsonify(
                {"select_options": get_select_options(), "usuario": user.to_json()}
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        try:
            for key, value in data["usuario"].items():
                setattr(user, key, value)
            current_permiso_ids = list(map(lambda x: x.id, user.permisos))
            new_permiso_ids = data["permisos"]
            for item in new_permiso_ids:
                permiso = Permiso.query.get(item)
                if item not in current_permiso_ids:
                    db.session.execute(
                        usuario_permiso.insert().values(
                            usuario_id=user.id, permiso_id=permiso.id
                        )
                    )
            for item in current_permiso_ids:
                permiso = Permiso.query.get(item)
                if item not in new_permiso_ids:
                    db.session.execute(
                        usuario_permiso.delete()
                        .where(usuario_permiso.c.usuario_id == user.id)
                        .where(usuario_permiso.c.permiso_id == permiso.id)
                    )
            db.session.commit()
            return jsonify({"usuario_id": user.id}), 200
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()
