import pytz

from io import BytesIO
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required

from server.config import db
from server.core.models import (
    Venta,
    VentaItem,
    Moneda,
    Cliente,
    TipoComprobante,
    Articulo,
    TipoPago,
    Tributo,
    EstadoVenta,
    PuntoVenta,
    AlicuotaIVA
)
from server.core.models.tributo import BaseCalculo
from server.core.models.association_table import tributo_venta
from server.core.services import AfipService, A4PDFGenerator, TicketPDFGenerator
from server.core.decorators import permission_required

venta_bp = Blueprint("venta_bp", __name__)

local_tz = pytz.timezone("America/Argentina/Buenos_Aires")


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


def venta_json_to_model(venta_json: dict) -> dict:
    for key, value in venta_json.items():
        if value == "":
            venta_json[key] = None
    if "fecha_hora" in venta_json and venta_json["fecha_hora"] is not None:
        venta_json["fecha_hora"] = datetime.fromisoformat(
            venta_json["fecha_hora"]
        ).astimezone(local_tz)
    else:
        venta_json["fecha_hora"] = datetime.now().astimezone(local_tz)
    if "vencimiento_cae" in venta_json and venta_json["vencimiento_cae"] is not None:
        venta_json["vencimiento_cae"] = datetime.fromisoformat(
            venta_json["vencimiento_cae"]
        ).astimezone(local_tz)
    venta_json["nombre_cliente"] = Cliente.query.get(
        venta_json["cliente_id"]
    ).razon_social
    venta_json["gravado"] = 0
    venta_json["total_iva"] = 0
    venta_json["total_tributos"] = 0
    venta_json["total"] = 0
    return venta_json


@venta_bp.route("/ventas", methods=["GET"])
@jwt_required()
@permission_required("venta.view_all")
def index():
    fecha_desde = request.args.get("desde")
    fecha_hasta = request.args.get("hasta")

    if fecha_desde and fecha_hasta:
        ventas = Venta.query.filter(
            Venta.fecha.between(
                datetime.fromisoformat(fecha_desde),
                (datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)),
            )
        )
    elif fecha_desde:
        ventas = Venta.query.filter(Venta.fecha >= datetime.fromisoformat(fecha_desde))
    elif fecha_hasta:
        ventas = Venta.query.filter(
            Venta.fecha
            <= datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)
        )
    else:
        ventas = Venta.query.all()

    ventas_json = list(map(lambda x: x.to_json(), ventas))
    return jsonify({"ventas": ventas_json}), 200


