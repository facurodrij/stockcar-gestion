from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from server.config import db


class CompraItem(db.Model):
    """
    Modelo de datos para los items de una compra.

    Esta clase representa un renglón de compra en la base de datos. Incluye campos para los datos principales del
    renglón y las relaciones con otras tablas.
    """

    __tablename__ = "compra_item"

    id = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String(30), nullable=False)
    cantidad = Column(Numeric(precision=10, scale=2), nullable=False)
    precio_unidad = Column(Numeric(precision=10, scale=2), nullable=False)
    alicuota_iva = Column(Numeric(precision=5, scale=2), default=21, nullable=False)
    subtotal_iva = Column(Numeric(precision=10, scale=2), nullable=False)
    subtotal_gravado = Column(Numeric(precision=10, scale=2), nullable=False)
    subtotal = Column(Numeric(precision=10, scale=2), nullable=False)

    # Relaciones con otras tablas
    articulo_id = Column(Integer, ForeignKey("articulo.id"), nullable=False)
    articulo = relationship("Articulo", backref="compras_items")
    compra_id = Column(Integer, ForeignKey("compra.id"), nullable=False)
    compra = relationship("Compra", backref="items")

    __table_args__ = (
        UniqueConstraint("articulo_id", "compra_id", name="_articulo_compra_uc"),
    )

    def to_json(self):
        return {
            "id": self.id,
            "articulo_id": self.articulo_id,
            "compra_id": self.compra_id,
            "codigo_principal": self.articulo.codigo_principal if self.articulo else "",
            "descripcion": self.descripcion,
            "cantidad": float(self.cantidad),
            "precio_unidad": float(self.precio_unidad),
            "alicuota_iva": float(self.alicuota_iva),
            "subtotal_iva": float(self.subtotal_iva),
            "subtotal_gravado": float(self.subtotal_gravado),
            "subtotal": float(self.subtotal),
        }
