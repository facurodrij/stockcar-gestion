from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, fields, auto_field
from server.core.models.parametros import *


class TipoDocumentoSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TipoDocumento
        load_instance = True


class TipoResponsableSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TipoResponsable
        load_instance = True


class ProvinciaSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Provincia
        load_instance = True


class GeneroSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Genero
        load_instance = True


class TipoPagoSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TipoPago
        load_instance = True


class MonedaSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Moneda
        load_instance = True


class TipoComprobanteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TipoComprobante
        load_instance = True


class TipoConceptoSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TipoConcepto
        load_instance = True


class TipoArticuloSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TipoArticulo
        load_instance = True


class AlicuotaIvaSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = AlicuotaIVA
        load_instance = True


class TipoUnidadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TipoUnidad
        load_instance = True
