from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship

from server.config import db


class VentaItem(db.Model):
    __tablename__ = 'venta_item'

    id = Column(Integer, primary_key=True, autoincrement=True)
    # tipo_comprobante = Column(String, nullable=False)
    # letra = Column(String, nullable=False)
    # sucursal = Column(Integer, nullable=False)
    # numero = Column(Integer, nullable=False)
    codigo = Column(String, nullable=False)
    descripcion = Column(String, nullable=False)
    unidad_medida = Column(String, nullable=False)  # Obtener de la tabla de Producto
    cantidad = Column(Numeric, nullable=False)
    precio = Column(Numeric, nullable=False)
    descuento = Column(Numeric, default=0, nullable=False)
    alicuota_iva = Column(Numeric, default=21, nullable=False)
    subtotal_iva = Column(Numeric, nullable=False)
    subtotal_gravado = Column(Numeric, nullable=False)
    subtotal = Column(Numeric, nullable=False)

    # --Foreign keys
    venta_id = Column(Integer, ForeignKey('venta.id'), nullable=False)
    # --Relationships
    venta = relationship('Venta', backref='items')

    def to_json(self):
        return {
            'id': self.id,
            'fecha': self.fecha.strftime('%Y-%m-%d %H:%M:%S'),
            'tipo_doc': self.tipo_doc,
            'letra': self.letra,
            'sucursal': self.sucursal,
            'numero': self.numero,
            'codigo': self.codigo,
            'producto': self.producto,
            'cantidad': self.cantidad
        }
