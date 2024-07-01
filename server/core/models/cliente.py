from sqlalchemy import ForeignKey, Column, Integer, String, Numeric, DateTime, Boolean, func, Date
from sqlalchemy.orm import relationship

from server.config import db


class Cliente(db.Model):
    """
    Modelo de datos para los clientes.

    Esta clase representa un cliente en la base de datos. Incluye campos para los datos principales del cliente,
    los datos de configuración para la creación de comprobantes de venta, los datos secundarios y los datos de auditoría.
    """
    __tablename__ = 'cliente'

    # Datos principales
    id = Column(Integer, primary_key=True, autoincrement=True)
    nro_documento = Column(String, nullable=False)
    razon_social = Column(String, nullable=False)
    direccion = Column(String, nullable=False)
    localidad = Column(String, nullable=False)
    codigo_postal = Column(String, nullable=False)
    tipo_documento_id = Column(Integer, ForeignKey('tipo_documento.id'), nullable=False)
    tipo_documento = relationship('TipoDocumento', backref='clientes')
    tipo_responsable_id = Column(Integer, ForeignKey('tipo_responsable.id'), nullable=False)
    tipo_responsable = relationship('TipoResponsable', backref='clientes')
    provincia_id = Column(Integer, ForeignKey('provincia.id'), nullable=False)
    provincia = relationship('Provincia', backref='clientes')

    # Datos de configuración para la creación de comprobantes de venta
    descuento = Column(Numeric(precision=5, scale=2), default=0)
    recargo = Column(Numeric(precision=5, scale=2), default=0)
    limite_credito = Column(Numeric(precision=10, scale=2), default=0)
    duplicado_factura = Column(Boolean, default=False)
    exento_iva = Column(Boolean, default=False)
    tipo_pago_id = Column(Integer, ForeignKey('tipo_pago.id'), default=1)
    tipo_pago = relationship('TipoPago', backref='clientes')
    moneda_id = Column(Integer, ForeignKey('moneda.id'), default=1)
    moneda = relationship('Moneda', backref='clientes')
    tributos = relationship('Tributo', secondary='tributo_cliente', back_populates='clientes')

    # Datos personales (opcionales)
    fecha_nacimiento = Column(Date, nullable=True)
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)
    genero_id = Column(Integer, ForeignKey('genero.id'), nullable=True)
    genero = relationship('Genero', backref='clientes')
    observacion = Column(String, nullable=True)

    # Datos de auditoría
    fecha_alta = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, onupdate=func.now())
    baja = Column(Boolean, default=False)
    fecha_baja = Column(DateTime, nullable=True)

    def to_json_min(self):
        """
        Convierte los datos mínimos del cliente a formato JSON.
        """
        return {
            'id': self.id,
            'razon_social': self.razon_social,
        }

    def to_json(self):
        """
        Convierte los datos del cliente a formato JSON.
        """
        tributos = []
        for tributo in self.tributos:
            tributos.append(tributo.to_json())

        return {
            'id': self.id,
            'tipo_documento': self.tipo_documento.to_json(),
            'nro_documento': self.nro_documento,
            'tipo_responsable': self.tipo_responsable.to_json(),
            'razon_social': self.razon_social,
            'direccion': self.direccion,
            'localidad': self.localidad,
            'provincia': self.provincia.to_json(),
            'codigo_postal': self.codigo_postal,
            'telefono': self.telefono,
            'email': self.email,
            'fecha_nacimiento': self.fecha_nacimiento.isoformat() if self.fecha_nacimiento else None,
            'genero': self.genero.to_json() if self.genero else None,
            'descuento': self.descuento,
            'recargo': self.recargo,
            'limite_credito': self.limite_credito,
            'duplicado_factura': self.duplicado_factura,
            'exento_iva': self.exento_iva,
            'tipo_pago': self.tipo_pago.to_json(),
            'moneda': self.moneda.to_json(),
            'tributos': tributos,
            'observacion': self.observacion,
            'fecha_alta': self.fecha_alta.isoformat(),
        }
