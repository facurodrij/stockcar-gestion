from server.config import db


class Venta(db.Model):
    __tablename__ = 'venta'
    id = db.Column('ID', db.String, primary_key=True)
    tipo_factura = db.Column('TIPO_FAC', db.String, nullable=False)  # TIPO_DOC
    letra = db.Column('LETRA', db.String, nullable=False)
    sucursal = db.Column('SUCURSAL', db.Integer, nullable=False)
    numero = db.Column('NUMERO', db.Integer, nullable=False)
    fecha = db.Column('FECHA', db.DateTime, nullable=False)
    nombre_cliente = db.Column('CLINOMBRE', db.String, nullable=False)
    gravado = db.Column('GRAVADO', db.Float, nullable=False)
    total = db.Column('TOTAL', db.Float, nullable=False)
    asociado = db.Column('ASOCIADO', db.Integer, nullable=False)
    vendedor = db.Column('VENDEDOR', db.Integer, nullable=False)
    operador = db.Column('OPERADOR', db.Integer, nullable=False)
    movimiento = db.Column('MOVIMIENTO', db.Integer, nullable=False)

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
        }
