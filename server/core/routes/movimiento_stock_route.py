from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from server.config import db
from server.core.models import MovimientoStock
from server.core.models.movimiento_stock import TipoMovimiento, OrigenMovimiento
from server.core.decorators import permission_required

movimiento_stock_bp = Blueprint("movimiento_stock_bp", __name__)


def get_select_options():
    tipo_movimiento = [{"id": x.value, "nombre": x.name} for x in TipoMovimiento]
    origen_movimiento = [{"id": x.value, "nombre": x.name} for x in OrigenMovimiento]
    return {"tipo_movimiento": tipo_movimiento, "origen_movimiento": origen_movimiento}


@movimiento_stock_bp.route("/movimientos-stock", methods=["GET"])
@jwt_required()
@permission_required(["movimiento_stock.view_all"])
def index():
    print("GET /movimientos-stock")
    movimientos = MovimientoStock.query.all()
    movimientos_json = list(map(lambda x: x.to_json(), movimientos))
    return jsonify({"movimientos": movimientos_json}), 200
