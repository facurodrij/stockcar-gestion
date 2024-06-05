from flask import Flask
from flask_cors import CORS
from sqlalchemy import MetaData
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_migrate import Migrate


class Base(DeclarativeBase):
    pass


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:3000"}})
app.config['CORS_HEADERS'] = 'Content-Type'

convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(column_0_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)

app.config[
    "SQLALCHEMY_DATABASE_URI"] = "sqlite:////home/facurodrij/PycharmProjects/stockcar-gestion/server/instance/datos.db"
db = SQLAlchemy(model_class=Base, metadata=metadata)
migrate = Migrate(app, db)
# app.config['SQLALCHEMY_DATABASE_URI'] = ('mssql+pyodbc://sa:Admin-181020@localhost:1433/Datos?driver=ODBC+Driver+18+for'
#                                          '+SQL+Server&TrustServerCertificate=yes')
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# app.config['SQLALCHEMY_ECHO'] = False
# app.config['SQLALCHEMY_TRUSTED_CONNECTION'] = True
# app.config['CORS_HEADERS'] = 'Content-Type'
db.init_app(app)
