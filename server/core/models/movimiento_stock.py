import pytz
import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Enum,
    func,
)
from sqlalchemy.orm import relationship
from server.core.utils import AuditMixin
from server.config import db

local_tz = pytz.timezone("America/Argentina/Buenos_Aires")


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


class MovimientoStock(AuditMixin, db.Model):
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

    def to_json(self):
        return {
            "id": self.id,
            "tipo_movimiento": self.tipo_movimiento.name,
            "origen": self.origen.name,
            "fecha_hora": self.fecha_hora.isoformat(),
            "observacion": self.observacion,
            **self.get_audit_fields(),
        }
