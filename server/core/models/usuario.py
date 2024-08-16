# TODO: Crear modelo Usuario
# TODO - Relacionar con el modelo Rol
# TODO - Relacionar con el modelo PuntoVenta
# TODO - Relacionar con el modelo Comercio

# TODO - El usuario con Rol de Administrador puede crear, modificar y eliminar todas las instancias de Usuario
# TODO - El usuario con Rol de Vendedor debe solamente poder crear borradores de Ventas
# TODO - El usuario con Rol de Vendedor debe poder ver solamente las Ventas que él creó
# TODO - El usuario con Rol de Cajero debe poder ver todas las Ventas y cobrarlas
# TODO - El usuario con Rol de Cajero no puede modificar ni eliminar Ventas

# TODO - Crear un endpoint para obtener la lista de Usuarios
# TODO - Crear un endpoint para obtener un Usuario por ID
# TODO - Crear un endpoint para crear un Usuario

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
    is_staff = Column(Boolean, default=False)

    roles = relationship("Rol", secondary="usuario_rol", back_populates="usuarios")

    def to_json(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "is_superuser": self.is_superuser,
            "is_staff": self.is_staff,
            "roles": [rol.nombre for rol in self.roles],
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
