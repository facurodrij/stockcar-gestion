import enum
from sqlalchemy import ForeignKey, Column, Integer, String, Numeric, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship

from server.config import db
from server.core.utils import DatosAuditoria


class TipoArticulo(enum.Enum):
    PRODUCTO = 'Producto'
    SERVICIO = 'Servicio'


class TipoUnidad(enum.Enum):
    UNIDAD = 'Unidad'
    LITRO = 'Litro'
    GRAMO = 'Gramo'


class Articulo(db.Model, DatosAuditoria):
    """
    Modelo de datos para los artículos.

    Esta clase representa un artículo en la base de datos. Incluye campos para los datos principales del artículo,
    los datos de auditoría y las relaciones con otras tablas.
    """
    __tablename__ = 'articulo'

    id = Column(Integer, primary_key=True, autoincrement=True)
    tipo_articulo = Column(Enum(TipoArticulo), default=TipoArticulo.PRODUCTO, nullable=False)
    codigo_barras = Column(String, nullable=True)
    codigo_fabricante = Column(String, nullable=True)
    codigo_proveedor = Column(String, nullable=True)
    codigo_interno = Column(String, nullable=True)
    descripcion = Column(String, nullable=False)
    unidad = Column(Enum(TipoUnidad), default=TipoUnidad.UNIDAD, nullable=False)
    stock_minimo = Column(Numeric, nullable=True)
    stock_maximo = Column(Numeric, nullable=True)

    # Relaciones con otras tablas
    alicuota_iva_id = Column(Integer, ForeignKey('alicuota_iva.id'), nullable=False)
    alicuota_iva = relationship('AlicuotaIVA', backref='articulo')
    tributos = relationship('Tributo', secondary='tributo_articulo', back_populates='articulos')


class ArticuloCodigo(db.Model):
    """
    Modelo de datos para los códigos de los artículos.

    Esta clase representa un código de artículo en la base de datos. Incluye campos para los datos principales del código
    del artículo y las relaciones con otras tablas.
    """
    __tablename__ = 'articulo_codigo'

    id = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String, nullable=False)
    codigo = Column(String, nullable=False)

    # Relaciones con otras tablas
    articulo_id = Column(Integer, ForeignKey('articulo.id'), nullable=False)
    articulo = relationship('Articulo', backref='articulo_codigo')
