from sqlalchemy import (
    ForeignKey,
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    Boolean,
    func,
    PickleType,
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.mutable import MutableList
from server.config import db


class Articulo(db.Model):
    """
    Modelo de datos para los artículos.

    Esta clase representa un artículo en la base de datos. Incluye campos para los datos principales del artículo,
    los datos de auditoría y las relaciones con otras tablas.
    """

    __tablename__ = "articulo"
    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_principal = Column(String, nullable=False)
    codigo_secundario = Column(String, nullable=True)
    codigo_terciario = Column(String, nullable=True)
    codigo_cuaternario = Column(String, nullable=True)
    codigo_adicional = Column(MutableList.as_mutable(PickleType), nullable=True)
    descripcion = Column(String, nullable=False)
    linea_factura = Column(String(30), nullable=False)
    stock_actual = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    stock_minimo = Column(Numeric(precision=10, scale=2), nullable=True)
    stock_maximo = Column(Numeric(precision=10, scale=2), nullable=True)
    observacion = Column(String, nullable=True)

    # Relaciones con otras tablas
    tipo_articulo_id = Column(
        Integer, ForeignKey("tipo_articulo.id"), default=1, nullable=False
    )
    tipo_articulo = relationship("TipoArticulo", backref="articulos")
    tipo_unidad_id = Column(
        Integer, ForeignKey("tipo_unidad.id"), default=1, nullable=False
    )
    tipo_unidad = relationship("TipoUnidad", backref="articulos")
    alicuota_iva_id = Column(
        Integer, ForeignKey("alicuota_iva.id"), default=1, nullable=False
    )
    alicuota_iva = relationship("AlicuotaIVA", backref="articulo")

    tributos = relationship(
        "Tributo", secondary="tributo_articulo", back_populates="articulos"
    )

    movimientos = relationship(
        "MovimientoStock",
        secondary="articulo_movimiento_stock",
        back_populates="articulos",
    )

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
        
        movimientos = []
        for movimiento in self.movimientos:
            movimientos.append(movimiento.to_json())

        return {
            "id": self.id,
            "codigo_principal": self.codigo_principal,
            "codigo_secundario": self.codigo_secundario,
            "codigo_terciario": self.codigo_terciario,
            "codigo_cuaternario": self.codigo_cuaternario,
            "codigo_adicional": self.codigo_adicional,
            "descripcion": self.descripcion,
            "linea_factura": self.linea_factura,
            "stock_actual": self.stock_actual,
            "stock_minimo": self.stock_minimo,
            "stock_maximo": self.stock_maximo,
            "observacion": self.observacion,
            "tipo_articulo": self.tipo_articulo.to_json(),
            "tipo_unidad": self.tipo_unidad.to_json(),
            "alicuota_iva": self.alicuota_iva.to_json(),
            "tributos": tributos,
            "movimientos": movimientos,
            "fecha_alta": self.fecha_alta,
            "fecha_modificacion": self.fecha_modificacion,
            "baja": self.baja,
            "fecha_baja": self.fecha_baja,
        }
