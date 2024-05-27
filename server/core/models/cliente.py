from sqlalchemy import ForeignKey, Column, Integer, String, Numeric, DateTime, Boolean, func
from sqlalchemy.orm import relationship

from server.config import db


class Cliente(db.Model):
    """
    Modelo de datos para los clientes.

    Esta clase representa un cliente en la base de datos. Incluye campos para los datos principales del cliente,
    los datos de configuración para la creación de comprobantes de venta, los datos secundarios y los datos de auditoría.
    """
    __tablename__ = 'cliente'

    # Datos principales del cliente
    id = Column(Integer, primary_key=True, autoincrement=True)
    nro_doc = Column(String, nullable=False)
    razon_social = Column(String, nullable=False)
    direccion = Column(String, nullable=False)
    localidad = Column(String, nullable=False)
    codigo_postal = Column(String, nullable=False)

    # Relaciones con otras tablas
    tipo_doc_id = Column(Integer, ForeignKey('tipo_documento.id'), nullable=False)
    tipo_doc = relationship('TipoDocumento', backref='clientes')
    tipo_responsable_id = Column(Integer, ForeignKey('tipo_responsable.id'), nullable=False)
    tipo_responsable = relationship('TipoResponsable', backref='clientes')
    provincia_id = Column(Integer, ForeignKey('provincia.id'), nullable=False)
    provincia = relationship('Provincia', backref='clientes')

    # Datos de configuración para la creación de comprobantes de venta
    descuento = Column(Numeric, default=0)
    limite = Column(Numeric, default=0)
    duplicado_factura = Column(Boolean, default=False)

    # Datos personales (opcionales)
    fecha_nacimiento = Column(DateTime, nullable=True)
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)
    observacion = Column(String, nullable=True)

    # Relaciones con otras tablas (opcionales)
    genero_id = Column(Integer, ForeignKey('genero.id'), nullable=True)
    genero = relationship('Genero', backref='clientes')

    # Datos de auditoría
    fecha_alta = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, onupdate=func.utc_timestamp())
    baja = Column(Boolean, default=False)
    fecha_baja = Column(DateTime, nullable=True)

    def to_json(self):
        """
        Convierte los datos del cliente a formato JSON.
        """
        return {
            'id': self.id,
            'tipo_doc': self.tipo_doc.descripcion,
            'nro_doc': self.nro_doc,
            'tipo_responsable': self.tipo_responsable.descripcion,
            'razon_social': self.razon_social,
            'direccion': self.direccion,
            'localidad': self.localidad,
            'provincia': self.provincia.nombre,
            'codigo_postal': self.codigo_postal,
            'telefono': self.telefono,
            'email': self.email,
            'fecha_nacimiento': self.fecha_nacimiento,
            'genero': self.genero.nombre if self.genero else None,
            'descuento': self.descuento,
            'limite': self.limite,
            'duplicado_factura': self.duplicado_factura,
            'observacion': self.observacion,
            'fecha_alta': self.fecha_alta
        }
