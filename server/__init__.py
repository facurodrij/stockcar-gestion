import os
from flask import Flask

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

STATIC_DIR = os.path.join(BASE_DIR, "static")

def create_app(testing=False):
    app = Flask(__name__)

    if testing:
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    else:
        database_path = os.path.join(BASE_DIR, "instance", "datos.db")
        if not os.path.exists(os.path.join(BASE_DIR, "instance")):
            os.makedirs(os.path.join(BASE_DIR, "instance"))
        app.config["CORS_HEADERS"] = "Content-Type"
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + database_path

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ECHO"] = False
    app.config["JWT_SECRET_KEY"] = "my-secret-key"
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

    return app
