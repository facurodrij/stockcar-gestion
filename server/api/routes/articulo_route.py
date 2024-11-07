from flask import Blueprint, jsonify, request, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from server.config import db
from server.models import (
    AlicuotaIVA,
    Tributo,
    Articulo,
    TipoArticulo,
    TipoUnidad,
    MovimientoStock,
    MovimientoStockItem
)
from server.auth.models import Usuario
from server.auth.decorators import permission_required
from server.api.controllers import ArticuloController

articulo_bp = Blueprint("articulo_bp", __name__)


def get_select_options():
    """
    Obtiene los datos necesarios para los campos select de los formularios de artículos.
    """
    tipo_articulo = TipoArticulo.query.all()
    tipo_unidad = TipoUnidad.query.all()
    alicuota_iva = AlicuotaIVA.query.all()
    tributo = Tributo.query.all()
    return {
        "tipo_articulo": list(map(lambda x: x.to_json(), tipo_articulo)),
        "tipo_unidad": list(map(lambda x: x.to_json(), tipo_unidad)),
        "alicuota_iva": list(map(lambda x: x.to_json(), alicuota_iva)),
        "tributo": list(map(lambda x: x.to_json(), tributo)),
    }


@articulo_bp.route("/articulos", methods=["GET"])
@jwt_required()
@permission_required(["articulo.view_all"])
def index():
    articulos = Articulo.query.all()
    articulos_json = list(map(lambda x: x.to_json_min(), articulos))

    return jsonify({"articulos": articulos_json}), 200


@articulo_bp.route("/articulos/create", methods=["GET", "POST"])
@jwt_required()
@permission_required(["articulo.create"])
def create():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        user = Usuario.query.filter_by(username=get_jwt_identity()["username"]).first()
        data["created_by"] = user.id
        data["updated_by"] = user.id
        return ArticuloController.create_articulo(data)


@articulo_bp.route("/articulos/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@permission_required(["articulo.update"])
def update(pk):
    try:
        articulo = Articulo.query.get_or_404(pk, "Artículo no encontrado")
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400
    if request.method == "GET":
        return (
            jsonify(
                {"select_options": get_select_options(), "articulo": articulo.to_json()}
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        user = Usuario.query.filter_by(username=get_jwt_identity()["username"]).first()
        articulo.updated_by = user.id
        return ArticuloController.update_articulo(data, articulo)


@articulo_bp.route("/articulos/<int:pk>", methods=["GET"])
@jwt_required()
@permission_required(["articulo.view"])
def detail(pk):
    try:
        articulo = Articulo.query.get_or_404(pk, "Artículo no encontrado")
        movimientos = (
            MovimientoStock.query.join(MovimientoStockItem)
            .filter(MovimientoStockItem.articulo_id == pk)
            .order_by(MovimientoStock.fecha_hora.desc())
            .limit(20)
            .all()
        )
        movimientos_json = list(map(lambda x: x.to_json(), movimientos))
        return (
            jsonify({"articulo": articulo.to_json(), "movimientos": movimientos_json}),
            200,
        )
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400


@articulo_bp.route("/articulos/<int:pk>/delete", methods=["DELETE"])
@jwt_required()
@permission_required(["articulo.delete"])
def delete(pk):
    try:
        articulo: Articulo = Articulo.query.get_or_404(pk, "Artículo no encontrado")
        if articulo.is_deleted():
            abort(404, "Artículo no encontrado")
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400
    try:
        articulo.delete()
        db.session.commit()
        return jsonify({"message": "Artículo eliminado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({"error": str(e)}), 400
    finally:
        db.session.close()
