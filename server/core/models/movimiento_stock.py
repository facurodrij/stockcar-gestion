import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
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
    observacion = Column(String, nullable=True)

    articulos = relationship(
        "Articulo", secondary="articulo_movimiento_stock", back_populates="movimientos"
    )

    # Datos de auditoría
    fecha_alta = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, onupdate=func.now())

    def to_json(self):
        articulos = []
        for articulo in self.articulos:
            articulos.append(articulo.to_json())

        return {
            "id": self.id,
            "tipo_movimiento": self.tipo_movimiento.value,
            "origen": self.origen.value,
            "fecha_hora": self.fecha_hora.isoformat(),
            "observacion": self.observacion,
            "articulos": articulos,
        }
