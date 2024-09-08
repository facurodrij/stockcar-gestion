from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from server.config import db


class MovimientoStockItem(db.Model):
    """
    Modelo de datos para los items de un movimiento de stock.

    Esta clase representa un renglón de movimiento de stock en la base de datos. Incluye campos para los datos
    principales del renglón y las relaciones con otras tablas.
    """

    __tablename__ = "movimiento_stock_item"
    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_principal = Column(String, nullable=False)
    cantidad = Column(Numeric(precision=10, scale=2), nullable=False)
    stock_posterior = Column(Numeric(precision=10, scale=2), nullable=False)

    articulo_id = Column(Integer, ForeignKey("articulo.id"), nullable=False)
    articulo = relationship("Articulo", backref="movimientos_stock")
    movimiento_stock_id = Column(
        Integer, ForeignKey("movimiento_stock.id"), nullable=False
    )
    movimiento_stock = relationship("MovimientoStock", backref="items")

    def to_json(self):
        return {
            "id": self.id,
            "codigo_principal": self.codigo_principal,
            "descripcion": self.articulo.descripcion,
            "cantidad": float(self.cantidad),
            "stock_posterior": float(self.stock_posterior),
            "articulo_id": self.articulo_id,
            "movimiento_stock_id": self.movimiento_stock_id,
        }
