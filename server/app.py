from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, select
from datetime import datetime
from config import db, app
from routes.venta_routes import venta_bp

app.register_blueprint(venta_bp)


@app.route('/')
def index():
    return 'Hello World!'


@app.route('/tables', methods=['GET'])
def get_tables():
    db.metadata.reflect(bind=db.engine)
    metadata = db.metadata
    for table in metadata.tables:
        print(table)
    return 'Check your terminal'


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
