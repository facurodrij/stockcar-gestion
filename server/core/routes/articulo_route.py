from flask import Blueprint, jsonify, request, abort
from flask_jwt_extended import jwt_required, current_user

from server.config import db
from server.core.models import (
    Articulo,
    TipoArticulo,
    TipoUnidad,
    MovimientoStock,
    MovimientoStockItem,
)
from server.auth.decorators import permission_required
from server.core.controllers import ArticuloController
from server.utils.utils import get_select_options
from server.core.schemas import (
    ArticuloIndexSchema,
    ArticuloFormSchema,
    ArticuloDetailSchema,
)
from server.core.decorators import error_handler

articulo_bp = Blueprint("articulo_bp", __name__)
articulo_index_schema = ArticuloIndexSchema()
articulo_form_schema = ArticuloFormSchema()
articulo_detail_schema = ArticuloDetailSchema()


@articulo_bp.route("/articulos", methods=["GET"])
@jwt_required()
@permission_required(["articulo.view_all"])
@error_handler()
def index():
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('pageSize', 25, type=int)

    articulos = db.paginate(db.select(Articulo), page=page, per_page=page_size)
    total = db.session.query(Articulo).count()
    return jsonify({
        "articulos": articulo_index_schema.dump(articulos, many=True),
        "total": total
    }), 200


@articulo_bp.route("/articulos/selector", methods=["GET"])
@jwt_required()
@permission_required(["articulo.view_all"])
@error_handler()
def selector():
    articulos = Articulo.query.all()
    return jsonify(articulo_index_schema.dump(articulos, many=True)), 200


@articulo_bp.route("/articulos/create", methods=["GET", "POST"])
@jwt_required()
@permission_required(["articulo.create"])
@error_handler(session_rollback=True)
def create():
    if request.method == "GET":
        return jsonify(get_select_options([TipoArticulo, TipoUnidad])), 200
    if request.method == "POST":
        data = request.json
        data["created_by"] = current_user.id
        data["updated_by"] = current_user.id
        articulo_id: int = ArticuloController.create(data, db.session)
        return jsonify("articulo_id", articulo_id), 201


@articulo_bp.route("/articulos/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@permission_required(["articulo.update"])
@error_handler(session_rollback=True)
def update(pk):
    articulo: Articulo = db.session.query(Articulo).get_or_404(
        pk, "Artículo no encontrado"
    )
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options([TipoArticulo, TipoUnidad]),
                    "articulo": articulo_form_schema.dump(articulo),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        data["created_by"] = articulo.created_by
        data["updated_by"] = current_user.id
        articulo_id: int = ArticuloController.update(data, db.session, articulo)
        return jsonify("articulo_id", articulo_id), 200


@articulo_bp.route("/articulos/<int:pk>", methods=["GET"])
@jwt_required()
@permission_required(["articulo.view"])
@error_handler()
def detail(pk):
    articulo: Articulo = db.session.query(Articulo).get_or_404(
        pk, "Artículo no encontrado"
    )
    movimientos = (
        db.session.query(MovimientoStockItem)
        .join(MovimientoStock)
        .filter(MovimientoStockItem.articulo_id == pk)
        .order_by(MovimientoStock.fecha_hora.desc())
        .limit(20)
        .all()
    )

    movimientos_json = list(map(lambda x: x.to_json(), movimientos))
    return (
        jsonify(
            {
                "articulo": articulo_detail_schema.dump(articulo),
                "movimientos": movimientos_json,
            }
        ),
        200,
    )


@articulo_bp.route("/articulos/<int:pk>/delete", methods=["DELETE"])
@jwt_required()
@permission_required(["articulo.delete"])
@error_handler(session_rollback=True)
def delete(pk):
    articulo: Articulo = db.session.query(Articulo).get_or_404(
        pk, "Artículo no encontrado"
    )
    if articulo.is_deleted():
        abort(404, "Artículo no encontrado")
    articulo.delete()
    db.session.commit()
    return jsonify({"message": "Artículo eliminado correctamente"}), 200
