from sqlalchemy import Column, String, Integer, ForeignKey, Date, DateTime, CHAR, Boolean, func
from sqlalchemy.orm import relationship

from server.config import db


class Comercio(db.Model):
    """
    Modelo de datos para los comercios.
    """
    __tablename__ = 'comercio'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    razon_social = Column(String, nullable=False)
    nombre_fantasia = Column(String, nullable=False)
    cuit = Column(CHAR(11), nullable=False)
    ingresos_brutos = Column(String, nullable=False)
    inicio_actividades = Column(Date, nullable=False, default=func.current_date())
    direccion = Column(String, nullable=False)
    localidad = Column(String, nullable=False)
    codigo_postal = Column(String, nullable=False)
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)
    observacion = Column(String, nullable=True)

    # Relaciones con otras tablas
    tipo_responsable_id = Column(Integer, ForeignKey('tipo_responsable.id'), nullable=False)
    tipo_responsable = relationship('TipoResponsable', backref='comercios')
    provincia_id = Column(Integer, ForeignKey('provincia.id'), nullable=False)
    provincia = relationship('Provincia', backref='comercios')

    fecha_alta = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, onupdate=func.now())
    baja = Column(Boolean, default=False)
    fecha_baja = Column(DateTime, nullable=True)

    def to_json(self):
        """
        Devuelve el objeto en formato JSON.
        """
        return {
            'id': self.id,
            'razon_social': self.razon_social,
            'cuit': self.cuit,
            'ingresos_brutos': self.ingresos_brutos,
            'nombre_fantasia': self.nombre_fantasia,
            'inicio_actividades': self.inicio_actividades,
            'direccion': self.direccion,
            'localidad': self.localidad,
            'codigo_postal': self.codigo_postal,
            'telefono': self.telefono,
            'email': self.email,
            'observacion': self.observacion,
            'tipo_responsable': self.tipo_responsable.to_json(),
            'provincia': self.provincia.to_json(),
            'fecha_alta': self.fecha_alta,
            'fecha_modificacion': self.fecha_modificacion,
            'baja': self.baja,
            'fecha_baja': self.fecha_baja
        }


class PuntoVenta(db.Model):
    """
    Modelo de datos para los puntos de venta.
    """
    __tablename__ = 'punto_venta'

    id = Column(Integer, primary_key=True, autoincrement=True)
    numero = Column(Integer, nullable=False)
    letra = Column(CHAR(1), nullable=False)
    descripcion = Column(String, nullable=False)
    habilitado = Column(Boolean, default=True)
    observacion = Column(String, nullable=True)

    # Relaciones con otras tablas
    comercio_id = Column(Integer, ForeignKey('comercio.id'), nullable=False)
    comercio = relationship('Comercio', backref='puntos_venta')

    def to_json(self):
        """
        Devuelve el objeto en formato JSON.
        """
        return {
            'id': self.id,
            'numero': self.numero,
            'letra': self.letra,
            'descripcion': self.descripcion,
            'habilitado': self.habilitado,
            'observacion': self.observacion,
            'comercio': self.comercio.to_json()
        }