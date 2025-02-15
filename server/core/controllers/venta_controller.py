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
    def create(data, session, orden: bool = False) -> int:
        """
        Crea una nueva venta en la base de datos, realiza la facturacion si el comprobante lo requeire
        y registra los movimientos de stock correspondientes.
        """
        venta = venta_form_schema.load(data, session=session)
        session.add(venta)
        session.flush()  # para obtener el id de la venta creada

        # Calcular tributos
        venta.total_tributos = 0
        for tributo in venta.tributos:
            base_calculo = tributo.base_calculo
            alicuota = tributo.alicuota / 100
            if base_calculo == BaseCalculo.neto:
                importe = venta.gravado * alicuota
            elif base_calculo == BaseCalculo.bruto:
                # TODO revisar si es correcto
                importe = venta.total * alicuota
            venta.total_tributos += importe
            session.execute(
                tributo_venta.update()
                .where(tributo_venta.c.venta_id == venta.id)
                .values(importe=importe)
            )
        venta.total += venta.total_tributos

        # Facturar venta si corresponde
        if not orden:
            if not venta.tipo_comprobante.codigo_afip is None:
                afip = AfipService()
                res = afip.obtener_cae(venta)
                venta.numero = res["numero"]
                venta.cae = res["cae"]
                venta.vencimiento_cae = datetime.fromisoformat(res["vencimiento_cae"])
            if venta.tipo_comprobante.estado_venta is None:
                # Si el tipo de comprobante no tiene un estado de venta asociado, se asume que es un ticket
                venta.estado = "ticket"
            else:
                venta.estado = venta.tipo_comprobante.estado_venta

            # Registrar movimiento de stock
            if venta.tipo_comprobante.descontar_stock:
                MovimientoStockController.create_movimiento_from_venta(venta)

        session.commit()
        return venta.id

    @staticmethod
    def update(data, session, instance: Venta, orden: bool = False) -> int:
        """
        Actualiza una venta en la base de datos.
        """
        articulo_ids = {i["articulo_id"] for i in data["items"]}

        # Eliminar los items de venta que no están en la lista de articulo_ids y actualizar los ids de los items que se van a actualizar.
        for item in instance.items:
            if item.articulo_id not in articulo_ids:
                session.delete(item)
            else:
                for i in data["items"]:
                    if i["articulo_id"] == item.articulo_id:
                        i["id"] = item.id
                        break
        session.commit()

        venta_form_schema.load(data, instance=instance, session=session)
        session.flush()

        # Calcular tributos
        instance.total_tributos = 0
        for tributo in instance.tributos:
            base_calculo = tributo.base_calculo
            alicuota = tributo.alicuota / 100
            if base_calculo == BaseCalculo.neto:
                importe = instance.gravado * alicuota
            elif base_calculo == BaseCalculo.bruto:
                # TODO revisar si es correcto
                importe = instance.total * alicuota
            instance.total_tributos += importe
            session.execute(
                tributo_venta.update()
                .where(tributo_venta.c.venta_id == instance.id)
                .values(importe=importe)
            )
        instance.total += instance.total_tributos

        # Facturar venta si corresponde
        if not orden:
            if instance.estado.value == "Orden":
                if not instance.tipo_comprobante.codigo_afip is None:
                    afip = AfipService()
                    res = afip.obtener_cae(instance)
                    instance.numero = res["numero"]
                    instance.cae = res["cae"]
                    instance.vencimiento_cae = datetime.fromisoformat(
                        res["vencimiento_cae"]
                    )
                if instance.tipo_comprobante.estado_venta is None:
                    # Si el tipo de comprobante no tiene un estado de venta asociado, se asume que es un ticket
                    instance.estado = "ticket"
                else:
                    instance.estado = instance.tipo_comprobante.estado_venta

                # Registrar movimiento de stock
                if instance.tipo_comprobante.descontar_stock:
                    MovimientoStockController.create_movimiento_from_venta(instance)

        session.commit()
        return instance.id

    @staticmethod
    def anular(instance: Venta) -> tuple:
        match instance.estado.value:
            case "Facturado":
                if instance.tipo_comprobante.letra == "A":
                    tipo_comprobante = TipoComprobante.query.filter_by(
                        letra="A", codigo_afip=3
                    ).first()  # Nota de crédito A
                elif instance.tipo_comprobante.letra == "B":
                    tipo_comprobante = TipoComprobante.query.filter_by(
                        letra="B", codigo_afip=8
                    ).first()  # Nota de crédito B
                nota_credito = Venta(
                    cliente_id=instance.cliente_id,
                    punto_venta_id=instance.punto_venta_id,
                    tipo_comprobante_id=tipo_comprobante.id,
                    fecha_hora=datetime.now().astimezone(local_tz),
                    total=instance.total,
                    total_iva=instance.total_iva,
                    total_tributos=instance.total_tributos,
                    gravado=instance.gravado,
                    nombre_cliente=instance.nombre_cliente,
                    moneda_id=instance.moneda_id,
                    moneda_cotizacion=instance.moneda_cotizacion,
                    venta_asociada_id=instance.id,
                    created_by=instance.updated_by,  # Es creado por el usuario que anula la venta
                    updated_by=instance.updated_by,
                )
                nota_credito.numero = nota_credito.get_last_number() + 1
                db.session.add(nota_credito)
                db.session.flush()
                for item in instance.items:
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
                instance.estado = "anulado"
                # Generar movimiento de stock inverso
                MovimientoStockController.create_movimiento_from_devolucion(instance)
                db.session.commit()
                return nota_credito.id, "Nota de crédito generada correctamente"
            case "Ticket":
                instance.estado = "anulado"
                # Generar movimiento de stock inverso
                MovimientoStockController.create_movimiento_from_devolucion(instance)
                db.session.commit()
                return instance.id, "Venta anulada correctamente"
            case "Orden":
                raise Exception("No se puede anular una orden de venta")
            case "Anulado":
                raise Exception("La venta ya fue anulada")
