from datetime import timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from server.core.models import Usuario, Rol
from server.config import db

usuario_bp = Blueprint("usuario_bp", __name__)

model = "usuarios"

def get_select_options():
    roles = Rol.query.all()
    return {
        "roles": list(map(lambda x: x.to_json(), roles)),
    }


@usuario_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = Usuario.query.filter_by(email=data["email"]).first()
    if (
        user and user.password == data["password"]
    ):  # En un caso real, verifica la contraseña hasheada
        access_token = create_access_token(identity={"email": user.email})
        return jsonify(access_token=access_token), 200
    return jsonify({"message": "Invalid credentials"}), 401


@usuario_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    current_user = get_jwt_identity()
    user = Usuario.query.filter_by(email=current_user["email"]).first()
    return jsonify({"user": user.to_json()}), 200


@usuario_bp.route("/usuarios", methods=["GET"])
@jwt_required()
def index():
    users = Usuario.query.all()
    users_json = list(map(lambda x: x.to_json(), users))
    return jsonify({"usuarios": users_json}), 200


@usuario_bp.route("/usuarios/create", methods=["GET","POST"])
@jwt_required()
def create():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        try:
            user = Usuario(**data["usuario"])
            db.session.add(user)
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
def update(pk):
    user = Usuario.query.get(pk)
    if request.method == "GET":
        return jsonify({"select_options": get_select_options(),
                        "usuario": user.to_json()}), 200
    if request.method == "PUT":
        data = request.json
        try:
            for key, value in data["usuario"].items():
                setattr(user, key, value)
            db.session.commit()
            return jsonify({"usuario_id": user.id}), 200
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()
