from sqlalchemy import (
    ForeignKey,
    Column,
    Integer,
    String,
    Numeric,
    PickleType,
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.mutable import MutableList
from server.config import db
from server.utils.utils import AuditMixin, SoftDeleteMixin, QueryWithSoftDelete


class Articulo(AuditMixin, SoftDeleteMixin, db.Model):
    """
    Modelo de datos para los artículos.

    Esta clase representa un artículo en la base de datos. Incluye campos para los datos principales del artículo,
    los datos de auditoría y las relaciones con otras tablas.
    """

    __tablename__ = "articulo"
    __pluralname__ = "articulos"
    query_class = QueryWithSoftDelete

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

    def to_json_min(self):
        """
        Devuelve un diccionario con los datos mínimos del artículo.
        """
        return {
            "id": self.id,
            "codigo_principal": self.codigo_principal,
            "codigo_secundario": self.codigo_secundario,
            "codigo_terciario": self.codigo_terciario,
            "codigo_cuaternario": self.codigo_cuaternario,
            "codigo_adicional": self.codigo_adicional,
            "descripcion": self.descripcion,
            "linea_factura": self.linea_factura,
            "stock_actual": float(self.stock_actual),
            "alicuota_iva": self.alicuota_iva.to_json(),
        }

    def to_json(self):
        """
        Convierte los datos del artículo a formato JSON.
        """

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
            "stock_minimo": self.stock_minimo if self.stock_minimo else 0,
            "stock_maximo": self.stock_maximo if self.stock_maximo else 0,
            "observacion": self.observacion,
            "tipo_articulo": self.tipo_articulo.to_json(),
            "tipo_unidad": self.tipo_unidad.to_json(),
            "alicuota_iva": self.alicuota_iva.to_json(),
            **self.get_audit_fields(),
        }

    def to_dict(self) -> dict:
        """
        Convierte los datos del artículo a formato de diccionario.
        """
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
            "stock_minimo": self.stock_minimo if self.stock_minimo else 0,
            "stock_maximo": self.stock_maximo if self.stock_maximo else 0,
            "observacion": self.observacion,
            "tipo_articulo": self.tipo_articulo.to_dict(),
            "tipo_unidad": self.tipo_unidad.to_dict(),
            "alicuota_iva": self.alicuota_iva.to_dict(),
            **self.get_audit_fields(),
        }

    def to_datagrid_dict(self) -> dict:
        """
        Convierte los datos del artículo a formato de diccionario para datagrid.
        """
        return {
            "id": self.id,
            "codigo_principal": self.codigo_principal,
            "codigo_secundario": self.codigo_secundario,
            "codigo_terciario": self.codigo_terciario,
            "codigo_cuaternario": self.codigo_cuaternario,
            "codigo_adicional": self.codigo_adicional,
            "descripcion": self.descripcion,
            "linea_factura": self.linea_factura,
            "stock_actual": float(self.stock_actual),
            "alicuota_iva": self.alicuota_iva.to_dict(),
        }

    def __repr__(self):
        return f"<Articulo {self.id} - {self.descripcion}>"

    def __str__(self):
        return f"{self.descripcion}"
