from marshmallow import pre_load
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, fields, auto_field
from server.core.models import Proveedor
from server.core.schemas.parametros_schema import (
    TipoDocumentoSchema,
    TipoResponsableSchema,
    TipoPagoSchema,
    ProvinciaSchema,
)
from server.auth.schemas import UsuarioSchema


class ProveedorSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Proveedor
        include_relationships = True
        load_instance = True

    tipo_documento_id = auto_field(load_only=True)
    tipo_responsable_id = auto_field(load_only=True)
    tipo_pago_id = auto_field(load_only=True)
    provincia_id = auto_field(load_only=True)
    created_by = auto_field(load_only=True)
    updated_by = auto_field(load_only=True)

    tipo_documento = fields.Nested(TipoDocumentoSchema(only=("id", "descripcion")))
    tipo_responsable = fields.Nested(TipoResponsableSchema, only=("id", "descripcion"))
    tipo_pago = fields.Nested(TipoPagoSchema, only=("id", "nombre"))
    provincia = fields.Nested(ProvinciaSchema, only=("id", "nombre"))
    created_by_user = fields.Nested(UsuarioSchema, only=("id", "username"))
    updated_by_user = fields.Nested(UsuarioSchema, only=("id", "username"))


class ProveedorFormSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Proveedor
        include_fk = True
        load_instance = True
    
    @pre_load
    def convert_empty_strings_to_none(self, data, **kwargs):
        for key, value in data.items():
            if value == "":
                data[key] = None
        return data
