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
from server.utils.utils import AuditMixin
from server.config import db


class Cliente(AuditMixin, db.Model):
    """
    Modelo de datos para los clientes.

    Esta clase representa un cliente en la base de datos. Incluye campos para los datos principales del cliente,
    los datos de configuración para la creación de comprobantes de venta, los datos secundarios y los datos de auditoría.
    """

    __tablename__ = "cliente"
    __pluralname__ = "clientes"

    # Datos principales
    id = Column(Integer, primary_key=True, autoincrement=True)
    nro_documento = Column(String, nullable=False)
    razon_social = Column(String, nullable=False)
    direccion = Column(String, nullable=False)
    localidad = Column(String, nullable=False)
    codigo_postal = Column(String, nullable=False)
    tipo_documento_id = Column(Integer, ForeignKey("tipo_documento.id"), nullable=False)
    tipo_documento = relationship("TipoDocumento", backref="clientes")
    tipo_responsable_id = Column(
        Integer, ForeignKey("tipo_responsable.id"), nullable=False
    )
    tipo_responsable = relationship("TipoResponsable", backref="clientes")
    provincia_id = Column(Integer, ForeignKey("provincia.id"), nullable=False)
    provincia = relationship("Provincia", backref="clientes")

    # Datos de configuración para la creación de comprobantes de venta
    descuento = Column(Numeric(precision=5, scale=2), default=0)
    recargo = Column(Numeric(precision=5, scale=2), default=0)
    limite_credito = Column(Numeric(precision=10, scale=2), default=0)
    duplicado_factura = Column(Boolean, default=False)
    exento_iva = Column(Boolean, default=False)
    tipo_pago_id = Column(Integer, ForeignKey("tipo_pago.id"), default=1)
    tipo_pago = relationship("TipoPago", backref="clientes")
    moneda_id = Column(Integer, ForeignKey("moneda.id"), default=1)
    moneda = relationship("Moneda", backref="clientes")
    tributos = relationship(
        "Tributo", secondary="tributo_cliente", back_populates="clientes"
    )

    # Datos personales (opcionales)
    fecha_nacimiento = Column(Date, nullable=True)
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)
    genero_id = Column(Integer, ForeignKey("genero.id"), nullable=True)
    genero = relationship("Genero", backref="clientes")
    observacion = Column(String, nullable=True)

    def __repr__(self):
        return f"<Cliente {self.razon_social} ({self.nro_documento})>"

    def __str__(self):
        return f"{self.razon_social} ({self.nro_documento})"

    def to_json_min(self):
        """
        Convierte los datos mínimos del cliente a formato JSON.
        """
        return {
            "id": self.id,
            "razon_social": self.razon_social,
            "tipo_documento": self.tipo_documento.to_dict(),
            "nro_documento": self.nro_documento,
            "tipo_responsable": self.tipo_responsable.to_dict(),
            "direccion": self.direccion,
            "localidad": self.localidad,
            "provincia": self.provincia.to_dict(),
            "codigo_postal": self.codigo_postal,
        }

    def to_select_dict(self) -> dict:
        """
        Convierte los datos del cliente a formato de diccionario para un select.
        """
        return {
            "value": self.id,
            "label": f"{self.razon_social} ({self.nro_documento})",
        }

    def to_dict(self) -> dict:
        """
        Convierte los datos del cliente a formato de diccionario.
        """
        tributos = []
        for tributo in self.tributos:
            tributos.append(tributo.to_dict())

        return {
            "id": self.id,
            "nro_documento": self.nro_documento,
            "razon_social": self.razon_social,
            "direccion": self.direccion,
            "localidad": self.localidad,
            "codigo_postal": self.codigo_postal,
            "telefono": self.telefono,
            "email": self.email,
            "fecha_nacimiento": (
                self.fecha_nacimiento.isoformat() if self.fecha_nacimiento else None
            ),
            "descuento": self.descuento,
            "recargo": self.recargo,
            "limite_credito": self.limite_credito,
            "duplicado_factura": self.duplicado_factura,
            "exento_iva": self.exento_iva,
            "observacion": self.observacion,
            "tipo_documento": self.tipo_documento.to_dict(),
            "tipo_responsable": self.tipo_responsable.to_dict(),
            "provincia": self.provincia.to_dict(),
            "genero": self.genero.to_dict() if self.genero else None,
            "tipo_pago": self.tipo_pago.to_dict(),
            "moneda": self.moneda.to_dict(),
            "tributos": tributos,
            **self.get_audit_fields(),
        }
