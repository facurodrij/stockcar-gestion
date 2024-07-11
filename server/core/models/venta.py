from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, DateTime, CHAR, Boolean, func
from sqlalchemy.orm import relationship

from server.config import db


class Venta(db.Model):
    """
    Modelo de datos para las ventas.

    Esta clase representa una venta en la base de datos. Incluye campos para los datos principales de la venta,
    los datos de facturación y los datos de auditoría.
    """
    __tablename__ = 'venta'

    id = Column(Integer, primary_key=True, autoincrement=True)
    punto_venta = Column(Integer, nullable=False)
    numero = Column(Integer, nullable=False)
    nombre_cliente = Column(String, nullable=False)
    fecha_hora = Column(DateTime, default=func.now())
    descuento = Column(Numeric(precision=5, scale=2), default=0)
    recargo = Column(Numeric(precision=5, scale=2), default=0)
    gravado = Column(Numeric(precision=10, scale=2), default=0)  # Total - IVA - Percepción
    total_iva = Column(Numeric(precision=10, scale=2), default=0)
    total_tributos = Column(Numeric(precision=10, scale=2), default=0)
    total = Column(Numeric(precision=10, scale=2), nullable=False)
    cae = Column(String, nullable=True)  # Código de Autorización Electrónico
    vencimiento_cae = Column(DateTime, nullable=True)

    # Relaciones con otras tablas
    tipo_comprobante_id = Column(Integer, ForeignKey('tipo_comprobante.id'), nullable=False)
    tipo_comprobante = relationship('TipoComprobante', backref='ventas')
    cliente_id = Column(Integer, ForeignKey('cliente.id'), nullable=False)
    cliente = relationship('Cliente', backref='ventas')
    moneda_id = Column(Integer, ForeignKey('moneda.id'), default=1, nullable=False)
    moneda = relationship('Moneda', backref='ventas')
    tipo_pago_id = Column(Integer, ForeignKey('tipo_pago.id'), default=1, nullable=False)
    tipo_pago = relationship('TipoPago', backref='ventas')

    tributos = relationship('Tributo', secondary='tributo_venta', back_populates='ventas')

    # Datos de Auditoría
    fecha_alta = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, onupdate=func.now())
    baja = Column(Boolean, default=False)
    fecha_baja = Column(DateTime, nullable=True)

    def nro_comprobante(self):
        """
        Devuelve el número de documento en formato 0000-00000000.
        """
        return f'{self.punto_venta:04d}-{self.numero:08d}'

    def to_json(self):
        """
        Convierte los datos de la venta a formato JSON.
        """
        return {
            'id': self.id,
            'tipo_comprobante': self.tipo_comprobante.to_json(),
            'punto_venta': self.punto_venta,
            'numero': self.numero,
            'nro_comprobante': self.nro_comprobante(),
            'nombre_cliente': self.nombre_cliente,
            'gravado': self.gravado,
            'total': self.total
        }
