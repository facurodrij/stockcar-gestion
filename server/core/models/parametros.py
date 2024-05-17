from server.config import db


class Localidad(db.Model):
    __tablename__ = 'localidad'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String, nullable=False)


class Provincia(db.Model):
    __tablename__ = 'provincia'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String, nullable=False)


class Genero(db.Model):
    __tablename__ = 'genero'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String, nullable=False, unique=True)


class TipoDocumento(db.Model):
    """
    Modelo de datos para los tipos de documentos.

    Esta tabla se llena con datos importados desde el webservice de factura electrónica de AFIP.
    Cada registro representa un tipo de documento específico según la clasificación de AFIP.
    """
    __tablename__ = 'tipo_documento'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    codigo_afip = db.Column(db.Integer, nullable=True)
    descripcion = db.Column(db.String, nullable=True)


class TipoResponsable(db.Model):
    """Tipo de responsable de IVA"""
    __tablename__ = 'tipo_responsable'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descripcion = db.Column(db.String, nullable=False, unique=True)
    abreviatura = db.Column(db.String(5), nullable=False, unique=True)

    # Relación muchos a muchos con TipoComprobante
    comprobantes = db.relationship('TipoComprobante', secondary='responsable_comprobante', backref='responsables')
    tributos = db.relationship('TipoTributo', secondary='tributo_tipo_responsable', backref='responsables')


class TipoComprobante(db.Model):
    """
    Modelo de datos para los tipos de comprobantes.

    Esta tabla se llena con datos importados desde el webservice de factura electrónica de AFIP.
    Cada registro representa un tipo de comprobante específico según la clasificación de AFIP.

    Además, se puede configurar si el comprobante es una factura o no, para determinar si se debe generar un CAE.
    """
    __tablename__ = 'tipo_comprobante'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    codigo_afip = db.Column(db.Integer, nullable=True)  # Código de AFIP, se obtiene del ID
    descripcion = db.Column(db.String, nullable=False)
    letra = db.Column(db.String(1), nullable=False)

    # Relación muchos a muchos con TipoResponsable
    responsables = db.relationship('TipoResponsable', secondary='responsable_comprobante', backref='comprobantes')
    tributos = db.relationship('TipoTributo', secondary='tributo_tipo_comprobante', backref='comprobantes')


class TipoConcepto(db.Model):
    """
    Modelo de datos para los tipos de conceptos de comprobantes.
    Concepto del comprobante: 1 - Productos, 2 - Servicios, 3 - Productos y Servicios

    Esta tabla se llena con datos importados desde el webservice de factura electrónica de AFIP.
    Cada registro representa un tipo de concepto específico según la clasificación de AFIP.
    """
    __tablename__ = 'tipo_concepto'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    codigo_afip = db.Column(db.Integer, nullable=True)
    descripcion = db.Column(db.String, nullable=False)


class TipoTributo(db.Model):
    """
    Modelo de datos para los tipos de tributos.

    Esta tabla se llena con datos importados desde el webservice de factura electrónica de AFIP.
    Cada registro representa un tipo de tributo específico según la clasificación de AFIP.
    """
    __tablename__ = 'tipo_tributo'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    codigo_afip = db.Column(db.Integer, nullable=True)
    descripcion = db.Column(db.String, nullable=False)


class TipoPago(db.Model):
    __tablename__ = 'tipo_pago'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String, nullable=False, unique=True)
    interes = db.Column(db.Numeric, default=0)
    cuotas = db.Column(db.Integer, default=0)


class TipoMoneda(db.Model):
    __tablename__ = 'tipo_moneda'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String, nullable=False, unique=True)
    simbolo = db.Column(db.String(5), nullable=False, unique=True)


class AlicuotaIVA(db.Model):
    __tablename__ = 'alicuota_iva'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    codigo_afip = db.Column(db.Integer, nullable=True)
    descripcion = db.Column(db.String, nullable=False)  # Nombre de la alícuota ("21%", "10.5%", etc)
    porcentaje = db.Column(db.Numeric, nullable=False)  # (21, 10.5, etc)
