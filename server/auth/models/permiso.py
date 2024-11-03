from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship

from server.config import db


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
    usuarios = relationship(
        "Usuario", secondary="usuario_permiso", back_populates="permisos"
    )

    def to_dict(self, include_relationships=False) -> dict:
        if not include_relationships:
            return {
                "id": self.id,
                "nombre": self.nombre,
                "descripcion": self.descripcion,
            }

        roles = []
        for rol in self.roles:
            roles.append(rol.to_dict())

        usuarios = []
        for usuario in self.usuarios:
            usuarios.append(usuario.to_dict())

        return {
            "id": self.id,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "roles": roles,
            "usuarios": usuarios,
        }

    def __repr__(self) -> str:
        return f"<Permiso {self.nombre}>"

    def __str__(self) -> str:
        return self.nombre

    def to_select_dict(self) -> dict:
        return {
            "value": self.id,
            "label": self.nombre,
        }
