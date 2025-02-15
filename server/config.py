import os
from flask_cors import CORS
from sqlalchemy import MetaData
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from server import create_app

app = create_app()

convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(column_0_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)


db = SQLAlchemy(model_class=Base)
db.init_app(app)


# CORS Configuration (Local & Codespaces)
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://127.0.0.1:3000",
                "http://localhost:3000",
                "http://192.168.0.114:3000",
                "http://192.168.0.19:3000",
                "https://shiny-space-journey-4rppp59wj6j3jj9p-3000.app.github.dev",
                "https://xs2wpms2-3000.brs.devtunnels.ms",
            ]
        }
    },
)

migrate = Migrate(app, db)
jwt = JWTManager(app)
