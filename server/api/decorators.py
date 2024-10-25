from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from server.models import Usuario


def permission_required(permissions: list):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current_user: dict = get_jwt_identity()
            user = Usuario.query.filter_by(username=current_user["username"]).first()
            if user.is_superuser:
                return fn(*args, **kwargs)
            for permission in permissions:
                if permission in [perm.nombre for perm in user.permisos]:
                    return fn(*args, **kwargs)
            return jsonify({"error": "Sin permisos para acceder a este recurso"}), 403

        return wrapper

    return decorator
