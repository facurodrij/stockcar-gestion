from decimal import Decimal
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    ForeignKey,
    DateTime,
    func,
    Enum,
)
from sqlalchemy.orm import relationship
from server.utils.utils import AuditMixin, SoftDeleteMixin, QueryWithSoftDelete
from server.config import db
from server.core.models.parametros import AlicuotaIVA
from server.core.models.enums import EstadoCompra


class Compra(AuditMixin, SoftDeleteMixin, db.Model):
    """
    Modelo de datos para las compras.

    Esta clase representa una compra en la base de datos. Incluye campos para los datos principales de la compra,
    los datos de facturación y los datos de auditoría.
    """

    __tablename__ = "compra"
    query_class = QueryWithSoftDelete

    id = Column(Integer, primary_key=True, autoincrement=True)
    numero = Column(Integer, nullable=False)
    nombre_proveedor = Column(String, nullable=False)
    fecha_hora = Column(DateTime, default=func.now(), nullable=False)
    descuento = Column(Numeric(precision=5, scale=2), default=0, nullable=False)
    recargo = Column(Numeric(precision=5, scale=2), default=0, nullable=False)
    moneda_cotizacion = Column(
        Numeric(precision=10, scale=2), default=1, nullable=False
    )
    gravado = Column(
        Numeric(precision=10, scale=2), default=0, nullable=False
    )  # Total - IVA
    total_iva = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    total = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    observacion = Column(String, nullable=True)
    estado = Column(Enum(EstadoCompra), default=EstadoCompra.orden, nullable=False)

    # Relaciones con otras tablas
    tipo_comprobante_id = Column(
        Integer, ForeignKey("tipo_comprobante.id"), nullable=False
    )
    tipo_comprobante = relationship("TipoComprobante", backref="compras")
    punto_venta_id = Column(Integer, ForeignKey("punto_venta.id"), nullable=False)
    punto_venta = relationship("PuntoVenta", backref="compras")
    proveedor_id = Column(Integer, ForeignKey("proveedor.id"), nullable=False)
    proveedor = relationship("Proveedor", backref="compras")
    moneda_id = Column(Integer, ForeignKey("moneda.id"), default=1, nullable=False)
    moneda = relationship("Moneda", backref="compras")
    tipo_pago_id = Column(
        Integer, ForeignKey("tipo_pago.id"), default=1, nullable=False
    )
    tipo_pago = relationship("TipoPago", backref="compras")

    def nro_comprobante(self):
        """
        Devuelve el número de documento en formato 0000-00000000.
        """
        return f"{self.punto_venta.numero:04d}-{self.numero:08d}"

    def get_last_number(self) -> int:
        """
        Devuelve el último número de compra, según el comprobante y punto de venta.
        """
        last_number = (
            db.session.query(func.max(Compra.numero))
            .filter(
                Compra.tipo_comprobante_id == self.tipo_comprobante_id,
                Compra.punto_venta_id == self.punto_venta_id,
            )
            .scalar()
        )
        if last_number:
            return int(last_number)
        else:
            return 0

    def get_iva_alicuota(self, return_total=False) -> list:
        """
        Obtiene la lista de alícuotas de IVA según los items de la compra.
        """
        iva_alicuotas = []
        for item in self.items:
            alicuota = AlicuotaIVA.query.filter_by(porcentaje=item.alicuota_iva).first()
            iva_alicuotas.append(
                {
                    "Id": alicuota.codigo_afip,
                    "BaseImp": item.subtotal_gravado,
                    "Importe": item.subtotal_iva,
                }
            )

        iva_dict = {}
        for iva in iva_alicuotas:
            if iva["Id"] not in iva_dict:
                iva_dict[iva["Id"]] = {
                    "BaseImp": Decimal(iva["BaseImp"]),
                    "Importe": Decimal(iva["Importe"]),
                }
            else:
                iva_dict[iva["Id"]]["BaseImp"] += Decimal(iva["BaseImp"])
                iva_dict[iva["Id"]]["Importe"] += Decimal(iva["Importe"])

        # Convertir el diccionario de vuelta a una lista
        iva_alicuotas = [
            {"Id": k, "BaseImp": v["BaseImp"], "Importe": v["Importe"]}
            for k, v in iva_dict.items()
        ]
        if return_total:
            total_iva = sum([Decimal(iva["Importe"]) for iva in iva_alicuotas])
            return float(total_iva)

        return iva_alicuotas

    def to_json_min(self):
        """
        Devuelve un diccionario con los datos mínimos de la compra.
        """
        return {
            "id": self.id,
            "fecha_hora": self.fecha_hora.isoformat(),
            "tipo_comprobante": self.tipo_comprobante.to_dict(),
            "nro_comprobante": self.nro_comprobante(),
            "nombre_proveedor": self.nombre_proveedor,
            "total": self.total,
            "estado": self.estado.value,
        }

    def to_json(self):
        """
        Convierte los datos de la compra a formato JSON.
        """
        cod_articulos = []
        for item in self.items:
            (
                cod_articulos.append(item.articulo.codigo_principal)
                if item.articulo
                else ""
            )

        return {
            "id": self.id,
            "proveedor": self.proveedor.to_dict(),
            "tipo_comprobante": self.tipo_comprobante.to_dict(),
            "moneda": self.moneda.to_dict(),
            "moneda_cotizacion": self.moneda_cotizacion,
            "tipo_pago": self.tipo_pago.to_dict(),
            "punto_venta": self.punto_venta.to_dict(),
            "numero": self.numero,
            "nro_comprobante": self.nro_comprobante(),
            "nombre_proveedor": self.nombre_proveedor,
            "fecha_hora": self.fecha_hora.isoformat(),
            "descuento": self.descuento,
            "recargo": self.recargo,
            "gravado": self.gravado,
            "total_iva": self.total_iva,
            "total": self.total,
            "observacion": self.observacion,
            "estado": self.estado.value,
            "cod_articulos": cod_articulos,
            **self.get_audit_fields(),
        }
