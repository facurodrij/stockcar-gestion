from io import BytesIO
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_sqlalchemy.query import Query

from server.core.models import (
    Venta,
    VentaItem,
    Moneda,
    Cliente,
    TipoComprobante,
    TipoPago,
    Tributo,
    EstadoVenta,
    PuntoVenta,
    AlicuotaIVA,
    Usuario,
)
from server.core.services import A4PDFGenerator, TicketPDFGenerator
from server.core.decorators import permission_required
from server.core.controllers import VentaController

venta_bp = Blueprint("venta_bp", __name__)


def get_select_options():
    cliente = Cliente.query.all()
    tipo_comprobante = TipoComprobante.query.all()
    tipo_pago = TipoPago.query.all()
    moneda = Moneda.query.all()
    tributo = Tributo.query.all()
    punto_venta = PuntoVenta.query.all()
    alicuota_iva = AlicuotaIVA.query.all()
    # TODO: Punto Venta, cargar los puntos de ventas de los comercios asociados al usuario actual
    return {
        "cliente": list(map(lambda x: x.to_json_min(), cliente)),
        "tipo_comprobante": list(map(lambda x: x.to_json(), tipo_comprobante)),
        "tipo_pago": list(map(lambda x: x.to_json(), tipo_pago)),
        "moneda": list(map(lambda x: x.to_json(), moneda)),
        "tributo": list(map(lambda x: x.to_json(), tributo)),
        "punto_venta": list(map(lambda x: x.to_json(), punto_venta)),
        "alicuota_iva": list(map(lambda x: x.to_json(), alicuota_iva)),
    }


@venta_bp.route("/ventas", methods=["GET"])
@jwt_required()
@permission_required("venta.view_all")
def index():
    try:
        fecha_desde = request.args.get("desde")
        fecha_hasta = request.args.get("hasta")

        if fecha_desde and fecha_hasta:
            ventas = Venta.query.filter(
                Venta.fecha_hora.between(
                    datetime.fromisoformat(fecha_desde),
                    (
                        datetime.fromisoformat(fecha_hasta)
                        + timedelta(days=1, seconds=-1)
                    ),
                )
            )
        elif fecha_desde:
            ventas = Venta.query.filter(
                Venta.fecha_hora >= datetime.fromisoformat(fecha_desde)
            )
        elif fecha_hasta:
            ventas = Venta.query.filter(
                Venta.fecha_hora
                <= datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)
            )
        else:
            ventas = Venta.query.all()

        if type(ventas) == Query:
            ventas = list(ventas)

        if len(ventas) == 0:
            return jsonify({"error": "No se encontraron ventas"}), 404

        ventas_json = list(map(lambda x: x.to_json(), ventas))
        return jsonify({"ventas": ventas_json}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400


@venta_bp.route("/ventas/create", methods=["GET", "POST"])
@jwt_required()
@permission_required("venta.create")
def create():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        user = Usuario.query.filter_by(username=get_jwt_identity()["username"]).first()
        data["created_by"] = user.id
        data["updated_by"] = user.id
        return VentaController.create_venta(data)


@venta_bp.route("/ventas/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@permission_required("venta.update")
def update(pk):
    venta = Venta.query.get_or_404(pk, "Venta no encontrada")
    venta_items = VentaItem.query.filter_by(venta_id=pk).all()
    if request.method == "GET":
        return (
            jsonify(
                {
                    "select_options": get_select_options(),
                    "venta": venta.to_json(),
                    "renglones": list(map(lambda x: x.to_json(), venta_items)),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        user = Usuario.query.filter_by(username=get_jwt_identity()["username"]).first()
        venta.updated_by = user.id
        return VentaController.update_venta(data, venta, venta_items)


@venta_bp.route("/ventas/<int:pk>", methods=["GET", "POST", "DELETE"])
@jwt_required()
@permission_required("venta.view")
def detail(pk):
    venta = Venta.query.get_or_404(pk, "Venta no encontrada")
    venta_items = VentaItem.query.filter_by(venta_id=pk).all()
    if request.method == "GET":
        return (
            jsonify(
                {
                    "venta": venta.to_json(),
                    "renglones": list(map(lambda x: x.to_json(), venta_items)),
                }
            ),
            200,
        )
    if request.method == "POST":
        data = request.json
        if data["action"] == "print":
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
        elif data["action"] == "anular":
            user = Usuario.query.filter_by(username=get_jwt_identity()["username"]).first()
            venta.updated_by = user.id
            return VentaController.anular_venta(venta)


@venta_bp.route("/ventas-orden", methods=["GET"])
@jwt_required()
def index_orden():
    try:
        fecha_desde = request.args.get("desde")
        fecha_hasta = request.args.get("hasta")

        if fecha_desde and fecha_hasta:
            ventas = Venta.query.filter(
                Venta.fecha_hora.between(
                    datetime.fromisoformat(fecha_desde),
                    (
                        datetime.fromisoformat(fecha_hasta)
                        + timedelta(days=1, seconds=-1)
                    ),
                )
            )
            ventas = ventas.filter_by(estado="orden")
        elif fecha_desde:
            ventas = Venta.query.filter(
                Venta.fecha_hora >= datetime.fromisoformat(fecha_desde)
            )
            ventas = ventas.filter_by(estado="orden")
        elif fecha_hasta:
            ventas = Venta.query.filter(
                Venta.fecha_hora
                <= datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)
            )
            ventas = ventas.filter_by(estado="orden")
        else:
            ventas = Venta.query.filter_by(estado="orden").all()

        if type(ventas) == Query:
            ventas = list(ventas)

        if len(ventas) == 0:
            return jsonify({"error": "No se encontraron ordenes"}), 404

        ventas_json = list(map(lambda x: x.to_json(), ventas))
        return jsonify({"ventas": ventas_json}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400


@venta_bp.route("/ventas-orden/create", methods=["GET", "POST"])
@jwt_required()
def create_orden():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        user = Usuario.query.filter_by(username=get_jwt_identity()["username"]).first()
        data["created_by"] = user.id
        data["updated_by"] = user.id
        return VentaController.create_orden_venta(data)


@venta_bp.route("/ventas-orden/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
def update_orden(pk):
    venta = Venta.query.get_or_404(pk, "Venta no encontrada")
    venta_items = VentaItem.query.filter_by(venta_id=pk).all()
    if venta.estado != EstadoVenta.orden:
        return jsonify({"error": "La venta no está en estado orden"}), 400
    if request.method == "GET":
        return (
            jsonify(
                {
                    "select_options": get_select_options(),
                    "venta": venta.to_json(),
                    "renglones": list(map(lambda x: x.to_json(), venta_items)),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        user = Usuario.query.filter_by(username=get_jwt_identity()["username"]).first()
        data["updated_by"] = user.id
        return VentaController.update_orden_venta(data, venta, venta_items)
