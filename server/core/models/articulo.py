from sqlalchemy import ForeignKey, Column, Integer, String, Numeric, DateTime, Boolean, Enum, func
from sqlalchemy.orm import relationship

from server.config import db


class Articulo(db.Model):
    """
    Modelo de datos para los artículos.

    Esta clase representa un artículo en la base de datos. Incluye campos para los datos principales del artículo,
    los datos de auditoría y las relaciones con otras tablas.
    """
    __tablename__ = 'articulo'
    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_barras = Column(String, nullable=False)
    codigo_fabricante = Column(String, nullable=True)
    codigo_proveedor = Column(String, nullable=True)
    codigo_interno = Column(String, nullable=True)
    descripcion = Column(String, nullable=False)
    stock_minimo = Column(Numeric, nullable=True)
    stock_maximo = Column(Numeric, nullable=True)
    observacion = Column(String, nullable=True)

    # Relaciones con otras tablas
    tipo_articulo_id = Column(Integer, ForeignKey('tipo_articulo.id'), default=1, nullable=False)
    tipo_articulo = relationship('TipoArticulo', backref='articulos')
    tipo_unidad_id = Column(Integer, ForeignKey('tipo_unidad.id'), default=1, nullable=False)
    tipo_unidad = relationship('TipoUnidad', backref='articulos')
    alicuota_iva_id = Column(Integer, ForeignKey('alicuota_iva.id'), default=1, nullable=False)
    alicuota_iva = relationship('AlicuotaIVA', backref='articulo')

    tributos = relationship('Tributo', secondary='tributo_articulo', back_populates='articulos')

    # Datos de auditoría
    fecha_alta = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, onupdate=func.now())
    baja = Column(Boolean, default=False)
    fecha_baja = Column(DateTime, nullable=True)

    def to_json(self):
        """
        Convierte los datos del artículo a formato JSON.
        """
        tributos = []
        for tributo in self.tributos:
            tributos.append(tributo.to_json())

        return {
            'id': self.id,
            'codigo_barras': self.codigo_barras,
            'codigo_fabricante': self.codigo_fabricante,
            'codigo_proveedor': self.codigo_proveedor,
            'codigo_interno': self.codigo_interno,
            'descripcion': self.descripcion,
            'stock_minimo': self.stock_minimo,
            'stock_maximo': self.stock_maximo,
            'observacion': self.observacion,
            'tipo_articulo': self.tipo_articulo.to_json(),
            'tipo_unidad': self.tipo_unidad.to_json(),
            'alicuota_iva': self.alicuota_iva.to_json(),
            'tributos': tributos,
            'fecha_alta': self.fecha_alta,
            'fecha_modificacion': self.fecha_modificacion,
            'baja': self.baja,
            'fecha_baja': self.fecha_baja,
        }


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
