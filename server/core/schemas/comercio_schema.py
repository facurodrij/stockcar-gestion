from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, fields
from server.core.models import Comercio
from server.core.schemas.parametros_schema import (
    TipoResponsableSchema
)


class ComercioReadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Comercio
        load_instance = True

    inicio_actividades = fields.fields.DateTime(format="iso", allow_none=False)
    tipo_responsable = fields.Nested(TipoResponsableSchema, only=("id", "descripcion"))


class ComercioFormSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Comercio
        include_fk = True
        load_instance = True
    
    inicio_actividades = fields.fields.DateTime(format="iso", allow_none=False)
