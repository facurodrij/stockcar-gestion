from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from server.config import app, db
from server.core.models import Usuario

usuario_bp = Blueprint('usuario_bp', __name__)

# Ruta de Inicio de Sesión
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = Usuario.query.filter_by(email=data['email']).first()
    if user and user.password == data['password']:  # En un caso real, verifica la contraseña hasheada
        access_token = create_access_token(identity={'email': user.email})
        return jsonify(access_token=access_token), 200
    return jsonify({"message": "Invalid credentials"}), 401

# Ruta Protegida
@app.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user = get_jwt_identity()
    user = Usuario.query.filter_by(email=current_user['email']).first()
    return jsonify({"user": user.to_json()}), 200
