import pytz
from decimal import Decimal
from datetime import datetime
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field, fields
from marshmallow import (
    pre_load,
    post_load,
    pre_dump,
    post_dump,
    validates_schema,
    ValidationError,
)
from server.core.models import Venta, VentaItem, Cliente
from sqlalchemy.sql import func


local_tz = pytz.timezone("America/Argentina/Buenos_Aires")


class VentaItemSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = VentaItem
        load_instance = True

    codigo_principal = fields.fields.String(attribute="articulo.codigo_principal")
    articulo_id = auto_field()


class VentaItemFormSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = VentaItem
        include_relationships = True
        load_instance = True

    codigo_principal = fields.fields.String()
    articulo_id = auto_field()

    @validates_schema
    def validate_subtotal(self, data, **kwargs):
        subtotal = data["cantidad"] * data["precio_unidad"]
        if round(subtotal, 2) != data["subtotal"]:
            raise ValidationError(
                "El subtotal no coincide con la cantidad por el precio unitario",
                data["descripcion"],
            )
        return data

    @validates_schema
    def validate_subtotal_iva(self, data, **kwargs):
        subtotal_iva = (
            data["subtotal"] * data["alicuota_iva"] / (100 + data["alicuota_iva"])
        )
        if round(subtotal_iva, 2) != data["subtotal_iva"]:
            raise ValidationError(
                "El subtotal de IVA no coincide con el subtotal por la alícuota de IVA",
                data["descripcion"],
            )
        return data

    @validates_schema
    def validate_subtotal_gravado(self, data, **kwargs):
        subtotal_gravado = data["subtotal"] - data["subtotal_iva"]
        if round(subtotal_gravado, 2) != data["subtotal_gravado"]:
            raise ValidationError(
                "El subtotal gravado no coincide con el subtotal menos el IVA",
                data["descripcion"],
            )
        return data


class VentaSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Venta
        load_instance = True


class VentaIndexSchema(VentaSchema):
    class Meta:
        model = Venta
        include_relationships = True
        load_instance = True
        exclude = ("items",)

    nro_comprobante = fields.fields.Function(
        lambda obj: f"{obj.punto_venta.numero:04d}-{obj.numero:08d}"
    )


class VentaDetailSchema(VentaSchema):
    class Meta:
        model = Venta
        include_relationships = True
        load_instance = True

    items = fields.Nested(VentaItemSchema, many=True)
    # TODO: cliente = fields.fields.Nested(ClienteSchema)
    nro_comprobante = fields.fields.Function(
        lambda obj: f"{obj.punto_venta.numero:04d}-{obj.numero:08d}"
    )


class VentaFormSchema(VentaSchema):
    class Meta:
        model = Venta
        include_relationships = True
        load_instance = True

    created_by = auto_field(load_only=True)
    updated_by = auto_field(load_only=True)

    items = fields.Nested(VentaItemFormSchema, many=True, required=True)

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
        if data.get("cliente"):
            cliente = self.session.get(Cliente, data.get("cliente"))
            if cliente:
                data["nombre_cliente"] = cliente.razon_social
        return data

    @pre_load
    def set_numero(self, data, **kwargs):
        # TODO: Revisar funcionamiento en update de venta
        last_number = (
            self.session.query(func.max(Venta.numero))
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
        data.total_iva = Decimal(total_iva)
        data.gravado = Decimal(gravado)
        data.total = Decimal(total)
        return data
