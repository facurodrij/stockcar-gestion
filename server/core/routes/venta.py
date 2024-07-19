import pytz
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request

from server.config import db
from server.core.models import Venta, VentaItem, Moneda, Cliente, TipoComprobante, Articulo, TipoPago

venta_bp = Blueprint('venta_bp', __name__)

model = 'ventas'

local_tz = pytz.timezone('America/Argentina/Buenos_Aires')

def get_select_options():
    cliente = Cliente.query.all()
    tipo_comprobante = TipoComprobante.query.all()
    tipo_pago = TipoPago.query.all()
    moneda = Moneda.query.all()

    return {
        'cliente': list(map(lambda x: x.to_json_min(), cliente)),
        'tipo_comprobante': list(map(lambda x: x.to_json(), tipo_comprobante)),
        'tipo_pago': list(map(lambda x: x.to_json(), tipo_pago)),
        'moneda': list(map(lambda x: x.to_json(), moneda)),
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
        venta_json['fecha_hora'] = datetime.fromisoformat(venta_json['fecha_hora']).astimezone(local_tz)
        # venta_json['vencimiento_cae'] = datetime.fromisoformat(venta_json['vencimiento_cae']) if venta_json['vencimiento_cae'] else None
        venta_json['punto_venta'] = 1
        venta_json['numero'] = 1
        venta_json['nombre_cliente'] = Cliente.query.get(venta_json['cliente_id']).razon_social

        try:
            venta = Venta(
                punto_venta=venta_json['punto_venta'],
                numero=venta_json['numero'],
                nombre_cliente=venta_json['nombre_cliente'],
                fecha_hora=venta_json['fecha_hora'],
                descuento=venta_json['descuento'],
                recargo=venta_json['recargo'],
                # total_iva=venta_json['total_iva'],
                # total_tributos=venta_json['total_tributos'],
                gravado=0,
                total=0,
                tipo_comprobante_id=venta_json['tipo_comprobante_id'],
                cliente_id=venta_json['cliente_id'],
                moneda_id=venta_json['moneda_id'],
                tipo_pago_id=venta_json['tipo_pago_id'],
                # cae=venta_json['cae'],
                # vencimiento_cae=venta_json['vencimiento_cae'],
            )
            db.session.add(venta)
            db.session.flush() # para obtener el id de la venta creada

            renglones = data['renglones']
            for item in renglones:
                articulo = Articulo.query.get(item['articulo_id'])
                ventaItem = VentaItem(
                    # TODO calcular IVA y gravado
                    articulo=articulo,
                    descripcion=item['descripcion'],
                    cantidad=item['cantidad'],
                    precio_unidad=item['precio_unidad'],
                    subtotal_iva=0,
                    subtotal_gravado=0,
                    subtotal=item['subtotal'],
                    venta_id=venta.id
                )
                db.session.add(ventaItem)
                venta.total += float(item['subtotal'])

            db.session.commit()
            return jsonify({'venta_id': venta.id}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            db.session.close()
            # TODO crar vista de Detalle de Venta y redirigir a la misma


@venta_bp.route('/ventas/<int:pk>/update', methods=['GET', 'PUT'])
def update(pk):
    venta = Venta.query.get_or_404(pk, 'Venta no encontrada')
    venta_items = VentaItem.query.filter_by(venta_id=pk).all()
    if request.method == 'GET':
        return jsonify({'select_options': get_select_options(), 'venta': venta.to_json(),
                        'renglones': list(map(lambda x: x.to_json(), venta_items))}), 200
    if request.method == 'PUT':
        data = request.json
        venta_json = data['venta']
        for key, value in venta_json.items():
            if value == '':
                venta_json[key] = None
        venta_json['fecha_hora'] = datetime.fromisoformat(venta_json['fecha_hora']).astimezone(local_tz)
        # venta_json['vencimiento_cae'] = datetime.fromisoformat(venta_json['vencimiento_cae']) if venta_json['vencimiento_cae'] else None
        venta_json['punto_venta'] = 1
        venta_json['numero'] = 1
        venta_json['nombre_cliente'] = Cliente.query.get(venta_json['cliente_id']).razon_social
        venta_json['total'] = 0

        for key, value in venta_json.items():
            setattr(venta, key, value)

        current_articulo_ids = list(map(lambda x: x.articulo_id, venta_items))
        renglones = data['renglones']
        for item in renglones:
            articulo_id = item['articulo_id']
            if articulo_id in current_articulo_ids:
                venta_item = VentaItem.query.filter_by(venta_id=pk, articulo_id=articulo_id).first()
                for key, value in item.items():
                    setattr(venta_item, key, value)
                current_articulo_ids.remove(articulo_id)
            else:
                articulo = Articulo.query.get(articulo_id)
                venta.items.append(VentaItem(
                    articulo=articulo,
                    descripcion=item['descripcion'],
                    cantidad=item['cantidad'],
                    precio_unidad=item['precio_unidad'],
                    subtotal_iva=0,
                    subtotal_gravado=0,
                    subtotal=item['subtotal']
                ))
            venta.total += float(item['subtotal'])
        for articulo_id in current_articulo_ids:
            venta_item = VentaItem.query.filter_by(venta_id=pk, articulo_id=articulo_id).first()
            db.session.delete(venta_item)

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
        return jsonify({'venta_id': venta.id}), 200
