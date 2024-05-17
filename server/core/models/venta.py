from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, DateTime, CHAR
from sqlalchemy.orm import relationship

from server.config import db
from server.core.utils import DatosAuditoria


class DatosFacturacion:
    """
    Clase para los datos de facturación de la venta.

    Esta clase incluye campos para los datos de facturación de la venta.
    """
    nombre_cliente = Column(String, nullable=False)
    descuento = Column(Numeric, default=0, nullable=False)
    gravado = Column(Numeric, nullable=False)  # Total - IVA - Percepción
    total = Column(Numeric, nullable=False)
    cae = Column(String, nullable=True)  # Código de Autorización Electrónico
    fecha_venc_cae = Column(DateTime, nullable=True)


class Venta(db.Model, DatosFacturacion, DatosAuditoria):
    """
    Modelo de datos para las ventas.

    Esta clase representa una venta en la base de datos. Incluye campos para los datos principales de la venta,
    los datos de facturación y los datos de auditoría.
    """
    __tablename__ = 'venta'

    id = Column(Integer, primary_key=True, autoincrement=True)
    sucursal = Column(Integer, nullable=False)
    numero = Column(Integer, nullable=False)

    # Relaciones con otras tablas
    tipo_comprobante_id = Column(Integer, ForeignKey('tipo_comprobante.id'), nullable=False)
    tipo_comprobantes = relationship('TipoComprobante', backref='ventas')

    cliente_id = Column(Integer, ForeignKey('cliente.id'), nullable=False)
    clientes = relationship('Cliente', backref='ventas')

    tributos = relationship('Tributo', secondary='tributo_venta', backref='ventas')

    def nro_comprobante(self):
        """
        Devuelve el número de documento en formato 0000-00000000.
        """
        return f'{self.sucursal:04d}-{self.numero:08d}'

    def to_json(self):
        """
        Convierte los datos de la venta a formato JSON.
        """
        return {
            'id': self.id,
            'tipo_doc': self.tipo_doc,
            'letra': self.letra,
            'sucursal': self.sucursal,
            'numero': self.numero,
            'nro_doc': self.nro_comprobante(),
            'fecha': self.fecha.strftime('%Y-%m-%d %H:%M:%S'),
            'nombre_cliente': self.nombre_cliente,
            'gravado': self.gravado,
            'total': self.total,
            'asociado': self.asociado,
            'vendedor': self.vendedor,
            'operador': self.operador,
            'movimiento': self.movimiento,
        }
