from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, fields
from marshmallow import pre_load, validates_schema, ValidationError
from server.core.models import Articulo
from server.core.schemas.parametros_schema import (
    TipoArticuloSchema,
    TipoUnidadSchema,
    AlicuotaIvaSchema,
)
from server.auth.schemas import UsuarioSchema


class ArticuloIndexSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Articulo
        load_instance = True
        exclude = (
            "stock_minimo",
            "stock_maximo",
            "observacion",
            "deleted",
            "deleted_at",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        )

    alicuota_iva = fields.Nested(AlicuotaIvaSchema, only=("id", "descripcion", "porcentaje"))


class ArticuloDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Articulo
        include_relationships = True
        load_instance = True

    codigo_adicional = fields.fields.List(
        fields.fields.String(), missing=[], allow_none=True
    )
    tipo_articulo = fields.Nested(TipoArticuloSchema, only=("id", "nombre"))
    tipo_unidad = fields.Nested(TipoUnidadSchema, only=("id", "nombre"))
    alicuota_iva = fields.Nested(AlicuotaIvaSchema, only=("id", "descripcion"))
    created_by_user = fields.Nested(UsuarioSchema, only=("id", "username"))
    updated_by_user = fields.Nested(UsuarioSchema, only=("id", "username"))
    # TODO: Agregar
    # Movimientos de stock
    # Ventas
    # Compras


class ArticuloFormSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Articulo
        include_fk = True
        load_instance = True

    codigo_adicional = fields.fields.List(
        fields.fields.String(), missing=[], allow_none=True
    )

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
