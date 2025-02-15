from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer

from server.config import db


usuario_rol = db.Table(
    "usuario_rol",
    Column("usuario_id", Integer, ForeignKey("usuario.id"), primary_key=True),
    Column("rol_id", Integer, ForeignKey("rol.id"), primary_key=True),
)

rol_permiso = db.Table(
    "rol_permiso",
    Column("rol_id", Integer, ForeignKey("rol.id"), primary_key=True),
    Column("permiso_id", Integer, ForeignKey("permiso.id"), primary_key=True),
)

usuario_permiso = db.Table(
    "usuario_permiso",
    Column("usuario_id", Integer, ForeignKey("usuario.id"), primary_key=True),
    Column("permiso_id", Integer, ForeignKey("permiso.id"), primary_key=True),
)
