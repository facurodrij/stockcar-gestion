# TODO - Relacionar con el modelo Comercio
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    ForeignKey,
    DateTime,
    CHAR,
    Boolean,
    func
)
from sqlalchemy.orm import relationship

from server.config import db


class Usuario(db.Model):
    """
    Modelo de datos para los usuarios.

    Esta clase representa un usuario en la base de datos. Incluye campos para los datos principales del usuario,
    los datos de autenticación y los datos de auditoría.
    """

    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True) # TODO: Controlar que el formato del email sea válido
    password = Column(String, nullable=False)
    nombre = Column(String, nullable=True)
    apellido = Column(String, nullable=True)
    is_superuser = Column(Boolean, default=False)

    roles = relationship("Rol", secondary="usuario_rol", back_populates="usuarios")
    permisos = relationship("Permiso", secondary="usuario_permiso", back_populates="usuarios")

    def to_json(self):
        permisos = []
        for permiso in self.permisos:
            permisos.append(permiso.to_json())

        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "is_superuser": self.is_superuser,
            "roles": [rol.nombre for rol in self.roles],
            "permisos": permisos
        }


class Permiso(db.Model):
    """
    Modelo de datos para los permisos de usuario.

    Los permisos se cargarán automáticamente utilizando las rutas Blueprint de Flask. Cada permiso se corresponderá
    con una ruta. Por ejemplo, el permiso /ventas se corresponderá con la ruta /ventas.
    """

    __tablename__ = "permiso"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)

    roles = relationship("Rol", secondary="rol_permiso", back_populates="permisos")
    usuarios = relationship("Usuario", secondary="usuario_permiso", back_populates="permisos")

    def to_json(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
        }


class Rol(db.Model):
    """
    Modelo de datos para los roles de usuario.

    Esta clase representa un rol de usuario en la base de datos. Incluye campos para los datos principales del rol,
    los datos de auditoría y la relación con los usuarios.
    """

    __tablename__ = "rol"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)

    usuarios = relationship("Usuario", secondary="usuario_rol", back_populates="roles")
    permisos = relationship("Permiso", secondary="rol_permiso", back_populates="roles")

    def to_json(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
        }


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