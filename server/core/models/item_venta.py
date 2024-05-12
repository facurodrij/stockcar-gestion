from server.config import db


class ItemVenta(db.Model):
    __tablename__ = 'item_venta'
    id = db.Column('ID', db.String, primary_key=True)
    fecha = db.Column('FECHA', db.DateTime, nullable=False)
    letra = db.Column('LETRA', db.String, nullable=False)
    sucursal = db.Column('SUCURSAL', db.Integer, nullable=False)
    numero = db.Column('NUMERO', db.Integer, nullable=False)
    codigo = db.Column('CODIGO', db.Integer, nullable=False)
    producto = db.Column('PRODUCTO', db.String, nullable=False)
    cantidad = db.Column('CANTIDAD', db.Integer, nullable=False)

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
