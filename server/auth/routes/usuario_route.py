from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from server.auth.models import Usuario, Permiso, usuario_permiso
from server.config import db
from server.api.decorators import permission_required

usuario_bp = Blueprint("usuario_bp", __name__)


def get_select_options(models: list = []) -> dict:
    """
    Obtiene los datos necesarios para los campos select de los formularios de usuarios.
    """
    select_options = {}

    for model in models:
        model_name = model.__tablename__
        records = model.query.all()
        select_options[model_name] = list(map(lambda x: x.to_select_dict(), records))

    return select_options


def get_datagrid_options(models: list = []) -> dict:
    """
    Obtiene los datos necesarios para las columnas de los datagrid en los formularios de usuarios.
    """
    datagrid_options = {}

    for model in models:
        model_name = model.__tablename__
        records = model.query.all()
        datagrid_options[model_name] = list(map(lambda x: x.to_dict(), records))

    return datagrid_options


@usuario_bp.route("/usuarios", methods=["GET"])
@jwt_required()
@permission_required("usuario.view_all")
def index():
    users = Usuario.query.all()
    users_dict: list = list(map(lambda x: x.to_dict(), users))
    return jsonify({"usuarios": users_dict}), 200


@usuario_bp.route("/usuarios/create", methods=["GET", "POST"])
@jwt_required()
@permission_required("usuario.create")
def create():
    if request.method == "GET":
        return (jsonify(get_datagrid_options([Permiso])), 200)
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
    user: Usuario = Usuario.query.get(pk)
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_datagrid_options([Permiso]),
                    "usuario": user.to_dict(include_relationships=True),
                }
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
