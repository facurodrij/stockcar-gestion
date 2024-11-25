import pytz
from flask import jsonify
from datetime import datetime
from server.config import db
from server.core.models import (
    Venta,
    VentaItem,
    Cliente,
    TipoComprobante,
    Articulo,
    Tributo,
)
from server.core.models.tributo import BaseCalculo
from server.core.models.association_table import tributo_venta
from server.core.services import AfipService
from server.core.schemas import VentaFormSchema
from .movimiento_stock_controller import MovimientoStockController

local_tz = pytz.timezone("America/Argentina/Buenos_Aires")
venta_form_schema = VentaFormSchema()


class VentaController:

    @staticmethod
    def create(data) -> int:
        """
        Crea una nueva venta en la base de datos, realiza la facturacion si el comprobante lo requeire
        y registra los movimientos de stock correspondientes.
        """

        new_venta = venta_form_schema.load(data, session=db.session)
        db.session.add(new_venta)
        db.session.flush()  # para obtener el id de la venta creada

        # Calcular tributos
        for tributo in new_venta.tributos:
            base_calculo = tributo.base_calculo
            alicuota = float(tributo.alicuota / 100)
            if base_calculo == BaseCalculo.neto:
                importe = new_venta.gravado * alicuota
            elif base_calculo == BaseCalculo.bruto:
                # TODO revisar si es correcto
                importe = new_venta.total * alicuota
            new_venta.total_tributos += importe
            db.session.execute(
                tributo_venta.insert().values(
                    tributo_id=tributo.id, venta_id=new_venta.id, importe=importe
                )
            )
        new_venta.total += new_venta.total_tributos

        # Facturar venta si corresponde
        if not new_venta.tipo_comprobante.codigo_afip is None:
            afip = AfipService()
            res = afip.obtener_cae(new_venta)
            new_venta.numero = res["numero"]
            new_venta.cae = res["cae"]
            new_venta.vencimiento_cae = datetime.fromisoformat(res["vencimiento_cae"])
            new_venta.estado = "facturado"
        else:
            new_venta.estado = "ticket"

        # Registrar movimiento de stock
        if new_venta.tipo_comprobante.descontar_stock:
            MovimientoStockController.create_movimiento_from_venta(new_venta)

        db.session.commit()
        return new_venta.id

    @staticmethod
    def venta_json_to_model(venta_json: dict) -> dict:
        for key, value in venta_json.items():
            if value == "":
                venta_json[key] = None
        if "fecha_hora" in venta_json and venta_json["fecha_hora"] is not None:
            venta_json["fecha_hora"] = datetime.fromisoformat(
                venta_json["fecha_hora"]
            ).astimezone(local_tz)
        else:
            venta_json["fecha_hora"] = datetime.now(tz=local_tz)
        if (
            "vencimiento_cae" in venta_json
            and venta_json["vencimiento_cae"] is not None
        ):
            venta_json["vencimiento_cae"] = datetime.fromisoformat(
                venta_json["vencimiento_cae"]
            ).astimezone(local_tz)
        venta_json["nombre_cliente"] = Cliente.query.get(
            venta_json["cliente_id"]
        ).razon_social
        venta_json["gravado"] = 0
        venta_json["total_iva"] = 0
        venta_json["total_tributos"] = 0
        venta_json["total"] = 0
        return venta_json

    @staticmethod
    def renglones_json_to_model(renglones: list) -> list:
        renglones_model = []
        for item in renglones:
            renglon = {
                "articulo_id": item["articulo_id"],
                "descripcion": item["descripcion"],
                "cantidad": item["cantidad"],
                "precio_unidad": item["precio_unidad"],
                "alicuota_iva": item["alicuota_iva"],
                "subtotal_iva": item["subtotal_iva"],
                "subtotal_gravado": item["subtotal_gravado"],
                "subtotal": item["subtotal"],
            }
            renglones_model.append(renglon)
        return renglones_model

    @staticmethod
    def create_venta(data):
        try:
            venta_json = VentaController.venta_json_to_model(data["venta"])
            venta = Venta(
                **venta_json,
                created_by=data["created_by"],
                updated_by=data["updated_by"]
            )
            venta.numero = venta.get_last_number() + 1
            db.session.add(venta)
            db.session.flush()  # para obtener el id de la venta creada

            renglones = VentaController.renglones_json_to_model(data["renglones"])
            for item in renglones:
                articulo = Articulo.query.get(item["articulo_id"])
                ventaItem = VentaItem(**item, articulo=articulo, venta_id=venta.id)
                db.session.add(ventaItem)
                venta.total_iva += float(item["subtotal_iva"])
                venta.gravado += float(item["subtotal_gravado"])
                venta.total += float(item["subtotal"])

            tributos = Tributo.query.filter(Tributo.id.in_(data["tributos"])).all()
            for tributo in tributos:
                base_calculo = tributo.base_calculo
                alicuota = float(tributo.alicuota / 100)
                if base_calculo == BaseCalculo.neto:
                    importe = venta.gravado * alicuota
                elif base_calculo == BaseCalculo.bruto:
                    # TODO revisar si es correcto
                    importe = venta.total * alicuota
                venta.total_tributos += importe
                db.session.execute(
                    tributo_venta.insert().values(
                        tributo_id=tributo.id, venta_id=venta.id, importe=importe
                    )
                )

            venta.total += venta.total_tributos
            if not venta.tipo_comprobante.codigo_afip is None:
                afip = AfipService()
                res = afip.obtener_cae(venta)
                venta.numero = res["numero"]
                venta.cae = res["cae"]
                venta.vencimiento_cae = datetime.fromisoformat(res["vencimiento_cae"])
                venta.estado = "facturado"
            else:
                venta.estado = "ticket"

            if venta.tipo_comprobante.descontar_stock:
                MovimientoStockController.create_movimiento_from_venta(venta)

            db.session.commit()
            return jsonify({"venta_id": venta.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.remove()  # Evita errores de `Estado inconsistente de los objetos`
            db.session.configure(bind=db.engine)
            db.session.close()

    @staticmethod
    def update_venta(data, venta: Venta, venta_items: list):
        try:
            venta_json = VentaController.venta_json_to_model(data["venta"])
            for key, value in venta_json.items():
                setattr(venta, key, value)

            current_articulo_ids = list(map(lambda x: x.articulo_id, venta_items))
            renglones = VentaController.renglones_json_to_model(data["renglones"])
            for item in renglones:
                articulo_id = item["articulo_id"]
                if articulo_id in current_articulo_ids:
                    venta_item = VentaItem.query.filter_by(
                        venta_id=venta.id, articulo_id=articulo_id
                    ).first()
                    for key, value in item.items():
                        setattr(venta_item, key, value)
                    current_articulo_ids.remove(articulo_id)
                else:
                    articulo = Articulo.query.get(articulo_id)
                    ventaItem = VentaItem(articulo=articulo, venta_id=venta.id, **item)
                    db.session.add(ventaItem)
                venta.total_iva += float(item["subtotal_iva"])
                venta.gravado += float(item["subtotal_gravado"])
                venta.total += float(item["subtotal"])

            for articulo_id in current_articulo_ids:
                venta_item = VentaItem.query.filter_by(
                    venta_id=venta.id, articulo_id=articulo_id
                ).first()
                db.session.delete(venta_item)

            venta.tributos = []
            new_tributos = Tributo.query.filter(Tributo.id.in_(data["tributos"])).all()
            for tributo in new_tributos:
                base_calculo = tributo.base_calculo
                alicuota = float(tributo.alicuota / 100)
                if base_calculo == BaseCalculo.neto:
                    importe = venta.gravado * alicuota
                elif base_calculo == BaseCalculo.bruto:
                    # TODO revisar si es correcto
                    importe = venta.total * alicuota
                venta.total_tributos += importe
                db.session.execute(
                    tributo_venta.insert().values(
                        tributo_id=tributo.id, venta_id=venta.id, importe=importe
                    )
                )

            venta.total += venta.total_tributos

            if venta.estado.value == "Orden":
                if not venta.tipo_comprobante.codigo_afip is None:
                    afip = AfipService()
                    res = afip.obtener_cae(venta)
                    venta.numero = res["numero"]
                    venta.cae = res["cae"]
                    venta.vencimiento_cae = datetime.fromisoformat(
                        res["vencimiento_cae"]
                    )
                    venta.estado = "facturado"
                else:
                    venta.estado = "ticket"

                if venta.tipo_comprobante.descontar_stock:
                    MovimientoStockController.create_movimiento_from_venta(venta)

            db.session.commit()
            return jsonify({"venta_id": venta.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.remove()  # Evita errores de `Estado inconsistente de los objetos`
            db.session.configure(bind=db.engine)
            db.session.close()

    @staticmethod
    def anular_venta(venta: Venta):
        try:
            if venta.estado.value == "Facturado":
                if venta.tipo_comprobante.letra == "A":
                    tipo_comprobante = TipoComprobante.query.filter_by(
                        letra="A", codigo_afip=3
                    ).first()  # Nota de crédito A
                elif venta.tipo_comprobante.letra == "B":
                    tipo_comprobante = TipoComprobante.query.filter_by(
                        letra="B", codigo_afip=8
                    ).first()  # Nota de crédito B
                nota_credito = Venta(
                    cliente_id=venta.cliente_id,
                    punto_venta_id=venta.punto_venta_id,
                    tipo_comprobante_id=tipo_comprobante.id,
                    fecha_hora=datetime.now().astimezone(local_tz),
                    total=venta.total,
                    total_iva=venta.total_iva,
                    total_tributos=venta.total_tributos,
                    gravado=venta.gravado,
                    nombre_cliente=venta.nombre_cliente,
                    moneda_id=venta.moneda_id,
                    moneda_cotizacion=venta.moneda_cotizacion,
                    venta_asociada_id=venta.id,
                    created_by=venta.updated_by,  # Es creado por el usuario que anula la venta
                    updated_by=venta.updated_by,
                )
                nota_credito.numero = nota_credito.get_last_number() + 1
                db.session.add(nota_credito)
                db.session.flush()
                for item in venta.items:
                    venta_item = VentaItem(
                        venta_id=nota_credito.id,
                        articulo_id=item.articulo_id,
                        descripcion=item.descripcion,
                        cantidad=item.cantidad,
                        precio_unidad=item.precio_unidad,
                        alicuota_iva=item.alicuota_iva,
                        subtotal_iva=item.subtotal_iva,
                        subtotal_gravado=item.subtotal_gravado,
                        subtotal=item.subtotal,
                    )
                    db.session.add(venta_item)
                afip = AfipService()
                res = afip.anular_cae(nota_credito)
                nota_credito.numero = res["numero"]
                nota_credito.cae = res["cae"]
                nota_credito.vencimiento_cae = datetime.fromisoformat(
                    res["vencimiento_cae"]
                )
                nota_credito.estado = "facturado"
                venta.estado = "anulado"
                # Generar movimiento de stock inverso
                MovimientoStockController.create_movimiento_from_devolucion(venta)
                db.session.commit()
                return (
                    jsonify(
                        {
                            "venta_id": nota_credito.id,
                            "message": "Nota de crédito generada correctamente",
                        }
                    ),
                    201,
                )
            elif venta.estado.value == "Ticket":
                venta.estado = "anulado"
                # Generar movimiento de stock inverso
                MovimientoStockController.create_movimiento_from_devolucion(venta)
                db.session.commit()
                return (
                    jsonify(
                        {
                            "venta_id": venta.id,
                            "message": "Venta anulada correctamente",
                        }
                    ),
                    201,
                )
            elif venta.estado.value == "Orden":
                raise Exception("No se puede anular una orden de venta")
            elif venta.estado.value == "Anulado":
                raise Exception("La venta ya fue anulada")
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.remove()
            db.session.configure(bind=db.engine)
            db.session.close()

    @staticmethod
    def create_orden_venta(data):
        try:
            venta_json = VentaController.venta_json_to_model(data["venta"])
            venta = Venta(
                **venta_json,
                tipo_comprobante_id=9,
                punto_venta_id=1,
                estado="orden",
                created_by=data["created_by"],
                updated_by=data["updated_by"]
            )
            venta.numero = venta.get_last_number() + 1
            db.session.add(venta)
            db.session.flush()

            renglones = VentaController.renglones_json_to_model(data["renglones"])
            for item in renglones:
                articulo = Articulo.query.get(item["articulo_id"])
                ventaItem = VentaItem(**item, articulo=articulo, venta_id=venta.id)
                db.session.add(ventaItem)
                venta.total_iva += float(item["subtotal_iva"])
                venta.gravado += float(item["subtotal_gravado"])
                venta.total += float(item["subtotal"])

            db.session.commit()
            return jsonify({"venta_id": venta.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.remove()
            db.session.configure(bind=db.engine)
            db.session.close()

    @staticmethod
    def update_orden_venta(data, venta: Venta, venta_items: list):
        try:
            venta_json = VentaController.venta_json_to_model(data["venta"])
            venta.updated_by = data["updated_by"]
            for key, value in venta_json.items():
                setattr(venta, key, value)

            current_articulo_ids = list(map(lambda x: x.articulo_id, venta_items))
            renglones = VentaController.renglones_json_to_model(data["renglones"])
            for item in renglones:
                articulo_id = item["articulo_id"]
                if articulo_id in current_articulo_ids:
                    venta_item = VentaItem.query.filter_by(
                        venta_id=venta.id, articulo_id=articulo_id
                    ).first()
                    for key, value in item.items():
                        setattr(venta_item, key, value)
                    current_articulo_ids.remove(articulo_id)
                else:
                    articulo = Articulo.query.get(articulo_id)
                    ventaItem = VentaItem(articulo=articulo, venta_id=venta.id, **item)
                    db.session.add(ventaItem)
                venta.total_iva += float(item["subtotal_iva"])
                venta.gravado += float(item["subtotal_gravado"])
                venta.total += float(item["subtotal"])

            for articulo_id in current_articulo_ids:
                venta_item = VentaItem.query.filter_by(
                    venta_id=venta.id, articulo_id=articulo_id
                ).first()
                db.session.delete(venta_item)

            db.session.commit()
            return jsonify({"venta_id": venta.id}), 201
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": str(e)}), 400
        finally:
            db.session.remove()
            db.session.configure(bind=db.engine)
            db.session.close()
