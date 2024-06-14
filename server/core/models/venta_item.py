from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship

from server.config import db


class VentaItem(db.Model):
    """
    Modelo de datos para los items de una venta.

    Esta clase representa un renglón de venta en la base de datos. Incluye campos para los datos principales del
    renglón y las relaciones con otras tablas.
    """
    __tablename__ = 'venta_item'

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_barras = Column(String, nullable=False)
    codigo_fabricante = Column(String, nullable=True)
    codigo_proveedor = Column(String, nullable=True)
    codigo_interno = Column(String, nullable=True)  # Obtener de la tabla de Producto
    descripcion = Column(String, nullable=False)  # Obtener de la tabla de Producto
    tipo_unidad = Column(String, nullable=False)  # Obtener de la tabla de Producto
    cantidad = Column(Numeric(precision=10, scale=2), nullable=False)
    precio_unidad = Column(Numeric(precision=10, scale=2), nullable=False)
    alicuota_iva = Column(Numeric(precision=5, scale=2), default=21, nullable=False)
    subtotal_iva = Column(Numeric(precision=10, scale=2), nullable=False)
    subtotal_gravado = Column(Numeric(precision=10, scale=2), nullable=False)
    subtotal = Column(Numeric(precision=10, scale=2), nullable=False)

    # Relaciones con otras tablas
    venta_id = Column(Integer, ForeignKey('venta.id'), nullable=False)
    venta = relationship('Venta', backref='items')

    def to_json(self):
        return {
            'id': self.id,
            'codigo': self.codigo,
            'producto': self.producto,
            'cantidad': self.cantidad
        }
