from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship

from server.config import db


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

    def to_dict(self, include_relationships=False) -> dict:
        if not include_relationships:
            return {
                "id": self.id,
                "nombre": self.nombre,
                "descripcion": self.descripcion,
            }

        usuarios = []
        for usuario in self.usuarios:
            usuarios.append(usuario.to_dict())

        permisos = []
        for permiso in self.permisos:
            permisos.append(permiso.to_dict())

        return {
            "id": self.id,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "usuarios": usuarios,
            "permisos": permisos,
        }

    def __repr__(self) -> str:
        return f"<Rol {self.nombre}>"

    def __str__(self) -> str:
        return self.nombre

    def to_select_dict(self) -> dict:
        return {
            "value": self.id,
            "label": self.nombre,
        }
