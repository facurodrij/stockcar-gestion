from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from server.core.models import Venta
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
