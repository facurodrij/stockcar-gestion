from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, DateTime, CHAR, Table
from sqlalchemy.orm import relationship

from server.config import db


class Tributo(db.Model):
    """
    Modelo de datos para los tributos adicionales al IVA.

    Esta clase representa un tributo en la base de datos. Incluye campos para los datos principales del tributo
    y las relaciones con otras tablas.
    """
    __tablename__ = 'tributo'

    id = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String, nullable=False)
    alicuota = Column(Numeric, nullable=False)  # Porcentaje de la alícuota
    minimo_imponible = Column(Numeric, default=0, nullable=False)  # Minimo imponible
    """Es de utilidad para el caso de percepciones que se calculan sólo a partir de un importe determinado. 
    En este campo se consigna el importe mínimo gravado a partir del que se calculará la sobretasa correspondiente."""

    # Relaciones con otras tablas
    tipo_tributo_id = Column(Integer, ForeignKey('tipo_tributo.id'), nullable=False)
    tipo_tributo = db.relationship('TipoTributo', backref='tributos')
    clientes = relationship('Cliente', secondary='tributo_cliente', back_populates='tributos')
    tipo_comprobantes = relationship('TipoComprobante', secondary='tributo_tipo_comprobante', back_populates='tributos')
    tipo_responsables = relationship('TipoResponsable', secondary='tributo_tipo_responsable', back_populates='tributos')
    ventas = relationship('Venta', secondary='tributo_venta', back_populates='tributos')
    articulos = relationship('Articulo', secondary='tributo_articulo', back_populates='tributos')
