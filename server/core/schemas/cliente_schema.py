from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, fields
from marshmallow import pre_load
from server.core.models import Cliente
from server.core.schemas.parametros_schema import (
    ProvinciaSchema,
    TipoDocumentoSchema,
    TipoResponsableSchema,
)


class ClienteIndexSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Cliente
        load_instance = True
        exclude = (
            "codigo_postal",
            "descuento",
            "duplicado_factura",
            "email",
            "exento_iva",
            "fecha_nacimiento",
            "limite_credito",
            "observacion",
            "recargo",
            "telefono",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        )

    tipo_documento = fields.Nested(TipoDocumentoSchema(only=("id", "descripcion")))
    tipo_responsable = fields.Nested(TipoResponsableSchema, only=("id", "descripcion"))


class ClienteDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Cliente
        load_instance = True

    tipo_documento = fields.Nested(TipoDocumentoSchema(only=("id", "descripcion")))
    tipo_responsable = fields.Nested(TipoResponsableSchema, only=("id", "descripcion"))
    provincia = fields.Nested(ProvinciaSchema, only=("id", "nombre"))


class ClienteFormSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Cliente
        include_fk = True
        load_instance = True

    fecha_nacimiento = fields.fields.DateTime(format="iso", allow_none=True)

    @pre_load
    def convert_empty_strings_to_none(self, data, **kwargs):
        for key, value in data.items():
            if value == "":
                data[key] = None
        return data
