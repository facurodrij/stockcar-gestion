import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from server.core.models import Usuario, Permiso
from server.config import db

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = Usuario.query.filter_by(email=data["email"]).first()
    if user and user.password == data["password"]:
        access_token = create_access_token(identity={"email": user.email})
        if user.is_superuser:
            permissions = list(map(lambda x: x.nombre, Permiso.query.all()))
        else:
            permissions = list(map(lambda x: x.nombre, user.permisos))
        return (
            jsonify(
                {
                    "access_token": access_token,
                    "user": user.to_json(),
                    "permissions": permissions,
                }
            ),
            200,
        )
    return jsonify({"message": "Invalid credentials"}), 401


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    current_user = get_jwt_identity()
    user = Usuario.query.filter_by(email=current_user["email"]).first()
    return jsonify({"user": user.to_json()}), 200
