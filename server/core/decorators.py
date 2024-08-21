from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from server.core.models import Usuario, Rol
from server.config import jwt

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        user = Usuario.query.filter_by(email=current_user.get('email')).first()
        if user.is_superuser or user.is_staff:
            return fn(*args, **kwargs)
        # Si el usuario tiene el rol con nombre 'admin' puede acceder
        if 'admin' in [rol.nombre for rol in user.roles]:
            return fn(*args, **kwargs)
        return jsonify({'error': 'Sin permisos para acceder a este recurso'}), 403
    return wrapper


def role_required(roles: list):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current_user: dict = get_jwt_identity()
            user = Usuario.query.filter_by(email=current_user.get('email')).first()
            # Si el usuario es superusuario o staff, no se verifica el rol
            if user.is_superuser or user.is_staff:
                return fn(*args, **kwargs)
            for role in roles:
                if role in [rol.nombre for rol in user.roles]:
                    return fn(*args, **kwargs)
            return jsonify({'error': 'Sin permisos para acceder a este recurso'}), 403
        return wrapper
    return decorator

