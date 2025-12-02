from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from server.core.models import Venta, VentaItem, Articulo
from server.auth.decorators import permission_required
from server.core.schemas import (
    VentaIndexSchema,
)
from server.core.decorators import error_handler

venta_reports_bp = Blueprint("venta_reports_bp", __name__)
venta_index_schema = VentaIndexSchema()


@venta_reports_bp.route("/ventas/reporte-ventas/por-vendedor", methods=["POST"])
@jwt_required()
@permission_required("venta.view_all")
@error_handler()
def reporte_ventas_por_vendedor():
    data = request.get_json()
    fecha_desde = data.get("desde", None)
    fecha_hasta = data.get("hasta", None)
    usuario_id = data.get("usuario_id")
    tipo_comprobante_ids: list[int] = data.get("tipo_comprobante_ids")

    query = Venta.query

    if fecha_desde and fecha_hasta:
        query = query.filter(
            Venta.fecha_hora.between(
                datetime.fromisoformat(fecha_desde),
                datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1),
            )
        )
    elif fecha_desde:
        query = query.filter(Venta.fecha_hora >= datetime.fromisoformat(fecha_desde))
    elif fecha_hasta:
        query = query.filter(
            Venta.fecha_hora
            <= datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)
        )

    ventas = query.filter(
        Venta.created_by == usuario_id,
        Venta.tipo_comprobante_id.in_(tipo_comprobante_ids),
    ).all()

    if not ventas:
        return jsonify({"error": "No se encontraron ventas"}), 404

    return jsonify({"ventas": venta_index_schema.dump(ventas, many=True)})


@venta_reports_bp.route("/ventas/reporte-ventas/articulos-mas-vendidos", methods=["GET"])
@jwt_required()
@permission_required("venta.view_all")
@error_handler()
def articulos_mas_vendidos():
    fecha_desde = request.args.get("desde", None)
    fecha_hasta = request.args.get("hasta", None)
    limite = request.args.get("limite", 10, type=int)

    # Query base que agrupa por artículo y suma cantidades
    query = (
        VentaItem.query
        .join(Venta)
        .join(Articulo)
        .with_entities(
            Articulo.id,
            Articulo.codigo_principal,
            Articulo.descripcion,
            func.sum(VentaItem.cantidad).label("cantidad_total"),
            func.sum(VentaItem.subtotal).label("total_vendido")
        )
        .group_by(Articulo.id, Articulo.codigo_principal, Articulo.descripcion)
    )

    # Aplicar filtros de fecha
    if fecha_desde and fecha_hasta:
        query = query.filter(
            Venta.fecha_hora.between(
                datetime.fromisoformat(fecha_desde),
                datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1),
            )
        )
    elif fecha_desde:
        query = query.filter(Venta.fecha_hora >= datetime.fromisoformat(fecha_desde))
    elif fecha_hasta:
        query = query.filter(
            Venta.fecha_hora
            <= datetime.fromisoformat(fecha_hasta) + timedelta(days=1, seconds=-1)
        )

    # Ordenar por cantidad vendida y aplicar límite
    resultados = query.order_by(func.sum(VentaItem.cantidad).desc()).limit(limite).all()

    # Formatear resultados
    articulos = [
        {
            "id": r.id,
            "codigo_principal": r.codigo_principal,
            "descripcion": r.descripcion,
            "cantidad_total": float(r.cantidad_total),
            "total_vendido": float(r.total_vendido),
        }
        for r in resultados
    ]

    return jsonify({
        "articulos": articulos,
        "total": len(articulos),
        "limite": limite
    })
