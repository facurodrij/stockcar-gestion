from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, fields, auto_field
from server.core.models import Proveedor
from server.core.schemas.parametros_schema import (
    TipoDocumentoSchema,
    TipoResponsableSchema,
    TipoPagoSchema
)


class ProveedorSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Proveedor
        include_relationships = True
        load_instance = True

    tipo_documento_id = auto_field(load_only=True)
    tipo_responsable_id = auto_field(load_only=True)
    tipo_pago_id = auto_field(load_only=True)
    provincia_id = auto_field(load_only=True)
    tipo_documento = fields.Nested(TipoDocumentoSchema(only=("id", "descripcion")))
    tipo_responsable = fields.Nested(TipoResponsableSchema, only=("id", "descripcion"))
    tipo_pago = fields.Nested(TipoPagoSchema, only=("id", "nombre"))
    created_by = auto_field(load_only=True)
    updated_by = auto_field(load_only=True)

proveedor_schema = ProveedorSchema()
