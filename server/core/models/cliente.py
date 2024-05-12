from server.config import db
from sqlalchemy import func, ForeignKey, Column, Integer, String, Numeric, DateTime, Float, Boolean
from sqlalchemy.orm import relationship


class DatosPrincipales:
    """Datos de identificación del cliente."""
    id = Column(Integer, primary_key=True, autoincrement=True)
    nro_doc = Column(String, nullable=False)
    nombre_1 = Column(String, nullable=False)
    # --Foreign keys
    tipo_doc_id = Column(Integer, ForeignKey('tipo_documento.id'), nullable=False)
    tipo_responsable_id = Column(Integer, ForeignKey('tipo_responsable.id'), nullable=False)
    # --Relationships
    tipo_doc = relationship('TipoDocumento', backref='clientes')
    tipo_responsable = relationship('TipoResponsable', backref='clientes')


class DatosFacturacion:
    """Datos de configuración para la creación de comprobantes de venta."""
    percepcion = Column(Numeric, default=0)
    descuento = Column(Numeric, default=0)
    limite = Column(Numeric, default=0)
    duplicado_factura = Column(Boolean, default=False)


class DatosSecundarios:
    nombre_2 = Column(String, nullable=True)
    direccion = Column(String, nullable=True)
    codigo_postal = Column(String, nullable=True)
    fecha_nacimiento = Column(DateTime, nullable=True)
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)
    observacion = Column(String, nullable=True)


class DatosAuditoria:
    fecha_alta = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, onupdate=func.utc_timestamp())
    baja = Column(Boolean, default=False)
    fecha_baja = Column(DateTime, nullable=True)


class Cliente(db.Model, DatosPrincipales, DatosFacturacion, DatosSecundarios, DatosAuditoria):
    __tablename__ = 'cliente'

    localidad_id = Column(Integer, ForeignKey('localidad.id'), nullable=True)
    provincia_id = Column(Integer, ForeignKey('provincia.id'), nullable=True)
    genero_id = Column(Integer, ForeignKey('genero.id'), nullable=True)

    localidad = relationship('Localidad', backref='clientes')
    provincia = relationship('Provincia', backref='clientes')
    genero = relationship('Genero', backref='clientes')

    def to_json(self):
        return {
            'id': self.id,
            'nombre_1': self.nombre_1,
            'nombre_2': self.nombre_2,
            'direccion': self.direccion,
            'localidad': self.localidad,
            'provincia': self.provincia,
            'codigo_postal': self.codigo_postal,
            'telefono': self.telefono,
            'tipo_doc': self.tipo_doc,
            'nro_doc': self.nro_doc,
            'tipo_contribuyente': self.tipo_contribuyente,
            'observacion': self.observacion
        }
