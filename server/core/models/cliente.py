from sqlalchemy import ForeignKey, Column, Integer, String, Numeric, DateTime, Boolean
from sqlalchemy.orm import relationship

from server.config import db
from server.core.utils import DatosAuditoria


class DatosPredefinidos:
    """
    Clase para los datos de configuración para la creación de comprobantes de venta.
    """
    descuento = Column(Numeric, default=0)
    limite = Column(Numeric, default=0)
    duplicado_factura = Column(Boolean, default=False)


class DatosSecundarios:
    """
    Clase para los datos secundarios del cliente.
    """
    nombre_2 = Column(String, nullable=True)
    direccion = Column(String, nullable=True)
    codigo_postal = Column(String, nullable=True)
    fecha_nacimiento = Column(DateTime, nullable=True)
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)
    observacion = Column(String, nullable=True)


class Cliente(db.Model, DatosPredefinidos, DatosSecundarios, DatosAuditoria):
    """
    Modelo de datos para los clientes.

    Esta clase representa un cliente en la base de datos. Incluye campos para los datos principales del cliente,
    los datos de configuración para la creación de comprobantes de venta, los datos secundarios y los datos de auditoría.
    """
    __tablename__ = 'cliente'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nro_doc = Column(String, nullable=False)
    nombre_1 = Column(String, nullable=False)

    # Relaciones con otras tablas
    tipo_doc_id = Column(Integer, ForeignKey('tipo_documento.id'), nullable=False)
    tipo_doc = relationship('TipoDocumento', backref='clientes')
    tipo_responsable_id = Column(Integer, ForeignKey('tipo_responsable.id'), nullable=False)
    tipo_responsable = relationship('TipoResponsable', backref='clientes')

    # -Opcionales
    localidad_id = Column(Integer, ForeignKey('localidad.id'), nullable=True)
    localidad = relationship('Localidad', backref='clientes')
    provincia_id = Column(Integer, ForeignKey('provincia.id'), nullable=True)
    provincia = relationship('Provincia', backref='clientes')
    genero_id = Column(Integer, ForeignKey('genero.id'), nullable=True)
    genero = relationship('Genero', backref='clientes')

    def to_json(self):
        """
        Convierte los datos del cliente a formato JSON.
        """
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
