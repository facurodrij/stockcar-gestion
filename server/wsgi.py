import sys
import os
import logging

# Asegúrate de que el directorio raíz del proyecto esté en el PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import jsonify
from waitress import serve
from server.config import app
from server.core.routes import *
# noinspection PyUnresolvedReferences
from server.core.commands import load_fixtures

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('waitress')
logger.setLevel(logging.INFO)

app.register_blueprint(venta_bp)
app.register_blueprint(cliente_bp)
app.register_blueprint(articulo_bp)
app.register_blueprint(comercio_bp)
app.register_blueprint(usuario_bp)
app.register_blueprint(auth_bp)

@app.route('/')
def index():
    return jsonify({'message': 'Hello, World!'})

mode = "prod"

if __name__ == '__main__':
    if mode == "dev":
        app.run(host='0.0.0.0', port=50100, debug=True)
    else:
        serve(app, host='0.0.0.0', port=50100, threads=1)