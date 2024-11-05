from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, fields, auto_field
from server.auth.models import Usuario, Permiso, Rol


class PermisoSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Permiso
        include_relationships = True
        load_instance = True


class RolSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Rol
        include_relationships = True
        load_instance = True


class UsuarioSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Usuario
        include_relationships = True
        load_instance = True

    password = auto_field(load_only=True)


usuario_schema = UsuarioSchema()
