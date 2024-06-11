from datetime import date, datetime, timedelta
from flask import Blueprint, jsonify, request

from server.config import db
from server.core.models import AlicuotaIVA, Tributo, Articulo, TipoArticulo, TipoUnidad

articulo_bp = Blueprint('articulo_bp', __name__)


def get_select_options():
    tipo_articulo = TipoArticulo
    tipo_unidad = TipoUnidad
    alicuota_iva = AlicuotaIVA.query.all()
    tributo = Tributo.query.all()
    return {
        'tipo_articulo': list(map(lambda x: x.name, tipo_articulo)),
        'tipo_unidad': list(map(lambda x: x.name, tipo_unidad)),
        'alicuota_iva': list(map(lambda x: x.to_json(), alicuota_iva)),
        'tributo': list(map(lambda x: x.to_json(), tributo)),
    }


@articulo_bp.route('/articulos', methods=['GET'])
def index():
    articulos = Articulo.query.all()
    articulos_json = list(map(lambda x: x.to_json(), articulos))
    return jsonify({'articulos': articulos_json}), 200


@articulo_bp.route('/articulos/create', methods=['GET', 'POST'])
def create():
    if request.method == 'GET':
        return jsonify({'select_options': get_select_options()}), 200
    if request.method == 'POST':
        data = request.json
        for key, value in data.items():
            if value == '':
                data[key] = None

        articulo = Articulo(**data)
        try:
            db.session.add(articulo)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
        return 201


@articulo_bp.route('/articulos/<int:pk>', methods=['GET'])
def detail(pk):
    articulo = Articulo.query.get_or_404(pk, 'Artículo no encontrado')
    return jsonify({'articulo': articulo.to_json()}), 200


@articulo_bp.route('/articulos/<int:pk>/update', methods=['GET', 'PUT'])
def update(pk):
    articulo = Articulo.query.get_or_404(pk, 'Artículo no encontrado')
    if request.method == 'GET':
        return jsonify({'select_options': get_select_options(), 'articulo': articulo.to_json()}), 200
    if request.method == 'PUT':
        data = request.json
        for key, value in data.items():
            if value == '':
                data[key] = None

        for key, value in data.items():
            setattr(articulo, key, value)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
        return 200
