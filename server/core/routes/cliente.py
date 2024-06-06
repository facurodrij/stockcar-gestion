from datetime import date, datetime, timedelta
from flask import Blueprint, jsonify, request

from server.config import db
from server.core.models import Cliente, TipoDocumento, TipoResponsable, Provincia, Genero

cliente_bp = Blueprint('cliente_bp', __name__)

model = 'clientes'


def get_select_options():
    tipo_documento = TipoDocumento.query.all()
    tipo_responsable = TipoResponsable.query.all()
    provincia = Provincia.query.all()
    genero = Genero.query.all()
    return {
        'tipo_documento': list(map(lambda x: x.to_json(), tipo_documento)),
        'tipo_responsable': list(map(lambda x: x.to_json(), tipo_responsable)),
        'provincia': list(map(lambda x: x.to_json(), provincia)),
        'genero': list(map(lambda x: x.to_json(), genero))
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
        for key, value in data.items():
            if value == '':
                data[key] = None
        if data['fecha_nacimiento']:
            data['fecha_nacimiento'] = datetime.fromisoformat(data['fecha_nacimiento'])

        cliente = Cliente(
            nro_doc=data['nro_documento'],
            razon_social=data['razon_social'],
            direccion=data['direccion'],
            localidad=data['localidad'],
            codigo_postal=data['codigo_postal'],
            tipo_doc_id=data['tipo_documento'],
            tipo_responsable_id=data['tipo_responsable'],
            provincia_id=data['provincia'],
            genero_id=data['genero'],
            fecha_nacimiento=data['fecha_nacimiento'],
            telefono=data['telefono'],
            email=data['email'],
        )
        try:
            db.session.add(cliente)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
        return jsonify({model: cliente.to_json()}), 201


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
        for key, value in data.items():
            if value == '':
                data[key] = None
        if data['fecha_nacimiento']:
            data['fecha_nacimiento'] = datetime.fromisoformat(data['fecha_nacimiento'])

        cliente.nro_doc = data['nro_documento']
        cliente.razon_social = data['razon_social']
        cliente.direccion = data['direccion']
        cliente.localidad = data['localidad']
        cliente.codigo_postal = data['codigo_postal']
        cliente.tipo_doc_id = data['tipo_documento']
        cliente.tipo_responsable_id = data['tipo_responsable']
        cliente.provincia_id = data['provincia']
        cliente.genero_id = data['genero']
        cliente.fecha_nacimiento = data['fecha_nacimiento']
        cliente.telefono = data['telefono']
        cliente.email = data['email']
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({'error': str(e)}), 400
        return jsonify({'cliente': cliente.to_json()}), 200
