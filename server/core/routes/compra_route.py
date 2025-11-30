from io import BytesIO
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, current_user
from flask_sqlalchemy.query import Query
from flask_sqlalchemy.pagination import Pagination

from server.core.models import (
    Compra,
    Moneda,
    Proveedor,
    TipoComprobante,
    TipoPago,
    EstadoCompra,
    PuntoVenta,
    AlicuotaIVA,
    CompraItem,
)
from server.config import db
from server.utils.utils import get_select_options, get_datagrid_options
from server.auth.decorators import permission_required
from server.core.controllers import CompraController
from server.core.schemas import (
    CompraIndexSchema,
    CompraFormSchema,
    CompraDetailSchema,
    CompraItemSchema,
)
from server.core.decorators import error_handler

compra_bp = Blueprint("compra_bp", __name__)
compra_index_schema = CompraIndexSchema()
compra_form_schema = CompraFormSchema()
compra_detail_schema = CompraDetailSchema()
compra_item_schema = CompraItemSchema()


@compra_bp.route("/compras", methods=["GET"])
@jwt_required()
@permission_required("compra.view_all")
@error_handler()
def index():
    fecha_desde = request.args.get("desde", None, type=str)
    fecha_hasta = request.args.get("hasta", None, type=str)
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 25, type=int)

    query = Compra.query

    if fecha_desde and fecha_hasta:
        query = query.filter(
            Compra.fecha_hora.between(
                datetime.fromisoformat(fecha_desde),
                (datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)),
            )
        )
    elif fecha_desde:
        query = query.filter(Compra.fecha_hora >= datetime.fromisoformat(fecha_desde))
    elif fecha_hasta:
        query = query.filter(
            Compra.fecha_hora
            <= datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)
        )

    query = query.order_by(Compra.fecha_hora.desc())

    compras: Pagination = query.paginate(page=page, per_page=page_size)

    if not compras.items:
        return

    return (
        jsonify(
            {
                "compras": compra_index_schema.dump(compras.items, many=True),
                "total": compras.total,
            }
        ),
        200,
    )


@compra_bp.route("/compras/create", methods=["GET", "POST"])
@jwt_required()
@permission_required("compra.create")
@error_handler(session_rollback=True)
def create():
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options(
                        [
                            Proveedor,
                            Moneda,
                            PuntoVenta,
                            TipoComprobante,
                            TipoPago,
                            AlicuotaIVA,
                        ]
                    ),
                }
            ),
            200,
        )
    if request.method == "POST":
        data = request.json
        data["created_by"] = current_user.id
        data["updated_by"] = current_user.id
        compra_id = CompraController.create(data, db.session)
        return jsonify({"compra_id": compra_id}), 201


@compra_bp.route("/compras/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@permission_required("compra.update")
@error_handler(session_rollback=True)
def update(pk):
    compra: Compra = db.session.query(Compra).get_or_404(pk, "Compra no encontrada")
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options(
                        [
                            Proveedor,
                            Moneda,
                            PuntoVenta,
                            TipoComprobante,
                            TipoPago,
                            AlicuotaIVA,
                        ]
                    ),
                    "compra": compra_form_schema.dump(compra),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        data["created_by"] = compra.created_by
        data["updated_by"] = current_user.id
        compra_id = CompraController.update(data, db.session, compra)
        return jsonify({"compra_id": compra_id}), 200


@compra_bp.route("/compras/<int:pk>", methods=["GET", "POST", "DELETE"])
@jwt_required()
@permission_required("compra.view")
@error_handler()
def detail(pk):
    compra: Compra = db.session.query(Compra).get_or_404(pk, "Compra no encontrada")
    if request.method == "GET":
        return (
            jsonify(
                {
                    "compra": compra_detail_schema.dump(compra),
                }
            ),
            200,
        )
    if request.method == "POST":
        data = request.json
        match data["action"]:
            case "anular":
                compra.updated_by = current_user.id
                compra_id, message = CompraController.anular(compra)
                return jsonify({"compra_id": compra_id, "message": message}), 200
    if request.method == "DELETE":
        if compra.is_deleted():
            return jsonify({"error": "La compra ya fue eliminada"}), 400
        compra.delete()
        db.session.commit()
        return jsonify({"message": "Compra eliminada correctamente"}), 200


@compra_bp.route("/compras-orden", methods=["GET"])
@jwt_required()
@error_handler()
def index_orden():
    fecha_desde = request.args.get("desde")
    fecha_hasta = request.args.get("hasta")
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 25, type=int)

    query = Compra.query.filter_by(estado="orden")

    if fecha_desde and fecha_hasta:
        query = query.filter(
            Compra.fecha_hora.between(
                datetime.fromisoformat(fecha_desde),
                (datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)),
            )
        )
    elif fecha_desde:
        query = query.filter(Compra.fecha_hora >= datetime.fromisoformat(fecha_desde))
    elif fecha_hasta:
        query = query.filter(
            Compra.fecha_hora
            <= datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)
        )

    query = query.order_by(Compra.fecha_hora.desc())

    compras: Pagination = query.paginate(page=page, per_page=page_size)

    if not compras.items:
        return

    return (
        jsonify(
            {
                "compras": compra_index_schema.dump(compras.items, many=True),
                "total": compras.total,
            }
        ),
        200,
    )


