from flask import jsonify
from .config import db, app
from server.core.routes.venta import venta_bp
from server.core.routes.cliente import cliente_bp
# noinspection PyUnresolvedReferences
from server.core.commands import load_fixtures

app.register_blueprint(venta_bp)
app.register_blueprint(cliente_bp)


@app.route('/')
def index():
    return jsonify({'message': 'Hello, World!'})


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
