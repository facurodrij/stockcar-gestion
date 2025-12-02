from sqlalchemy import (
    ForeignKey,
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    Date,
)
from sqlalchemy.orm import relationship
from server.utils.utils import AuditMixin, SoftDeleteMixin, QueryWithSoftDelete
from server.config import db


class Proveedor(AuditMixin, SoftDeleteMixin, db.Model):
    """
    Modelo de datos para los proveedores.

    Esta clase representa un proveedor en la base de datos. Incluye campos para los datos principales del proveedor,
    los datos de configuración para la creación de comprobantes de compra, los datos secundarios y los datos de auditoría.
    """

    __tablename__ = "proveedor"
    __pluralname__ = "proveedores"

    query_class = QueryWithSoftDelete

    # Datos principales
    id = Column(Integer, primary_key=True, autoincrement=True)
    nro_documento = Column(String, nullable=False)
    razon_social = Column(String, nullable=False)
    direccion = Column(String, nullable=False)
    localidad = Column(String, nullable=False)
    codigo_postal = Column(String, nullable=False)
    tipo_documento_id = Column(Integer, ForeignKey("tipo_documento.id"), nullable=False)
    tipo_documento = relationship("TipoDocumento", backref="proveedores")
    tipo_responsable_id = Column(
        Integer, ForeignKey("tipo_responsable.id"), nullable=False
    )
    tipo_responsable = relationship("TipoResponsable", backref="proveedores")
    provincia_id = Column(Integer, ForeignKey("provincia.id"), nullable=False)
    provincia = relationship("Provincia", backref="proveedores")

    # Datos de configuración para la creación de comprobantes de compra
    descuento = Column(Numeric(precision=5, scale=2), default=0)
    recargo = Column(Numeric(precision=5, scale=2), default=0)
    tipo_pago_id = Column(Integer, ForeignKey("tipo_pago.id"), default=1)
    tipo_pago = relationship("TipoPago", backref="proveedores")
    moneda_id = Column(Integer, ForeignKey("moneda.id"), default=1)
    moneda = relationship("Moneda", backref="proveedores")

    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)
    observacion = Column(String, nullable=True)

    def __repr__(self):
        return f"<Proveedor {self.razon_social}>"

    def __str__(self):
        return self.razon_social

    def to_dict(self) -> dict:
        """
        Devuelve un diccionario con los datos del proveedor.
        """
        return {
            "id": self.id,
            "nro_documento": self.nro_documento,
            "razon_social": self.razon_social,
            "direccion": self.direccion,
            "localidad": self.localidad,
            "codigo_postal": self.codigo_postal,
            "tipo_documento": self.tipo_documento.to_dict(),
            "tipo_responsable": self.tipo_responsable.to_dict(),
            "provincia": self.provincia.to_dict(),
            "descuento": float(self.descuento),
            "recargo": float(self.recargo),
            "tipo_pago": self.tipo_pago.to_dict(),
            "moneda": self.moneda.to_dict(),
            "telefono": self.telefono,
            "email": self.email,
            "observacion": self.observacion,
            **self.get_audit_fields(),
        }
    
    def to_select_dict(self) -> dict:
        """
        Convierte los datos del proveedor a formato de diccionario para un select.
        """
        return {
            "value": self.id,
            "label": f"{self.razon_social} ({self.nro_documento})",
        }