@venta_bp.route("/ventas/create", methods=["GET", "POST"])
@jwt_required()
@permission_required("venta.create")
def create():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        venta_json = venta_json_to_model(data["venta"])
        try:
            venta = Venta(**venta_json)
            venta.numero = venta.get_last_number() + 1
            db.session.add(venta)
            db.session.flush()  # para obtener el id de la venta creada
            renglones = data["renglones"]
            for item in renglones:
                articulo = Articulo.query.get(item["articulo_id"])
                ventaItem = VentaItem(articulo=articulo, venta_id=venta.id, **item)
                db.session.add(ventaItem)
                venta.total_iva += float(item["subtotal_iva"])
                venta.gravado += float(item["subtotal_gravado"])
                venta.total += float(item["subtotal"])
            tributos = Tributo.query.filter(Tributo.id.in_(data["tributos"])).all()
            for tributo in tributos:
                base_calculo = tributo.base_calculo
                alicuota = float(tributo.alicuota / 100)
                if base_calculo == BaseCalculo.neto:
                    importe = venta.gravado * alicuota
                elif base_calculo == BaseCalculo.bruto:
                    # TODO revisar si es correcto
                    importe = venta.total * alicuota
                venta.total_tributos += importe
                db.session.execute(
                    tributo_venta.insert().values(
                        tributo_id=tributo.id, venta_id=venta.id, importe=importe
                    )
                )
            venta.total += venta.total_tributos
            if not venta.tipo_comprobante.codigo_afip is None:
                afip = AfipService()
                res = afip.obtener_cae(venta)
                venta.numero = res["numero"]
                venta.cae = res["cae"]
                venta.vencimiento_cae = datetime.fromisoformat(res["vencimiento_cae"])
                venta.estado = "facturado"
            else:
                venta.estado = "ticket"
            db.session.commit()
            return jsonify({"venta_id": venta.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


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
        venta_json = venta_json_to_model(data["venta"])
        try:
            for key, value in venta_json.items():
                setattr(venta, key, value)
            current_articulo_ids = list(map(lambda x: x.articulo_id, venta_items))
            renglones = data["renglones"]
            for item in renglones:
                articulo_id = item["articulo_id"]
                if articulo_id in current_articulo_ids:
                    venta_item = VentaItem.query.filter_by(
                        venta_id=pk, articulo_id=articulo_id
                    ).first()
                    for key, value in item.items():
                        setattr(venta_item, key, value)
                    current_articulo_ids.remove(articulo_id)
                else:
                    articulo = Articulo.query.get(articulo_id)
                    ventaItem = VentaItem(articulo=articulo, venta_id=venta.id, **item)
                    db.session.add(ventaItem)
                venta.total_iva += float(item["subtotal_iva"])
                venta.gravado += float(item["subtotal_gravado"])
                venta.total += float(item["subtotal"])
            for articulo_id in current_articulo_ids:
                venta_item = VentaItem.query.filter_by(
                    venta_id=pk, articulo_id=articulo_id
                ).first()
                db.session.delete(venta_item)
            venta.tributos = []
            nuevos_tributos = Tributo.query.filter(
                Tributo.id.in_(data["tributos"])
            ).all()
            for tributo in nuevos_tributos:
                base_calculo = tributo.base_calculo
                alicuota = float(tributo.alicuota / 100)
                if base_calculo == BaseCalculo.neto:
                    importe = venta.gravado * alicuota
                elif base_calculo == BaseCalculo.bruto:
                    # TODO revisar si es correcto
                    importe = venta.total * alicuota
                venta.total_tributos += importe
                db.session.execute(
                    tributo_venta.insert().values(
                        tributo_id=tributo.id, venta_id=venta.id, importe=importe
                    )
                )
            venta.total += venta.total_tributos
            if (
                venta.estado.value == "Orden"
            ):  # Si la venta es una orden, se debe facturar
                if not venta.tipo_comprobante.codigo_afip is None:
                    afip = AfipService()
                    res = afip.obtener_cae(venta)
                    venta.numero = res["numero"]
                    venta.cae = res["cae"]
                    venta.vencimiento_cae = datetime.fromisoformat(
                        res["vencimiento_cae"]
                    )
                    venta.estado = "facturado"
                else:
                    venta.estado = "ticket"
            db.session.commit()
            return jsonify({"venta_id": venta.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


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


@venta_bp.route("/ventas-orden", methods=["GET"])
@jwt_required()
def index_orden():
    fecha_desde = request.args.get("desde")
    fecha_hasta = request.args.get("hasta")

    if fecha_desde and fecha_hasta:
        ventas = Venta.query.filter(
            Venta.fecha.between(
                datetime.fromisoformat(fecha_desde),
                (datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)),
            )
        )
    elif fecha_desde:
        ventas = Venta.query.filter(Venta.fecha >= datetime.fromisoformat(fecha_desde))
    elif fecha_hasta:
        ventas = Venta.query.filter(
            Venta.fecha
            <= datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)
        )
    else:
        ventas = Venta.query.filter_by(estado="orden").all()

    ventas_json = list(map(lambda x: x.to_json(), ventas))
    return jsonify({"ventas": ventas_json}), 200


@venta_bp.route("/ventas-orden/create", methods=["GET", "POST"])
@jwt_required()
def create_orden():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        venta_json = venta_json_to_model(data["venta"])
        try:
            venta = Venta(
                **venta_json,
                tipo_comprobante_id=9,
                punto_venta_id=1,  # TODO: Crear parámetro para el punto de venta por defecto
                estado="orden",
            )
            venta.numero = venta.get_last_number() + 1
            db.session.add(venta)
            db.session.flush()
            renglones = data["renglones"]
            for item in renglones:
                articulo = Articulo.query.get(item["articulo_id"])
                ventaItem = VentaItem(articulo=articulo, venta_id=venta.id, **item)
                db.session.add(ventaItem)
                venta.total_iva += float(item["subtotal_iva"])
                venta.gravado += float(item["subtotal_gravado"])
                venta.total += float(item["subtotal"])
            db.session.commit()
            return jsonify({"venta_id": venta.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


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
        venta_json = venta_json_to_model(data["venta"])
        try:
            for key, value in venta_json.items():
                setattr(venta, key, value)
            current_articulo_ids = list(map(lambda x: x.articulo_id, venta_items))
            renglones = data["renglones"]
            for item in renglones:
                articulo_id = item["articulo_id"]
                if articulo_id in current_articulo_ids:
                    venta_item = VentaItem.query.filter_by(
                        venta_id=pk, articulo_id=articulo_id
                    ).first()
                    for key, value in item.items():
                        setattr(venta_item, key, value)
                    current_articulo_ids.remove(articulo_id)
                else:
                    articulo = Articulo.query.get(articulo_id)
                    venta.items.append(
                        VentaItem(
                            articulo=articulo,
                            descripcion=item["descripcion"],
                            cantidad=item["cantidad"],
                            precio_unidad=item["precio_unidad"],
                            subtotal_iva=item["subtotal_iva"],
                            subtotal_gravado=item["subtotal_gravado"],
                            subtotal=item["subtotal"],
                        )
                    )
                venta.total_iva += float(item["subtotal_iva"])
                venta.gravado += float(item["subtotal_gravado"])
                venta.total += float(item["subtotal"])
            for articulo_id in current_articulo_ids:
                venta_item = VentaItem.query.filter_by(
                    venta_id=pk, articulo_id=articulo_id
                ).first()
                db.session.delete(venta_item)
            db.session.commit()
            return jsonify({"venta_id": venta.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()
