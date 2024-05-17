from sqlalchemy import Column, Numeric
from sqlalchemy import ForeignKey
from sqlalchemy import Integer

from server.config import db

# Tabla de asociación entre tributos y tipos de comprobante
tributo_tipo_comprobante = db.Table(
    'tributo_tipo_comprobante',
    Column('tributo_id', Integer, ForeignKey('tributo.id'), primary_key=True),
    Column('tipo_comprobante_id', Integer, ForeignKey('tipo_comprobante.id'), primary_key=True)
)

# Tabla de asociación entre tributos y tipos de responsables
tributo_tipo_responsable = db.Table(
    'tributo_tipo_responsable',
    Column('tributo_id', Integer, ForeignKey('tributo.id'), primary_key=True),
    Column('tipo_responsable_id', Integer, ForeignKey('tipo_responsable.id'), primary_key=True)
)

# Tabla de asociación entre tributos y ventas
tributo_venta = db.Table(
    'tributo_venta',
    Column('tributo_id', Integer, ForeignKey('tributo.id'), primary_key=True),
    Column('venta_id', Integer, ForeignKey('venta.id'), primary_key=True),
    Column('porcentaje', Numeric, nullable=False),
    Column('importe', Numeric, nullable=False)
)

# Tabla de asociación entre tributos y artículos
tributo_articulo = db.Table(
    'tributo_articulo',
    Column('tributo_id', Integer, ForeignKey('tributo.id'), primary_key=True),
    Column('articulo_id', Integer, ForeignKey('articulo.id'), primary_key=True),
)

# Tabla de asociación entre tipos de responsables y tipos de comprobante
responsable_comprobante = db.Table(
    'responsable_comprobante',
    Column('tipo_responsable_id', Integer, ForeignKey('tipo_responsable.id'), primary_key=True),
    Column('tipo_comprobante_id', Integer, ForeignKey('tipo_comprobante.id'), primary_key=True)
)
