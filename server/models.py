from config import db


class Venta(db.Model):
    __tablename__ = 'Doc_Vent'
    id = db.Column('DOV_NROID', db.String, primary_key=True)
    tipo_doc = db.Column('DOV_TIPO_DOC', db.String, nullable=False)
    letra = db.Column('DOV_LETRA', db.String, nullable=False)
    sucursal = db.Column('DOV_SUCURSAL', db.Integer, nullable=False)
    numero = db.Column('DOV_NUMERO', db.Integer, nullable=False)
    fecha = db.Column('DOV_FECHA', db.DateTime, nullable=False)
    nombre_cliente = db.Column('DOV_CLINOMBRE', db.String, nullable=False)
    gravado = db.Column('DOV_GRAVADO', db.Float, nullable=False)
    total = db.Column('DOV_TOTAL', db.Float, nullable=False)
    asociado = db.Column('DOV_ASOCIADO', db.Integer, nullable=False)
    vendedor = db.Column('DOV_VENDEDOR', db.Integer, nullable=False)
    operador = db.Column('DOV_OPERADOR', db.Integer, nullable=False)
    movimiento = db.Column('DOV_MOVIMIENTO', db.Integer, nullable=False)
    cliente_id = db.Column(db.String, db.ForeignKey('Cliente.id'))

    cliente = db.relationship('Cliente', backref=db.backref('ventas', lazy=True))

    def to_json(self):
        return {
            'id': self.id,
            'tipo_doc': self.tipo_doc,
            'letra': self.letra,
            'sucursal': self.sucursal,
            'numero': self.numero,
            # Sucursal y número de documento, en formato 0000-00000000
            'nro_doc': f'{self.sucursal:04d}-{self.numero:08d}',
            'fecha': self.fecha.strftime('%Y-%m-%d %H:%M:%S'),
            'nombre_cliente': self.nombre_cliente,
            'gravado': self.gravado,
            'total': self.total,
            'asociado': self.asociado,
            'vendedor': self.vendedor,
            'operador': self.operador,
            'movimiento': self.movimiento,
            'cliente_id': self.cliente_id
        }


class ItemVenta(db.Model):
    __tablename__ = 'Renglon'
    id = db.Column('REN_NROID', db.String, primary_key=True)
    fecha = db.Column('REN_FECHA', db.DateTime, nullable=False)
    tipo_doc = db.Column('REN_TIPO_DOC', db.String, nullable=False)
    letra = db.Column('REN_LETRA', db.String, nullable=False)
    sucursal = db.Column('REN_SUCURSAL', db.Integer, nullable=False)
    numero = db.Column('REN_NUMERO', db.Integer, nullable=False)
    codigo = db.Column('REN_CODIGO', db.Integer, nullable=False)
    producto = db.Column('REN_PRODUCTO', db.String, nullable=False)
    cantidad = db.Column('REN_CANTIDAD', db.Integer, nullable=False)

    def to_json(self):
        return {
            'id': self.id,
            'fecha': self.fecha.strftime('%Y-%m-%d %H:%M:%S'),
            'tipo_doc': self.tipo_doc,
            'letra': self.letra,
            'sucursal': self.sucursal,
            'numero': self.numero,
            'codigo': self.codigo,
            'producto': self.producto,
            'cantidad': self.cantidad
        }


class Cliente(db.Model):
    __tablename__ = 'Cliente'
    id = db.Column('CLI_NROID', db.String, primary_key=True)
    numero = db.Column('CLI_NUMERO', db.Integer, unique=True, nullable=False)
    nombre_1 = db.Column('CLI_NOMBRE1', db.String, nullable=False)
    nombre_2 = db.Column('CLI_NOMBRE2', db.String, nullable=False)
    direccion = db.Column('CLI_DIRECCION', db.String, nullable=False)
    telefono = db.Column('CLI_TELEFONO', db.String, nullable=False)

    def to_json(self):
        return {
            'id': self.id,
            'nombre_1': self.nombre_1,
            'nombre_2': self.nombre_2,
            'direccion': self.direccion,
            'telefono': self.telefono
        }
