from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field, fields
from marshmallow import pre_load, validates_schema, ValidationError
from server.core.models import Articulo
from server.core.schemas.parametros_schema import (
    TipoArticuloSchema,
    TipoUnidadSchema,
    AlicuotaIvaSchema,
)
from server.auth.schemas import UsuarioSchema


class ArticuloSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Articulo
        include_relationships = True
        load_instance = True

    tipo_articulo_id = auto_field(load_only=True)
    tipo_unidad_id = auto_field(load_only=True)
    alicuota_iva_id = auto_field(load_only=True)
    created_by = auto_field(load_only=True)
    updated_by = auto_field(load_only=True)

    tipo_articulo = fields.Nested(TipoArticuloSchema, only=("id", "nombre"))
    tipo_unidad = fields.Nested(TipoUnidadSchema, only=("id", "nombre"))
    alicuota_iva = fields.Nested(AlicuotaIvaSchema, only=("id", "descripcion"))
    created_by_user = fields.Nested(UsuarioSchema, only=("id", "username"))
    updated_by_user = fields.Nested(UsuarioSchema, only=("id", "username"))

    force = fields.fields.Boolean(load_only=True)

    @pre_load
    def convert_empty_strings_to_none(self, data, **kwargs):
        for key, value in data.items():
            if value == "":
                data[key] = None
        return data

    @validates_schema
    def validate_codigo_principal(self, data, **kwargs):
        """
        Valida que no existan artículos con el mismo código principal. Si el
        campo force es True, se ignorará la validación.
        """
        codigo_principal = data.get("codigo_principal")
        force = data.get("force", False)
        instance = self.context.get("instance", None)

        if codigo_principal and not force:
            query = Articulo.query.filter_by(codigo_principal=codigo_principal)
            if instance:
                # Excluir el artículo actual de la validación
                query = query.filter(Articulo.id != instance.id)
            articulos_existentes = query.all()
            if articulos_existentes:
                ids_existentes = [articulo.id for articulo in articulos_existentes]
                raise ValidationError(
                    {
                        "warning": "Ya existen Artículos con el mismo código principal",
                        "ids": ids_existentes,
                    },
                    field_name="codigo_principal",
                )


articulo_schema = ArticuloSchema()
