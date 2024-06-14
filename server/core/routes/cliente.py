from datetime import date, datetime, timedelta
from flask import Blueprint, jsonify, request

from server.config import db
from server.core.models import Cliente, TipoDocumento, TipoResponsable, Provincia, Genero, TipoPago, Moneda, Tributo

cliente_bp = Blueprint('cliente_bp', __name__)

model = 'clientes'


def get_select_options():
    tipo_documento = TipoDocumento.query.all()
    tipo_responsable = TipoResponsable.query.all()
    provincia = Provincia.query.all()
    genero = Genero.query.all()
    tipo_pago = TipoPago.query.all()
    moneda = Moneda.query.all()
    tributo = Tributo.query.all()
    return {
        'tipo_documento': list(map(lambda x: x.to_json(), tipo_documento)),
        'tipo_responsable': list(map(lambda x: x.to_json(), tipo_responsable)),
        'provincia': list(map(lambda x: x.to_json(), provincia)),
        'genero': list(map(lambda x: x.to_json(), genero)),
        'tipo_pago': list(map(lambda x: x.to_json(), tipo_pago)),
        'moneda': list(map(lambda x: x.to_json(), moneda)),
        'tributo': list(map(lambda x: x.to_json(), tributo))
    }


@cliente_bp.route('/clientes', methods=['GET'])
def index():
    clientes = Cliente.query.all()
    clientes_json = list(map(lambda x: x.to_json(), clientes))
    return jsonify({'clientes': clientes_json}), 200


@cliente_bp.route('/clientes/create', methods=['GET', 'POST'])
def create():
    if request.method == 'GET':
        return jsonify({'select_options': get_select_options()}), 200
    if request.method == 'POST':
        data = request.json
        cliente_json = data['cliente']
        for key, value in cliente_json.items():
            if value == '':
                cliente_json[key] = None
        if cliente_json['fecha_nacimiento']:
            cliente_json['fecha_nacimiento'] = datetime.fromisoformat(cliente_json['fecha_nacimiento'])

        cliente = Cliente(**cliente_json)

        try:
            db.session.add(cliente)
            for tributo_id in data['tributos']:
                tributo = Tributo.query.get_or_404(tributo_id)
                cliente.tributos.append(tributo)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
        return 'ok', 201


@cliente_bp.route('/clientes/<int:pk>', methods=['GET'])
def detail(pk):
    cliente = Cliente.query.get_or_404(pk, 'Cliente no encontrado')
    return jsonify({'cliente': cliente.to_json()}), 200


@cliente_bp.route('/clientes/<int:pk>/update', methods=['GET', 'PUT'])
def update(pk):
    cliente = Cliente.query.get_or_404(pk, 'Cliente no encontrado')
    if request.method == 'GET':
        return jsonify({
            'select_options': get_select_options(),
            'cliente': cliente.to_json()
        }), 200
    if request.method == 'PUT':
        data = request.json
        cliente_json = data['cliente']
        for key, value in cliente_json.items():
            if value == '':
                cliente_json[key] = None
        if cliente_json['fecha_nacimiento']:
            cliente_json['fecha_nacimiento'] = datetime.fromisoformat(cliente_json['fecha_nacimiento'])

        for key, value in cliente_json.items():
            setattr(cliente, key, value)

        cliente.tributos = []
        nuevos_tributos = Tributo.query.filter(Tributo.id.in_(data['tributos'])).all()
        for tributo in nuevos_tributos:
            cliente.tributos.append(tributo)

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
        return 'ok', 200
