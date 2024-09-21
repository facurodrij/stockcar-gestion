from flask import Blueprint, jsonify, request, abort
from flask_jwt_extended import jwt_required
from server.config import db
from server.core.models import (
    AlicuotaIVA,
    Tributo,
    Articulo,
    TipoArticulo,
    TipoUnidad,
    MovimientoStock,
    MovimientoStockItem,
)
from server.core.decorators import permission_required

articulo_bp = Blueprint("articulo_bp", __name__)


def get_select_options():
    tipo_articulo = TipoArticulo.query.all()
    tipo_unidad = TipoUnidad.query.all()
    alicuota_iva = AlicuotaIVA.query.all()
    tributo = Tributo.query.all()
    return {
        "tipo_articulo": list(map(lambda x: x.to_json(), tipo_articulo)),
        "tipo_unidad": list(map(lambda x: x.to_json(), tipo_unidad)),
        "alicuota_iva": list(map(lambda x: x.to_json(), alicuota_iva)),
        "tributo": list(map(lambda x: x.to_json(), tributo)),
    }


@articulo_bp.route("/articulos", methods=["GET"])
@jwt_required()
@permission_required(["articulo.view_all"])
def index():
    articulos = Articulo.query.all()
    articulos_json = list(map(lambda x: x.to_json(), articulos))
    return jsonify({"articulos": articulos_json}), 200


@articulo_bp.route("/articulos/create", methods=["GET", "POST"])
@jwt_required()
@permission_required(["articulo.create"])
def create():
    if request.method == "GET":
        return jsonify({"select_options": get_select_options()}), 200
    if request.method == "POST":
        data = request.json
        articulo_json = data["articulo"]
        force = data.get("force", False)
        for key, value in articulo_json.items():
            if value == "":
                articulo_json[key] = None

        # Verificar si ya existen artículos con el mismo código principal
        codigo_principal = articulo_json.get("codigo_principal")
        if codigo_principal and not force:
            articulos_existentes = Articulo.query.filter_by(
                codigo_principal=codigo_principal
            ).all()
            if articulos_existentes:
                ids_existentes = [articulo.id for articulo in articulos_existentes]
                return (
                    jsonify(
                        {
                            "warning": "Ya existen Artículos con el mismo código principal",
                            "ids": ids_existentes,
                        }
                    ),
                    409,
                )

        try:
            articulo = Articulo(**articulo_json)
            db.session.add(articulo)
            for tributo_id in data["tributos"]:
                tributo = Tributo.query.get_or_404(tributo_id)
                articulo.tributos.append(tributo)
            db.session.commit()
            return jsonify({"articulo_id": articulo.id}), 201
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
    try:
        articulo = Articulo.query.get_or_404(pk, "Artículo no encontrado")
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 400
    if request.method == "GET":
        return (
            jsonify(
                {"select_options": get_select_options(), "articulo": articulo.to_json()}
            ),
            200,
        )
    if request.method == "PUT":
        data = request.json
        articulo_json = data["articulo"]
        force = data.get("force", False)
        for key, value in articulo_json.items():
            if value == "":
                articulo_json[key] = None

        # Verificar si ya existen artículos con el mismo código principal
        codigo_principal = articulo_json.get("codigo_principal")
        if (
            codigo_principal
            and codigo_principal != articulo.codigo_principal
            and not force
        ):
            articulos_existentes = Articulo.query.filter_by(
                codigo_principal=codigo_principal
            ).all()
            if articulos_existentes:
                ids_existentes = [articulo.id for articulo in articulos_existentes]
                return (
                    jsonify(
                        {
                            "warning": "Existen Artículos con el mismo código principal",
                            "ids": ids_existentes,
                        }
                    ),
                    409,
                )

        try:
            for key, value in articulo_json.items():
                setattr(articulo, key, value)
            articulo.tributos = []
            nuevos_tributos = Tributo.query.filter(
                Tributo.id.in_(data["tributos"])
            ).all()
            for tributo in nuevos_tributos:
                articulo.tributos.append(tributo)
            db.session.commit()
            return jsonify({"articulo_id": articulo.id}), 201
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
        articulo = Articulo.query.get_or_404(pk, "Artículo no encontrado")
        movimientos = (
            MovimientoStock.query.join(MovimientoStockItem)
            .filter(MovimientoStockItem.articulo_id == pk)
            .order_by(MovimientoStock.fecha_hora.desc())
            .limit(20)
            .all()
        )
        movimientos_json = list(map(lambda x: x.to_json(), movimientos))
        return (
            jsonify({"articulo": articulo.to_json(), "movimientos": movimientos_json}),
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
