from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from server.core.models import Tributo


class TributoSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Tributo
        load_instance = True


tributo_schema = TributoSchema()
