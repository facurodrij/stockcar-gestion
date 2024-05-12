from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request

from server.core.models import Venta, ItemVenta

venta_bp = Blueprint('venta_bp', __name__)


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


@venta_bp.route('/ventas/<id>', methods=['GET'])
def detail(id):
    venta = Venta.query.get_or_404(id, 'Venta no encontrada')
    # Obtener los items de la venta, con una query
    items = ItemVenta.query.filter_by(tipo_doc=venta.tipo_doc,
                                      letra=venta.letra,
                                      sucursal=venta.sucursal,
                                      numero=venta.numero).all()
    return jsonify({'venta': venta.to_json(), 'items': list(map(lambda x: x.to_json(), items))}), 200
