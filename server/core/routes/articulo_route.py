from flask import Blueprint, jsonify, request, abort
from flask_jwt_extended import jwt_required, current_user
from marshmallow import ValidationError

from server.config import db
from server.core.models import (
    AlicuotaIVA,
    Articulo,
    TipoArticulo,
    TipoUnidad,
    MovimientoStock,
    MovimientoStockItem,
)
from server.auth.decorators import permission_required
from server.core.controllers import ArticuloController
from server.utils.utils import get_select_options
from server.core.schemas.articulo_schema import articulo_schema

articulo_bp = Blueprint("articulo_bp", __name__)


@articulo_bp.route("/articulos", methods=["GET"])
@jwt_required()
@permission_required(["articulo.view_all"])
def index():
    articulos = Articulo.query.all()
    articulos_dict = list(map(lambda x: x.to_datagrid_dict(), articulos))

    return jsonify({"articulos": articulos_dict}), 200


@articulo_bp.route("/articulos/create", methods=["GET", "POST"])
@jwt_required()
@permission_required(["articulo.create"])
def create():
    if request.method == "GET":
        return jsonify(get_select_options([TipoArticulo, TipoUnidad, AlicuotaIVA])), 200
    if request.method == "POST":
        data = request.json
        try:
            data["created_by"] = current_user.id
            data["updated_by"] = current_user.id
            articulo_id: int = ArticuloController.create(data)
            return jsonify("articulo_id", articulo_id), 201
        except ValidationError as err:
            return jsonify(err.messages), 409
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


@articulo_bp.route("/articulos/<int:pk>/update", methods=["GET", "PUT"])
@jwt_required()
@permission_required(["articulo.update"])
def update(pk):
    articulo: Articulo = Articulo.query.get_or_404(pk, "Artículo no encontrado")
    if request.method == "GET":
        return (
            jsonify(
                {
                    **get_select_options([TipoArticulo, TipoUnidad, AlicuotaIVA]),
                    "articulo": articulo_schema.dump(articulo),
                }
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        try:
            data["created_by"] = articulo.created_by
            data["updated_by"] = current_user.id
            articulo_id: int = ArticuloController.update(data, articulo)
            return jsonify("articulo_id", articulo_id), 200
        except ValidationError as err:
            return jsonify(err.messages), 409
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.close()


@articulo_bp.route("/articulos/<int:pk>", methods=["GET"])
@jwt_required()
@permission_required(["articulo.view"])
def detail(pk):
    try:
        articulo: Articulo = Articulo.query.get_or_404(pk, "Artículo no encontrado")
        movimientos = (
            MovimientoStock.query.join(MovimientoStockItem)
            .filter(MovimientoStockItem.articulo_id == pk)
            .order_by(MovimientoStock.fecha_hora.desc())
            .limit(20)
            .all()
        )
        movimientos_json = list(map(lambda x: x.to_json(), movimientos))
        return (
            jsonify({"articulo": articulo.to_dict(), "movimientos": movimientos_json}),
            200,
        )
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400


@articulo_bp.route("/articulos/<int:pk>/delete", methods=["DELETE"])
@jwt_required()
@permission_required(["articulo.delete"])
def delete(pk):
    try:
        articulo: Articulo = Articulo.query.get_or_404(pk, "Artículo no encontrado")
        if articulo.is_deleted():
            abort(404, "Artículo no encontrado")
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400
    try:
        articulo.delete()
        db.session.commit()
        return jsonify({"message": "Artículo eliminado correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({"error": str(e)}), 400
    finally:
        db.session.close()
