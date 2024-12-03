from functools import wraps
from flask import jsonify
from server.config import db


def error_handler(session_rollback=False):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                return f(*args, **kwargs)
            except Exception as e:
                print(e)
                if session_rollback:
                    db.session.rollback()
                return jsonify({"error": str(e)}), 400
            finally:
                db.session.close()

        return decorated_function

    return decorator
