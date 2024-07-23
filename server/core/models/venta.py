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
    fecha_hora = Column(DateTime, default=func.now(), nullable=False)
    descuento = Column(Numeric(precision=5, scale=2), default=0, nullable=False)
    recargo = Column(Numeric(precision=5, scale=2), default=0, nullable=False)
    gravado = Column(Numeric(precision=10, scale=2), default=0, nullable=False)  # Total - IVA - Percepción
    total_iva = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    total_tributos = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    total = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    cae = Column(String, nullable=True)  # Código de Autorización Electrónico
    vencimiento_cae = Column(DateTime, nullable=True)
    # TODO agregar campo observaciones
    # TODO investigar como almacenar los tipos de pagos, teniendo en cuenta que una venta puede pagarse con varios tipos de pagos

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

    def get_last_number(self):
        """
        TODO Devuelve el último número de venta, según el comprobante y punto de venta.
        """
        return 0
    
    def to_json(self):
        """
        Convierte los datos de la venta a formato JSON.
        """
        tributos = []
        for tributo in self.tributos:
            tributos.append(tributo.to_json())

        return {
            'id': self.id,
            'cliente': self.cliente.to_json_min(),
            'tipo_comprobante': self.tipo_comprobante.to_json(),
            'moneda': self.moneda.to_json(),
            'tipo_pago': self.tipo_pago.to_json(),
            'punto_venta': self.punto_venta,
            'numero': self.numero,
            'nro_comprobante': self.nro_comprobante(),
            'nombre_cliente': self.nombre_cliente,
            'fecha_hora': self.fecha_hora.isoformat(),
            'descuento': self.descuento,
            'recargo': self.recargo,
            'gravado': self.gravado,
            'total': self.total,
            'cae': self.cae,
            'vencimiento_cae': self.vencimiento_cae.isoformat() if self.vencimiento_cae else None,
            'tributos': tributos
        }
