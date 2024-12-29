from io import BytesIO
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, current_user
from flask_sqlalchemy.query import Query
from flask_sqlalchemy.pagination import Pagination

from server.core.models import (
    Venta,
    Moneda,
    Cliente,
    TipoComprobante,
    TipoPago,
    Tributo,
    EstadoVenta,
    PuntoVenta,
    AlicuotaIVA,
    VentaItem,
)
from server.config import db
from server.utils.utils import get_select_options, get_datagrid_options
from server.core.services import A4PDFGenerator, TicketPDFGenerator
from server.auth.decorators import permission_required
from server.core.controllers import VentaController
from server.core.schemas import (
    VentaIndexSchema,
    VentaFormSchema,
    VentaDetailSchema,
    VentaItemSchema,
)
from server.core.decorators import error_handler

venta_bp = Blueprint("venta_bp", __name__)
venta_index_schema = VentaIndexSchema()  # TODO: Usarlo en lugar de venta_json
venta_form_schema = VentaFormSchema()
venta_detail_schema = VentaDetailSchema()
venta_item_schema = VentaItemSchema()


@venta_bp.route("/ventas", methods=["GET"])
@jwt_required()
@permission_required("venta.view_all")
@error_handler()
def index():
    fecha_desde = request.args.get("desde", None, type=str)
    fecha_hasta = request.args.get("hasta", None, type=str)
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 25, type=int)

    query = Venta.query

    if fecha_desde and fecha_hasta:
        query = query.filter(
            Venta.fecha_hora.between(
                datetime.fromisoformat(fecha_desde),
                (datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)),
            )
        )
    elif fecha_desde:
        query = query.filter(Venta.fecha_hora >= datetime.fromisoformat(fecha_desde))
    elif fecha_hasta:
        query = query.filter(
            Venta.fecha_hora
            <= datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)
        )

    query = query.order_by(Venta.fecha_hora.desc())

    ventas: Pagination = query.paginate(page=page, per_page=page_size)

    if not ventas.items:
        return jsonify({"error": "No se encontraron ventas"}), 404

    return (
        jsonify(
            {
                "ventas": venta_index_schema.dump(ventas.items, many=True),
                "total": ventas.total,
            }
        ),
        200,
    )


@venta_bp.route("/ventas/create", methods=["GET", "POST"])
@jwt_required()
@permission_required("venta.create")
@error_handler(session_rollback=True)
def create():
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options(
                        [
                            Cliente,
                            Moneda,
                            PuntoVenta,
                            TipoComprobante,
                            TipoPago,
                            AlicuotaIVA,
                        ]
                    ),
                    **get_datagrid_options([Tributo]),
                }
            ),
            200,
        )
    if request.method == "POST":
        data = request.json
        data["created_by"] = current_user.id
        data["updated_by"] = current_user.id
        venta_id = VentaController.create(data, db.session)
        return jsonify({"venta_id": venta_id}), 201


@venta_bp.route("/ventas/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@permission_required("venta.update")
@error_handler(session_rollback=True)
def update(pk):
    venta: Venta = db.session.query(Venta).get_or_404(pk, "Venta no encontrada")
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options(
                        [
                            Cliente,
                            Moneda,
                            PuntoVenta,
                            TipoComprobante,
                            TipoPago,
                            AlicuotaIVA,
                        ]
                    ),
                    **get_datagrid_options([Tributo]),
                    "venta": venta_form_schema.dump(venta),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        data["created_by"] = venta.created_by
        data["updated_by"] = current_user.id
        venta_id = VentaController.update(data, db.session, venta)
        return jsonify({"venta_id": venta_id}), 200


@venta_bp.route("/ventas/<int:pk>", methods=["GET", "POST", "DELETE"])
@jwt_required()
@permission_required("venta.view")
@error_handler()
def detail(pk):
    venta: Venta = db.session.query(Venta).get_or_404(pk, "Venta no encontrada")
    if request.method == "GET":
        return (
            jsonify(
                {
                    "venta": venta_detail_schema.dump(venta),
                }
            ),
            200,
        )
    if request.method == "POST":
        data = request.json
        match data["action"]:
            case "print":
                size = data["size"]
                buffer = BytesIO()
                if size == "A4":
                    c = A4PDFGenerator(buffer)
                    c.generate_pdf(venta)
                    buffer.seek(0)
                else:
                    c = TicketPDFGenerator(buffer)
                    c.generate_pdf(venta)
                    buffer.seek(0)
                return send_file(
                    buffer,
                    as_attachment=True,
                    download_name=f"venta_{venta.numero}.pdf",
                    mimetype="application/pdf",
                )
            case "anular":
                venta.updated_by = current_user.id
                venta_id, message = VentaController.anular(venta)
                return jsonify({"venta_id": venta_id, "message": message}), 201


@venta_bp.route("/ventas-orden", methods=["GET"])
@jwt_required()
@error_handler()
def index_orden():
    fecha_desde = request.args.get("desde")
    fecha_hasta = request.args.get("hasta")
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 25, type=int)

    query = Venta.query.filter_by(estado="orden")

    if fecha_desde and fecha_hasta:
        query = query.filter(
            Venta.fecha_hora.between(
                datetime.fromisoformat(fecha_desde),
                (datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)),
            )
        )
    elif fecha_desde:
        query = query.filter(Venta.fecha_hora >= datetime.fromisoformat(fecha_desde))
    elif fecha_hasta:
        query = query.filter(
            Venta.fecha_hora
            <= datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)
        )

    query = query.order_by(Venta.fecha_hora.desc())

    ventas: Pagination = query.paginate(page=page, per_page=page_size)

    if not ventas.items:
        return jsonify({"error": "No se encontraron ordenes"}), 404

    return (
        jsonify(
            {
                "ventas": venta_index_schema.dump(ventas.items, many=True),
                "total": ventas.total,
            }
        ),
        200,
    )


