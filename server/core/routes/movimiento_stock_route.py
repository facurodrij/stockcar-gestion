from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from server.config import db
from server.core.models import MovimientoStock, MovimientoStockItem, Usuario
from server.core.models.movimiento_stock import TipoMovimiento, OrigenMovimiento
from server.core.decorators import permission_required
from server.core.controllers import MovimientoStockController

movimiento_stock_bp = Blueprint("movimiento_stock_bp", __name__)


def get_select_options():
    """
    Obtiene los datos necesarios para los campos select de los formularios de movimientos de stock.
    """
    tipo_movimiento = [{"id": x.name, "nombre": x.value} for x in TipoMovimiento]
    origen = [{"id": x.name, "nombre": x.value} for x in OrigenMovimiento]
    return {"tipo_movimiento": tipo_movimiento, "origen": origen}


@movimiento_stock_bp.route("/movimientos-stock", methods=["GET"])
@jwt_required()
@permission_required(["movimiento_stock.view_all"])
def index():
    movimientos = MovimientoStock.query.all()
    movimientos_json = list(map(lambda x: x.to_json(), movimientos))
    return jsonify({"movimientos": movimientos_json}), 200


@movimiento_stock_bp.route("/movimientos-stock/create", methods=["GET", "POST"])
@jwt_required()
@permission_required(["movimiento_stock.create"])
def create():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        user = Usuario.query.filter_by(username=get_jwt_identity()["username"]).first()
        data["created_by"] = user.id
        data["updated_by"] = user.id
        return MovimientoStockController.create_movimiento(data)


@movimiento_stock_bp.route("/movimientos-stock/<int:pk>", methods=["GET", "DELETE"])
@jwt_required()
@permission_required(["movimiento_stock.view"])
def detail(pk):
    movimiento = MovimientoStock.query.get_or_404(
        pk, "No se encontró el movimiento de stock solicitado."
    )
    movimiento_items = MovimientoStockItem.query.filter_by(movimiento_stock_id=pk).all()
    if request.method == "GET":
        return (
            jsonify(
                {
                    "movimiento": movimiento.to_json(),
                    "renglones": list(map(lambda x: x.to_json(), movimiento_items)),
                }
            ),
            200,
        )
