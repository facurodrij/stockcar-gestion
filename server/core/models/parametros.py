from sqlalchemy import Column, Integer, String, Numeric, Boolean, Enum
from sqlalchemy.orm import relationship
from server.core.models.enums import EstadoVenta, EstadoCompra

from server.config import db


class Provincia(db.Model):
    __tablename__ = "provincia"
    __pluralname__ = "provincia"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    codigo_afip = Column(Integer, nullable=True)

    def to_dict(self) -> dict:
        return {"id": self.id, "nombre": self.nombre, "codigo_afip": self.codigo_afip}

    def to_select_dict(self) -> dict:
        return {"value": self.id, "label": self.nombre}


class Genero(db.Model):
    __tablename__ = "genero"
    __pluralname__ = "genero"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False, unique=True)

    def to_dict(self) -> dict:
        return {"id": self.id, "nombre": self.nombre}

    def to_select_dict(self) -> dict:
        return {"value": self.id, "label": self.nombre}


class TipoDocumento(db.Model):
    """
    Modelo de datos para los tipos de documentos.

    Esta tabla se llena con datos importados desde el webservice de factura electrónica de AFIP.
    Cada registro representa un tipo de documento específico según la clasificación de AFIP.
    """

    __tablename__ = "tipo_documento"
    __pluralname__ = "tipo_documento"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_afip = Column(Integer, nullable=True)
    descripcion = Column(String, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "codigo_afip": self.codigo_afip,
            "descripcion": self.descripcion,
        }

    def to_select_dict(self) -> dict:
        return {"value": self.id, "label": self.descripcion}


class TipoResponsable(db.Model):
    """Tipo de responsable de IVA"""

    __tablename__ = "tipo_responsable"
    __pluralname__ = "tipo_responsable"

    id = Column(Integer, primary_key=True, autoincrement=True)
    descripcion = Column(String, nullable=False, unique=True)
    abreviatura = Column(String(5), nullable=False, unique=True)

    # Relación muchos a muchos con TipoComprobante
    comprobantes = relationship(
        "TipoComprobante",
        secondary="responsable_comprobante",
        back_populates="responsables",
    )
    tributos = relationship(
        "Tributo",
        secondary="tributo_tipo_responsable",
        back_populates="tipo_responsables",
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "descripcion": self.descripcion,
            "abreviatura": self.abreviatura,
        }

    def to_select_dict(self) -> dict:
        return {"value": self.id, "label": self.descripcion}


class TipoComprobante(db.Model):
    """
    Modelo de datos para los tipos de comprobantes.

    Esta tabla se llena con datos importados desde el webservice de factura electrónica de AFIP.
    Cada registro representa un tipo de comprobante específico según la clasificación de AFIP.

    Además, se puede configurar si el comprobante es una factura o no, para determinar si se debe generar un CAE.
    """

    __tablename__ = "tipo_comprobante"
    __pluralname__ = "tipo_comprobante"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_afip = Column(Integer, nullable=True)  # Código de AFIP, se obtiene del ID
    nombre = Column(String(20), nullable=False)
    descripcion = Column(String, nullable=False)
    letra = Column(String(1), nullable=False)
    abreviatura = Column(String(5), nullable=True)
    descontar_stock = Column(Boolean, default=True)
    requiere_comprobante_asociado = Column(Boolean, default=False)
    es_anulable = Column(
        Boolean, default=False
    )  # Indica si el comprobante puede ser anulado con Nota de Crédito
    estado_venta = Column(
        Enum(EstadoVenta), nullable=True
    )  # Estado de la venta por defecto
    estado_compra = Column(
        Enum(EstadoCompra), nullable=True
    )  # Estado de la compra por defecto

    # Relación muchos a muchos con TipoResponsable
    responsables = relationship(
        "TipoResponsable",
        secondary="responsable_comprobante",
        back_populates="comprobantes",
    )
    tributos = relationship(
        "Tributo",
        secondary="tributo_tipo_comprobante",
        back_populates="tipo_comprobantes",
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "codigo_afip": self.codigo_afip,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "letra": self.letra,
            "abreviatura": self.abreviatura,
            "descontar_stock": self.descontar_stock,
            "requiere_comprobante_asociado": self.requiere_comprobante_asociado,
            "es_anulable": self.es_anulable,
        }

    def to_select_dict(self) -> dict:
        return {
            "value": self.id,
            "label": f"{self.descripcion} ({self.letra})",
            "descontar_stock": self.descontar_stock,
        }


