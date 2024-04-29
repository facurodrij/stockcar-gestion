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
            'nombre_cliente': self.nombre_cliente
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
