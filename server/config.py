import os
from flask import Flask
from flask_cors import CORS
from sqlalchemy import MetaData
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager


class Base(DeclarativeBase):
    pass


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

STATIC_DIR = os.path.join(BASE_DIR, "static")

app = Flask(__name__)

# CORS Configuration (Local & Codespaces)
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://127.0.0.1:3000",
                "https://shiny-space-journey-4rppp59wj6j3jj9p-3000.app.github.dev",
                "https://xs2wpms2-3000.brs.devtunnels.ms",
            ]
        }
    },
)

convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(column_0_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=convention)

# Config for Development

database_path = os.path.join(BASE_DIR, "instance", "datos.db")
if not os.path.exists(os.path.join(BASE_DIR, "instance")):
    os.makedirs(os.path.join(BASE_DIR, "instance"))

app.config["CORS_HEADERS"] = "Content-Type"
# Linux
#app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:////" + database_path
# Windows
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + database_path
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = False
app.config["JWT_SECRET_KEY"] = "my-secret-key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

db = SQLAlchemy(model_class=Base, metadata=metadata)
migrate = Migrate(app, db)
jwt = JWTManager(app)


# Config for Production
# app.config['SQLALCHEMY_DATABASE_URI'] = ('mssql+pyodbc://sa:Admin-181020@localhost:1433/Datos?driver=ODBC+Driver+18+for'
#                                          '+SQL+Server&TrustServerCertificate=yes')
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# app.config['SQLALCHEMY_ECHO'] = False
# app.config['SQLALCHEMY_TRUSTED_CONNECTION'] = True
db.init_app(app)
