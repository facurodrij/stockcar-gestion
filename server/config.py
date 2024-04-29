from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_cors import CORS


class Base(DeclarativeBase):
    pass


app = Flask(__name__)
CORS(app)
db = SQLAlchemy(model_class=Base)

app.config['SQLALCHEMY_DATABASE_URI'] = ('mssql+pyodbc://sa:Admin-181020@localhost:1433/Datos?driver=ODBC+Driver+18+for'
                                         '+SQL+Server&TrustServerCertificate=yes')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False
app.config['SQLALCHEMY_TRUSTED_CONNECTION'] = True
app.config['CORS_HEADERS'] = 'Content-Type'
db.init_app(app)
