from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request

from server.core.models import Cliente

cliente_bp = Blueprint('cliente_bp', __name__)


@cliente_bp.route('/clientes', methods=['GET'])
def index():
    clientes = Cliente.query.all()
    clientes_json = list(map(lambda x: x.to_json(), clientes))
    return jsonify({'model': clientes_json}), 200


@cliente_bp.route('/clientes/<id>', methods=['GET'])
def detail(id):
    cliente = Cliente.query.get_or_404(id, 'Cliente no encontrado')
    return jsonify({'cliente': cliente.to_json()}), 200
