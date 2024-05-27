from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request

from server.config import db
from server.core.models import Cliente, TipoDocumento, TipoResponsable, Provincia, Genero

cliente_bp = Blueprint('cliente_bp', __name__)

model = 'clientes'


@cliente_bp.route('/clientes', methods=['GET'])
def index():
    clientes = Cliente.query.all()
    clientes_json = list(map(lambda x: x.to_json(), clientes))
    return jsonify({model: clientes_json}), 200


@cliente_bp.route('/clientes/create/', methods=['GET', 'POST'])
def create():
    if request.method == 'GET':
        tipo_documento = TipoDocumento.query.all()
        tipo_responsable = TipoResponsable.query.all()
        provincia = Provincia.query.all()
        genero = Genero.query.all()
        return jsonify({
            'tipo_documento': list(map(lambda x: x.to_json(), tipo_documento)),
            'tipo_responsable': list(map(lambda x: x.to_json(), tipo_responsable)),
            'provincia': list(map(lambda x: x.to_json(), provincia)),
            'genero': list(map(lambda x: x.to_json(), genero))
        }), 200
    if request.method == 'POST':
        data = request.json
        cliente = Cliente(
            nro_doc=data['nro_documento'],
            razon_social=data['razon_social'],
            direccion=data['direccion'],
            localidad=data['localidad'],
            codigo_postal=data['codigo_postal'],
            tipo_doc_id=data['tipo_documento'],
            tipo_responsable_id=data['tipo_responsable'],
            provincia_id=data['provincia'],
            genero_id=data.get('genero'),
            fecha_nacimiento=datetime.strptime(data.get('fecha_nacimiento'), '%Y-%m-%d') if data.get(
                'fecha_nacimiento') else None,
            telefono=data.get('telefono'),
            email=data.get('email'),
        )
        try:
            db.session.add(cliente)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
        return jsonify({model: cliente.to_json()}), 201


@cliente_bp.route('/clientes/<id>', methods=['GET'])
def detail(id):
    cliente = Cliente.query.get_or_404(id, 'Cliente no encontrado')
    return jsonify({model: cliente.to_json()}), 200
