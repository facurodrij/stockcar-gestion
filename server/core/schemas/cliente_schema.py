from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field, fields
from marshmallow import pre_load
from server.core.models import Cliente
from server.core.schemas.parametros_schema import (
    TipoDocumentoSchema,
    TipoResponsableSchema,
    TipoPagoSchema,
    ProvinciaSchema,
    MonedaSchema,
    GeneroSchema,
)
from server.auth.schemas import UsuarioSchema


class ClienteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Cliente
        include_relationships = True
        load_instance = True
        exclude = ("ventas",)

    fecha_nacimiento = fields.fields.DateTime(format="iso", allow_none=True)
    tipo_documento_id = auto_field(load_only=True)
    tipo_responsable_id = auto_field(load_only=True)
    tipo_pago_id = auto_field(load_only=True)
    provincia_id = auto_field(load_only=True)
    moneda_id = auto_field(load_only=True)
    genero_id = auto_field(load_only=True)
    created_by = auto_field(load_only=True)
    updated_by = auto_field(load_only=True)

    tipo_documento = fields.Nested(TipoDocumentoSchema(only=("id", "descripcion")))
    tipo_responsable = fields.Nested(TipoResponsableSchema, only=("id", "descripcion"))
    tipo_pago = fields.Nested(TipoPagoSchema, only=("id", "nombre"))
    provincia = fields.Nested(ProvinciaSchema, only=("id", "nombre"))
    moneda = fields.Nested(MonedaSchema, only=("id", "nombre"))
    genero = fields.Nested(GeneroSchema, only=("id", "nombre"))
    created_by_user = fields.Nested(UsuarioSchema, only=("id", "username"))
    updated_by_user = fields.Nested(UsuarioSchema, only=("id", "username"))

    @pre_load
    def convert_empty_strings_to_none(self, data, **kwargs):
        for key, value in data.items():
            if value == "":
                data[key] = None
        return data


cliente_schema = ClienteSchema()