@venta_bp.route("/ventas-orden/create", methods=["GET", "POST"])
@jwt_required()
@error_handler(session_rollback=True)
def create_orden():
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options([Cliente, AlicuotaIVA]),
                    **get_datagrid_options([Tributo]),
                }
            ),
            200,
        )
    if request.method == "POST":
        data = request.json
        data["tipo_comprobante"] = 9
        data["punto_venta"] = 1
        data["created_by"] = current_user.id
        data["updated_by"] = current_user.id
        venta_id = VentaController.create(data, db.session, orden=True)
        return jsonify({"venta_id": venta_id}), 201


@venta_bp.route("/ventas-orden/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@error_handler(session_rollback=True)
def update_orden(pk):
    venta: Venta = db.session.query(Venta).get_or_404(pk, "Venta no encontrada")
    if venta.estado != EstadoVenta.orden:
        return jsonify({"error": "La venta no está en estado orden"}), 400
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options([Cliente, AlicuotaIVA]),
                    **get_datagrid_options([Tributo]),
                    "venta": venta_form_schema.dump(venta),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        data["tipo_comprobante"] = 9
        data["punto_venta"] = 1
        data["created_by"] = venta.created_by
        data["updated_by"] = current_user.id
        venta_id = VentaController.update(data, db.session, venta, orden=True)
        return jsonify({"venta_id": venta_id}), 200


@venta_bp.route("/ventas-orden/<int:pk>/delete", methods=["DELETE"])
@jwt_required()
@error_handler(session_rollback=True)
def delete_orden(pk):
    venta: Venta = db.session.query(Venta).get_or_404(pk, "Venta no encontrada")
    if venta.is_deleted():
        return jsonify({"error": "La venta ya fue eliminada"}), 400
    if venta.estado != EstadoVenta.orden:
        return jsonify({"error": "La venta no está en estado orden"}), 400
    venta.delete()
    db.session.commit()
    return jsonify({"message": "Orden de venta eliminada correctamente"}), 200


@venta_bp.route("/ventas/get-items-by-nro/<string:numero>", methods=["GET"])
@jwt_required()
@permission_required("venta.view")
@error_handler()
def get_items_by_numero(numero):
    punto_venta, numero_venta = numero.split("-")
    # Obtener la ultima venta con el numero y punto de venta
    venta = (
        db.session.query(Venta)
        .join(PuntoVenta)
        .filter(
            PuntoVenta.numero == int(punto_venta), Venta.numero == int(numero_venta)
        )
        .order_by(Venta.id.desc())
        .first()
    )
    if not venta:
        return jsonify({"error": "Venta no encontrada"}), 404

    items = db.session.query(VentaItem).filter_by(venta_id=venta.id).all()

    return jsonify({"items": venta_item_schema.dump(items, many=True)}), 200


@venta_bp.route("/ventas/get-items-by-id/<int:pk>", methods=["GET"])
@jwt_required()
@permission_required(["venta.view", "venta.create", "venta.update"])
@error_handler()
def get_items_by_id(pk):
    venta: Venta = db.session.query(Venta).get_or_404(pk, "Venta no encontrada")
    items = db.session.query(VentaItem).filter_by(venta_id=venta.id).all()
    return jsonify({"items": venta_item_schema.dump(items, many=True)}), 200
