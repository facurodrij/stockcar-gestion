import pytest
from server import create_app
from server.config import db


@pytest.fixture(scope="module")
def test_app():
    app = create_app(testing=True)

    db.init_app(app)

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture(scope="function", autouse=True)
def session(test_app):
    with test_app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        options = dict(bind=connection, binds={})
        session = db._make_scoped_session(options=options)

        db.session = session

        yield session

        transaction.rollback()
        connection.close()
        session.remove()


@pytest.fixture(scope="module")
def client(test_app):
    return test_app.test_client()
