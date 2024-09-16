import pytz
from sqlalchemy import Column, func, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declared_attr

local_tz = pytz.timezone("America/Argentina/Buenos_Aires")


class AuditMixin:
    """
    Clase que agrega campos de auditoria a las tablas de la base de datos.
    """

    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=func.now(), nullable=False)

    @declared_attr
    def updated_at(cls):
        return Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    @declared_attr
    def created_by(cls):
        return Column(Integer, ForeignKey("usuario.id"), nullable=False)

    @declared_attr
    def updated_by(cls):
        return Column(Integer, ForeignKey("usuario.id"), nullable=False)

    @declared_attr
    def created_by_user(cls):
        return relationship("Usuario", foreign_keys=[cls.created_by])

    @declared_attr
    def updated_by_user(cls):
        return relationship("Usuario", foreign_keys=[cls.updated_by])

    def __init__(self, *args, **kwargs):
        super(AuditMixin, self).__init__(*args, **kwargs)

    def get_audit_fields(self) -> dict:
        """
        Devuelve los campos de auditoría en formato JSON.
        """
        return {
            "created_at": self.created_at.replace(tzinfo=pytz.utc)
            .astimezone(local_tz)
            .isoformat(),
            "updated_at": self.updated_at.replace(tzinfo=pytz.utc)
            .astimezone(local_tz)
            .isoformat(),
            "created_by": self.created_by_user.to_json(),
            "updated_by": self.updated_by_user.to_json(),
        }
