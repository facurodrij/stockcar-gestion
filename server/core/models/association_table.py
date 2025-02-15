from sqlalchemy import Column, Numeric
from sqlalchemy import ForeignKey
from sqlalchemy import Integer

from server.config import db

tributo_cliente = db.Table(
    "tributo_cliente",
    Column("tributo_id", Integer, ForeignKey("tributo.id"), primary_key=True),
    Column("cliente_id", Integer, ForeignKey("cliente.id"), primary_key=True),
)

# Tabla de asociación entre tributos y tipos de comprobante
tributo_tipo_comprobante = db.Table(
    "tributo_tipo_comprobante",
    Column("tributo_id", Integer, ForeignKey("tributo.id"), primary_key=True),
    Column(
        "tipo_comprobante_id",
        Integer,
        ForeignKey("tipo_comprobante.id"),
        primary_key=True,
    ),
)

# Tabla de asociación entre tributos y tipos de responsables
tributo_tipo_responsable = db.Table(
    "tributo_tipo_responsable",
    Column("tributo_id", Integer, ForeignKey("tributo.id"), primary_key=True),
    Column(
        "tipo_responsable_id",
        Integer,
        ForeignKey("tipo_responsable.id"),
        primary_key=True,
    ),
)

# Tabla de asociación entre tributos y ventas
tributo_venta = db.Table(
    "tributo_venta",
    Column("tributo_id", Integer, ForeignKey("tributo.id"), primary_key=True),
    Column("venta_id", Integer, ForeignKey("venta.id"), primary_key=True),
    Column("importe", Numeric, default=0, nullable=False),
)


# Tabla de asociación entre tipos de responsables y tipos de comprobante
responsable_comprobante = db.Table(
    "responsable_comprobante",
    Column(
        "tipo_responsable_id",
        Integer,
        ForeignKey("tipo_responsable.id"),
        primary_key=True,
    ),
    Column(
        "tipo_comprobante_id",
        Integer,
        ForeignKey("tipo_comprobante.id"),
        primary_key=True,
    ),
)
