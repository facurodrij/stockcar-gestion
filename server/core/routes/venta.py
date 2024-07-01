from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request

from server.config import db
from server.core.models import Venta, VentaItem, Provincia, Cliente, TipoComprobante

venta_bp = Blueprint('venta_bp', __name__)

model = 'ventas'


def get_select_options():
    cliente = Cliente.query.all()
    tipo_comprobante = TipoComprobante.query.all()

    return {
        'cliente': list(map(lambda x: x.to_json_min(), cliente)),
        'tipo_comprobante': list(map(lambda x: x.to_json(), tipo_comprobante)),
    }


@venta_bp.route('/ventas', methods=['GET'])
def index():
    fecha_desde = request.args.get('desde')
    fecha_hasta = request.args.get('hasta')

    if fecha_desde and fecha_hasta:
        ventas = Venta.query.filter(Venta.fecha.between(
            datetime.fromisoformat(fecha_desde),
            (datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1))))
    elif fecha_desde:
        ventas = Venta.query.filter(Venta.fecha >= datetime.fromisoformat(fecha_desde))
    elif fecha_hasta:
        ventas = Venta.query.filter(
            Venta.fecha <= datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1))
    else:
        ventas = Venta.query.all()

    ventas_json = list(map(lambda x: x.to_json(), ventas))
    return jsonify({'ventas': ventas_json}), 200


@venta_bp.route('/ventas/create', methods=['GET', 'POST'])
def create():
    if request.method == 'GET':
        return jsonify({'select_options': get_select_options()}), 200
    if request.method == 'POST':
        data = request.json
        venta_json = data['venta']
        for key, value in venta_json.items():
            if value == '':
                venta_json[key] = None
        venta_json['fecha_hora'] = datetime.fromisoformat(venta_json['fecha_hora'])

        venta = Venta(**venta_json)

        return jsonify({'message': 'Venta creada'}), 201


@venta_bp.route('/ventas/<int:pk>', methods=['GET'])
def detail(pk):
    venta = Venta.query.get_or_404(pk, 'Venta no encontrada')
    # Obtener los items de la venta, con una query
    items = VentaItem.query.filter_by(tipo_doc=venta.tipo_doc,
                                      letra=venta.letra,
                                      sucursal=venta.sucursal,
                                      numero=venta.numero).all()
    return jsonify({'venta': venta.to_json(), 'items': list(map(lambda x: x.to_json(), items))}), 200


@venta_bp.route('/ventas/<int:pk>/update', methods=['GET', 'PUT'])
def update(pk):
    venta = Venta.query.get_or_404(pk, 'Venta no encontrada')
    if request.method == 'GET':
        return jsonify({'select_options': get_select_options(), model: venta.to_json()}), 200
    if request.method == 'PUT':
        data = request.json
        for key, value in data.items():
            if value == '':
                data[key] = None
        return jsonify({'message': 'Venta actualizada'}), 200
