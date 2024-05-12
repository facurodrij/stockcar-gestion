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
    __tablename__ = 'tipo_documento'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String, nullable=False, unique=True)
    descripcion = db.Column(db.String, nullable=True)


class TipoResponsable(db.Model):
    """Tipo de responsable de IVA"""
    __tablename__ = 'tipo_responsable'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String, nullable=False, unique=True)
    abreviatura = db.Column(db.String(5), nullable=False, unique=True)


class TipoComprobante(db.Model):
    __tablename__ = 'tipo_comprobante'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String, nullable=False, unique=True)
    abreviatura = db.Column(db.String(5), nullable=False, unique=True)


class TipoPago(db.Model):
    __tablename__ = 'tipo_pago'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String, nullable=False, unique=True)
    interes = db.Column(db.Numeric, default=0)
    cuotas = db.Column(db.Integer, default=0)
