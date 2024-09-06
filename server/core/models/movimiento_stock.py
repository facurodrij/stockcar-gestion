import enum
from sqlalchemy import (
    ForeignKey,
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    Enum,
    func,
)
from sqlalchemy.orm import relationship
from server.config import db


class TipoMovimiento(enum.Enum):
    """
    Enumeración para los tipos de movimiento de stock.
    """

    ingreso = "Ingreso"
    egreso = "Egreso"


class OrigenMovimiento(enum.Enum):
    """
    Enumeración para los tipos de origen de movimiento de stock.
    """

    compra = "Compra"
    venta = "Venta"
    ajuste = "Ajuste"
    devolucion = "Devolución"


class MovimientoStock(db.Model):
    """
    Modelo de datos para los movimientos de stock.

    Esta clase representa un movimiento de stock en la base de datos. Incluye campos para los datos principales del
    movimiento, los datos de auditoría y las relaciones con otras tablas.
    """

    __tablename__ = "movimiento_stock"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tipo_movimiento = Column(Enum(TipoMovimiento), nullable=False)
    origen = Column(Enum(OrigenMovimiento), nullable=False)
    fecha_hora = Column(DateTime, default=func.now(), nullable=False)
    cantidad = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    observacion = Column(String, nullable=True)

    # Relaciones con otras tablas
    articulo_id = Column(Integer, ForeignKey("articulo.id"), nullable=False)
    articulo = relationship("Articulo", backref="movimientos_stock")

    # Datos de auditoría
    fecha_alta = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, onupdate=func.now())

    def to_json(self):
        return {
            "id": self.id,
            "tipo_movimiento": self.tipo_movimiento.value,
            "origen": self.origen.value,
            "fecha_hora": self.fecha_hora.strftime("%Y-%m-%d %H:%M:%S"),
            "cantidad": str(self.cantidad),
            "observacion": self.observacion,
            "articulo": self.articulo.to_json(),
        }
