import pytz
from datetime import datetime
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field, fields
from marshmallow import pre_load, validates_schema, ValidationError, post_load
from server.core.models import Venta, VentaItem, Cliente
from server.auth.schemas import UsuarioSchema
from server.config import db
from sqlalchemy.sql import func


local_tz = pytz.timezone("America/Argentina/Buenos_Aires")


class VentaItemSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = VentaItem
        include_relationships = True
        load_instance = True

    codigo_principal = fields.fields.String()
    articulo_id = auto_field()


class VentaFormSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Venta
        include_relationships = True
        load_instance = True

    created_by = auto_field(load_only=True)
    updated_by = auto_field(load_only=True)

    items = fields.Nested(VentaItemSchema, many=True)

    @pre_load
    def convert_empty_strings_to_none(self, data, **kwargs):
        for key, value in data.items():
            if value == "":
                data[key] = None
        return data

    @pre_load
    def set_fecha_hora(self, data, **kwargs):
        if not data.get("fecha_hora"):
            data["fecha_hora"] = datetime.now(local_tz).isoformat()
        else:
            data["fecha_hora"] = (
                datetime.fromisoformat(data["fecha_hora"])
                .astimezone(local_tz)
                .isoformat()
            )
        return data

    @pre_load
    def set_vencimiento_cae(self, data, **kwargs):
        if data.get("vencimiento_cae"):
            data["vencimiento_cae"] = (
                datetime.fromisoformat(data["vencimiento_cae"])
                .astimezone(local_tz)
                .isoformat()
            )
        return data

    @pre_load
    def set_nombre_cliente(self, data, **kwargs):
        cliente = Cliente.query.get(data.get("cliente"))
        if cliente:
            data["nombre_cliente"] = cliente.razon_social
        return data

    @pre_load
    def set_numero(self, data, **kwargs):
        last_number = (
            db.session.query(func.max(Venta.numero))
            .filter(
                Venta.tipo_comprobante_id == data.get("tipo_comprobante"),
                Venta.punto_venta_id == data.get("punto_venta"),
            )
            .scalar()
        )
        if last_number:
            data["numero"] = last_number + 1
        else:
            data["numero"] = 1
        return data

    @post_load
    def set_totales(self, data, **kwargs):
        total_iva = 0
        gravado = 0
        total = 0
        for item in data.items:
            total_iva += float(item.subtotal_iva)
            gravado += float(item.subtotal_gravado)
            total += float(item.subtotal)
        data.total_iva = total_iva
        data.gravado = gravado
        data.total = total
        return data
