from flask import jsonify
from config import db, app
from server.core.routes import *
# noinspection PyUnresolvedReferences
from server.core.commands import load_fixtures

app.register_blueprint(venta_bp)
app.register_blueprint(cliente_bp)
app.register_blueprint(articulo_bp)
app.register_blueprint(comercio_bp)
app.register_blueprint(usuario_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(movimiento_stock_bp)


@app.route('/')
def index():
    return jsonify({'message': 'Hello, World!'})


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)