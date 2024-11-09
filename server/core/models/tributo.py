import enum
from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship

from server.config import db


class BaseCalculo(enum.Enum):
    """
    Enumeración para los tipos de base de cálculo de los tributos.
    """

    neto = "Neto"  # Se calcula sobre el neto gravado, es decir, el total de la venta menos el IVA
    bruto = "Bruto"


class Tributo(db.Model):
    """
    Modelo de datos para los tributos adicionales al IVA.

    Esta clase representa un tributo en la base de datos. Incluye campos para los datos principales del tributo
    y las relaciones con otras tablas.
    """

    __tablename__ = "tributo"
    __pluralname__ = "tributos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String, nullable=False)
    alicuota = Column(Numeric(precision=5, scale=2), nullable=False)
    minimo_imponible = Column(
        Numeric(precision=10, scale=2),
        default=0,
        nullable=False,
    )
    """Es de utilidad para el caso de percepciones que se calculan sólo a partir de un importe determinado. 
    En este campo se consigna el importe mínimo gravado a partir del que se calculará la sobretasa correspondiente."""
    base_calculo = Column(Enum(BaseCalculo), default=BaseCalculo.neto, nullable=False)

    # Relaciones con otras tablas
    tipo_tributo_id = Column(Integer, ForeignKey("tipo_tributo.id"), nullable=False)
    tipo_tributo = relationship("TipoTributo", backref="tributos")
    clientes = relationship(
        "Cliente", secondary="tributo_cliente", back_populates="tributos"
    )
    tipo_comprobantes = relationship(
        "TipoComprobante",
        secondary="tributo_tipo_comprobante",
        back_populates="tributos",
    )
    tipo_responsables = relationship(
        "TipoResponsable",
        secondary="tributo_tipo_responsable",
        back_populates="tributos",
    )
    ventas = relationship("Venta", secondary="tributo_venta", back_populates="tributos")

    def to_json(self):
        """
        Convierte los datos del tributo a formato JSON.
        """
        return {
            "id": self.id,
            "descripcion": self.descripcion,
            "alicuota": float(self.alicuota),
            "minimo_imponible": self.minimo_imponible,
            "base_calculo": self.base_calculo.value,
            "tipo_tributo": self.tipo_tributo.to_dict(),
        }

    def to_dict(self) -> dict:
        """
        Convierte los datos del tributo a un diccionario.
        """
        return {
            "id": self.id,
            "descripcion": self.descripcion,
            "alicuota": float(self.alicuota),
            "minimo_imponible": self.minimo_imponible,
            "base_calculo": self.base_calculo.value,
            "tipo_tributo": self.tipo_tributo.to_dict(),
        }

    def to_datagrid_dict(self) -> dict:
        """
        Convierte los datos del tributo a un diccionario para ser utilizado en un datagrid.
        """
        return {
            "id": self.id,
            "descripcion": self.descripcion,
            "alicuota": float(self.alicuota),
        }

    def __repr__(self):
        return f"<Tributo {self.descripcion}>"

    def __str__(self):
        return self.descripcion
