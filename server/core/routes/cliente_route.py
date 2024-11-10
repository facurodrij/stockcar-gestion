from datetime import date, datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, current_user

from server.config import db
from server.core.models import (
    Cliente,
    TipoDocumento,
    TipoResponsable,
    Provincia,
    Genero,
    TipoPago,
    Moneda,
    Tributo,
)
from server.auth.decorators import permission_required
from server.core.services import AfipService
from server.utils.utils import get_select_options, get_datagrid_options
from server.core.schemas import cliente_schema

cliente_bp = Blueprint("cliente_bp", __name__)


@cliente_bp.route("/clientes", methods=["GET"])
@jwt_required()
@permission_required(["cliente.view_all"])
def index():
    """
    Devuelve la lista de clientes.
    """
    clientes = Cliente.query.all()
    clientes_dict = cliente_schema.dump(clientes, many=True)
    return jsonify({"clientes": clientes_dict}), 200


@cliente_bp.route("/clientes/create", methods=["GET", "POST"])
@jwt_required()
@permission_required(["cliente.create"])
def create():
    """
    Crea un nuevo cliente.

    Methods:
    GET: Obtiene las opciones de los select.
    POST: Crea un nuevo cliente.
    """
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options(
                        [
                            TipoDocumento,
                            TipoResponsable,
                            Genero,
                            Provincia,
                            TipoPago,
                            Moneda,
                        ]
                    ),
                    **get_datagrid_options([Tributo]),
                }
            ),
            200,
        )
    if request.method == "POST":
        data = request.json
        print(data)
        try:
            data["created_by"] = current_user.id
            data["updated_by"] = current_user.id
            new_cliente = cliente_schema.load(data, session=db.session)
            db.session.add(new_cliente)
            db.session.commit()
            return jsonify({"cliente_id": new_cliente.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


@cliente_bp.route("/clientes/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@permission_required(["cliente.update"])
def update(pk):
    """
    Actualiza los datos de un cliente.

    Methods:
    GET: Obtiene los datos del cliente y las opciones de los select.
    PUT: Actualiza los datos del cliente.
    """
    cliente: Cliente = Cliente.query.get_or_404(pk, "Cliente no encontrado")
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options(
                        [
                            TipoDocumento,
                            TipoResponsable,
                            Genero,
                            Provincia,
                            TipoPago,
                            Moneda,
                        ]
                    ),
                    **get_datagrid_options([Tributo]),
                    "cliente": cliente_schema.dump(cliente),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        try:
            data["created_by"] = cliente.created_by
            data["updated_by"] = current_user.id
            updated_cliente = cliente_schema.load(
                data, instance=cliente, session=db.session
            )
            db.session.commit()
            return jsonify({"cliente_id": updated_cliente.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


@cliente_bp.route("/clientes/<int:pk>", methods=["GET"])
@jwt_required()
@permission_required(["cliente.view"])
def detail(pk):
    cliente: Cliente = Cliente.query.get_or_404(pk, "Cliente no encontrado")
    return jsonify({"cliente": cliente_schema.dump(cliente)}), 200


@cliente_bp.route("/clientes/afip", methods=["GET"])
@jwt_required()
def get_afip_data():
    """
    Obtiene los datos de un proveedor desde la API de AFIP.
    """
    try:
        nro_documento: int = int(request.args.get("nro_documento"))
        afip = AfipService()
        res = afip.get_persona(nro_documento)

        return (
            jsonify(
                {
                    "tipo_responsable_id": res["tipo_responsable_id"],
                    "razon_social": res["razon_social"],
                    "direccion": res["direccion"],
                    "localidad": res["localidad"],
                    "provincia_id": res["provincia_id"],
                    "codigo_postal": res["codigo_postal"],
                }
            ),
            200,
        )
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400
