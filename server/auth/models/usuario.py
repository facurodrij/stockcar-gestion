from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    Boolean,
    func,
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
    __pluralname__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    nombre = Column(String, nullable=True)
    apellido = Column(String, nullable=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now(), server_default=func.now())
    updated_at = Column(
        DateTime, default=func.now(), onupdate=func.now(), server_default=func.now()
    )

    roles = relationship("Rol", secondary="usuario_rol", back_populates="usuarios")
    permisos = relationship(
        "Permiso", secondary="usuario_permiso", back_populates="usuarios"
    )

    def to_dict(self, include_relationships=False) -> dict:
        if not include_relationships:
            return {
                "id": self.id,
                "username": self.username,
                "email": self.email,
                "nombre": self.nombre,
                "apellido": self.apellido,
                "is_superuser": self.is_superuser,
            }

        roles = []
        for rol in self.roles:
            roles.append(rol.to_dict())

        permisos = []
        for permiso in self.permisos:
            permisos.append(permiso.to_dict())

        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "is_superuser": self.is_superuser,
            "roles": roles,
            "permisos": permisos,
        }

    def __repr__(self) -> str:
        return f"<Usuario {self.username}>"

    def __str__(self) -> str:
        return self.username

    def to_select_dict(self) -> dict:
        return {
            "value": self.id,
            "label": self.username,
        }
