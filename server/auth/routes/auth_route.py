from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    current_user,
)
from server.auth.models import Usuario, Permiso
from server.config import jwt

auth_bp = Blueprint("auth_bp", __name__)


# Register a callback function that takes whatever object is passed in as the
# identity when creating JWTs and converts it to a JSON serializable format.
@jwt.user_identity_loader
def user_identity_lookup(user):
    return user["username"]


# Register a callback function that loads a user from your database whenever
# a protected route is accessed. This should return any python object on a
# successful lookup, or None if the lookup failed for any reason (for example
# if the user has been deleted from the database).
@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return Usuario.query.filter_by(username=identity).one_or_none()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user: Usuario = Usuario.query.filter_by(username=data["username"]).one_or_none()
    if user and user.password == data["password"]:
        access_token = create_access_token(identity={"username": user.username})
        if user.is_superuser:
            permissions = list(map(lambda x: x.nombre, Permiso.query.all()))
        else:
            permissions = list(map(lambda x: x.nombre, user.permisos))
        return (
            jsonify(
                {
                    "access_token": access_token,
                    "user": user.to_dict(include_relationships=True),
                    "permissions": permissions,
                }
            ),
            200,
        )
    return jsonify({"error": "Usuario o contraseña incorrectos"}), 401


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user: Usuario = current_user
    return jsonify(user.to_dict(include_relationships=True)), 200