@compra_bp.route("/compras-orden/create", methods=["GET", "POST"])
@jwt_required()
@error_handler(session_rollback=True)
def create_orden():
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options(
                        [
                            Proveedor,
                            Moneda,
                            PuntoVenta,
                            TipoComprobante,
                            TipoPago,
                            AlicuotaIVA,
                        ]
                    ),
                }
            ),
            200,
        )
    if request.method == "POST":
        data = request.json
        data["created_by"] = current_user.id
        data["updated_by"] = current_user.id
        compra_id = CompraController.create(data, db.session, orden=True)
        return jsonify({"compra_id": compra_id}), 201


@compra_bp.route("/compras-orden/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@error_handler(session_rollback=True)
def update_orden(pk):
    compra: Compra = db.session.query(Compra).get_or_404(pk, "Compra no encontrada")
    if compra.estado != EstadoCompra.orden:
        return jsonify({"error": "Solo se pueden editar órdenes de compra"}), 400
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options(
                        [
                            Proveedor,
                            Moneda,
                            PuntoVenta,
                            TipoComprobante,
                            TipoPago,
                            AlicuotaIVA,
                        ]
                    ),
                    "compra": compra_form_schema.dump(compra),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        data["created_by"] = compra.created_by
        data["updated_by"] = current_user.id
        compra_id = CompraController.update(data, db.session, compra, orden=True)
        return jsonify({"compra_id": compra_id}), 200


@compra_bp.route("/compras-orden/<int:pk>/delete", methods=["DELETE"])
@jwt_required()
@error_handler(session_rollback=True)
def delete_orden(pk):
    compra: Compra = db.session.query(Compra).get_or_404(pk, "Compra no encontrada")
    if compra.is_deleted():
        return jsonify({"error": "La compra ya fue eliminada"}), 400
    if compra.estado != EstadoCompra.orden:
        return jsonify({"error": "Solo se pueden eliminar órdenes de compra"}), 400
    compra.delete()
    db.session.commit()
    return jsonify({"message": "Orden de compra eliminada correctamente"}), 200


@compra_bp.route("/compras/get-items-by-nro/<string:numero>", methods=["GET"])
@jwt_required()
@permission_required("compra.view")
@error_handler()
def get_items_by_numero(numero):
    punto_venta, numero_compra = numero.split("-")
    # Obtener la ultima compra con el numero y punto de venta
    compra = (
        db.session.query(Compra)
        .join(PuntoVenta)
        .filter(
            PuntoVenta.numero == int(punto_venta), Compra.numero == int(numero_compra)
        )
        .order_by(Compra.id.desc())
        .first()
    )
    if not compra:
        return jsonify({"error": "Compra no encontrada"}), 404

    items = db.session.query(CompraItem).filter_by(compra_id=compra.id).all()

    return jsonify({"items": compra_item_schema.dump(items, many=True)}), 200


@compra_bp.route("/compras/get-items-by-id/<int:pk>", methods=["GET"])
@jwt_required()
@permission_required(["compra.view", "compra.create", "compra.update"])
@error_handler()
def get_items_by_id(pk):
    compra: Compra = db.session.query(Compra).get_or_404(pk, "Compra no encontrada")
    items = db.session.query(CompraItem).filter_by(compra_id=compra.id).all()
    return jsonify({"items": compra_item_schema.dump(items, many=True)}), 200
