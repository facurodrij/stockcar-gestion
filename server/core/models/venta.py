import enum
from decimal import Decimal
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    ForeignKey,
    DateTime,
    CHAR,
    Boolean,
    func,
    Enum,
)
from sqlalchemy.orm import relationship

from server.config import db
from server.core.models.association_table import tributo_venta


class EstadoVenta(enum.Enum):
    """
    Enumeración para los estados de una venta.
    """

    orden = ("Orden",)  # Estado inicial de la venta, cuando se crea una orden de venta
    ticket = (
        "Ticket",
    )  # Estado de la venta cuando se emite un ticket o comprobante no fiscal, no requiere facturación electrónica
    # Estado de la venta cuando se emite una factura, requiere facturación electrónica
    facturado = ("Facturado",)
    anulado = "Anulado"  # Estado de la venta cuando se anula una venta


class Venta(db.Model):
    """
    Modelo de datos para las ventas.

    Esta clase representa una venta en la base de datos. Incluye campos para los datos principales de la venta,
    los datos de facturación y los datos de auditoría.
    """

    __tablename__ = "venta"

    id = Column(Integer, primary_key=True, autoincrement=True)
    punto_venta = Column(Integer, nullable=False)
    numero = Column(Integer, nullable=False)
    nombre_cliente = Column(String, nullable=False)
    fecha_hora = Column(DateTime, default=func.now(), nullable=False)
    descuento = Column(Numeric(precision=5, scale=2), default=0, nullable=False)
    recargo = Column(Numeric(precision=5, scale=2), default=0, nullable=False)
    gravado = Column(
        Numeric(precision=10, scale=2), default=0, nullable=False
    )  # Total - IVA - Percepción
    total_iva = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    total_tributos = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    total = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    cae = Column(String, nullable=True)  # Código de Autorización Electrónico
    vencimiento_cae = Column(DateTime, nullable=True)
    observacion = Column(String, nullable=True)
    estado = Column(Enum(EstadoVenta), default=EstadoVenta.orden, nullable=False)
    # TODO investigar como almacenar los tipos de pagos, teniendo en cuenta que una venta puede pagarse con varios tipos de pagos

    # Relaciones con otras tablas
    tipo_comprobante_id = Column(
        Integer, ForeignKey("tipo_comprobante.id"), nullable=False
    )
    tipo_comprobante = relationship("TipoComprobante", backref="ventas")
    cliente_id = Column(Integer, ForeignKey("cliente.id"), nullable=False)
    cliente = relationship("Cliente", backref="ventas")
    moneda_id = Column(Integer, ForeignKey("moneda.id"), default=1, nullable=False)
    moneda = relationship("Moneda", backref="ventas")
    tipo_pago_id = Column(
        Integer, ForeignKey("tipo_pago.id"), default=1, nullable=False
    )
    tipo_pago = relationship("TipoPago", backref="ventas")

    tributos = relationship(
        "Tributo", secondary="tributo_venta", back_populates="ventas"
    )

    # Datos de Auditoría
    fecha_alta = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, onupdate=func.now())
    baja = Column(Boolean, default=False)
    fecha_baja = Column(DateTime, nullable=True)

    def nro_comprobante(self):
        """
        Devuelve el número de documento en formato 0000-00000000.
        """
        return f"{self.punto_venta:04d}-{self.numero:08d}"

    def get_last_number(self):
        """
        Devuelve el último número de venta, según el comprobante y punto de venta.
        """
        last_number = (
            db.session.query(func.max(Venta.numero))
            .filter(
                Venta.tipo_comprobante_id == self.tipo_comprobante_id,
                Venta.punto_venta == self.punto_venta,
            )
            .scalar()
        )
        if last_number:
            return last_number
        else:
            return 0

    def get_tributo_importe(self, tributo_id: int) -> float:
        """
        Devuelve el importe de la tabla asociativa tributo_venta
        """
        importe = (
            db.session.query(tributo_venta.c.importe)
            .filter(
                tributo_venta.c.tributo_id == tributo_id,
                tributo_venta.c.venta_id == self.id,
            )
            .scalar()
        )
        return float(importe)

    def to_json(self):
        """
        Convierte los datos de la venta a formato JSON.
        """
        tributos = []
        for tributo in self.tributos:
            tributos.append(tributo.to_json())

        # TODO: Agregar diferentes IVAs si hay items con diferentes alícuotas
        # Y calcular el importe de IVA para cada alícuota

        return {
            "id": self.id,
            "cliente": self.cliente.to_json_min(),
            "tipo_comprobante": self.tipo_comprobante.to_json(),
            "moneda": self.moneda.to_json(),
            "tipo_pago": self.tipo_pago.to_json(),
            "punto_venta": self.punto_venta,
            "numero": self.numero,
            "nro_comprobante": self.nro_comprobante(),
            "nombre_cliente": self.nombre_cliente,
            "fecha_hora": self.fecha_hora.isoformat(),
            "descuento": self.descuento,
            "recargo": self.recargo,
            "gravado": self.gravado,
            "total_iva": self.total_iva,
            "total_tributos": self.total_tributos,
            "total": self.total,
            "cae": self.cae,
            "vencimiento_cae": (
                self.vencimiento_cae.isoformat() if self.vencimiento_cae else None
            ),
            "observacion": self.observacion,
            "tributos": tributos,
            "fecha_alta": self.fecha_alta.isoformat(),
        }