class TipoConcepto(db.Model):
    """
    Modelo de datos para los tipos de conceptos de comprobantes.
    Concepto del comprobante: 1 - Productos, 2 - Servicios, 3 - Productos y Servicios

    Esta tabla se llena con datos importados desde el webservice de factura electrónica de AFIP.
    Cada registro representa un tipo de concepto específico según la clasificación de AFIP.
    """

    __tablename__ = "tipo_concepto"
    __pluralname__ = "tipo_concepto"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_afip = Column(Integer, nullable=True)
    descripcion = Column(String, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "codigo_afip": self.codigo_afip,
            "descripcion": self.descripcion,
        }

    def to_select_dict(self) -> dict:
        return {"value": self.id, "label": self.descripcion}


class TipoTributo(db.Model):
    """
    Modelo de datos para los tipos de tributos.

    Esta tabla se llena con datos importados desde el webservice de factura electrónica de AFIP.
    Cada registro representa un tipo de tributo específico según la clasificación de AFIP.
    """

    __tablename__ = "tipo_tributo"
    __pluralname__ = "tipo_tributo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_afip = Column(Integer, nullable=True)
    descripcion = Column(String, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "codigo_afip": self.codigo_afip,
            "descripcion": self.descripcion,
        }

    def to_select_dict(self) -> dict:
        return {"value": self.id, "label": self.descripcion}


class TipoPago(db.Model):
    __tablename__ = "tipo_pago"
    __pluralname__ = "tipo_pago"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False, unique=True)
    interes = Column(Numeric(precision=5, scale=2), default=0)
    cuotas = Column(Integer, default=0)
    dias_acreditacion = Column(Integer, default=0)
    retencion = Column(Numeric(precision=5, scale=2), default=0)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nombre": self.nombre,
            "interes": float(self.interes),
            "cuotas": self.cuotas,
            "dias_acreditacion": self.dias_acreditacion,
            "retencion": float(self.retencion),
        }

    def to_select_dict(self) -> dict:
        return {"value": self.id, "label": self.nombre}


class Moneda(db.Model):
    __tablename__ = "moneda"
    __pluralname__ = "moneda"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    simbolo = Column(String(5), nullable=False)
    codigo_iso = Column(String(3), nullable=False)
    codigo_afip = Column(String(3), nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nombre": self.nombre,
            "simbolo": self.simbolo,
            "codigo_iso": self.codigo_iso,
            "codigo_afip": self.codigo_afip,
        }

    def to_select_dict(self) -> dict:
        return {"value": self.id, "label": self.nombre}


class AlicuotaIVA(db.Model):
    __tablename__ = "alicuota_iva"
    __pluralname__ = "alicuota_iva"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_afip = Column(Integer, nullable=True, unique=True)
    descripcion = Column(
        String, nullable=False, unique=True
    )  # Nombre de la alícuota ("21%", "10.5%", etc)
    porcentaje = Column(Numeric(precision=5, scale=2), nullable=False, unique=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "codigo_afip": self.codigo_afip,
            "descripcion": self.descripcion,
            "porcentaje": self.porcentaje,
        }

    def to_select_dict(self) -> dict:
        return {"value": self.porcentaje, "label": self.porcentaje}


class TipoArticulo(db.Model):
    __tablename__ = "tipo_articulo"
    __pluralname__ = "tipo_articulo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False, unique=True)

    def to_dict(self) -> dict:
        return {"id": self.id, "nombre": self.nombre}

    def to_select_dict(self) -> dict:
        return {"value": self.id, "label": self.nombre}


class TipoUnidad(db.Model):
    __tablename__ = "tipo_unidad"
    __pluralname__ = "tipo_unidad"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False, unique=True)
    abreviatura = Column(String, nullable=False, unique=True)

    def to_dict(self) -> dict:
        return {"id": self.id, "nombre": self.nombre, "abreviatura": self.abreviatura}

    def to_select_dict(self) -> dict:
        return {"value": self.id, "label": self.nombre}
