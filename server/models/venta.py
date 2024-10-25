import enum
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
from server.models.association_table import tributo_venta
from server.models.parametros import AlicuotaIVA


class EstadoVenta(enum.Enum):
    """
    Enumeración para los estados de una venta.
    """

    orden = "Orden"
    # Cuando se emite un ticket o comprobante que no requiere facturación electrónica
    ticket = "Ticket"
    facturado = "Facturado"
    anulado = "Anulado"


class Venta(AuditMixin, SoftDeleteMixin, db.Model):
    """
    Modelo de datos para las ventas.

    Esta clase representa una venta en la base de datos. Incluye campos para los datos principales de la venta,
    los datos de facturación y los datos de auditoría.
    """

    __tablename__ = "venta"
    query_class = QueryWithSoftDelete

    id = Column(Integer, primary_key=True, autoincrement=True)
    numero = Column(Integer, nullable=False)
    nombre_cliente = Column(String, nullable=False)
    fecha_hora = Column(DateTime, default=func.now(), nullable=False)
    descuento = Column(Numeric(precision=5, scale=2), default=0, nullable=False)
    recargo = Column(Numeric(precision=5, scale=2), default=0, nullable=False)
    moneda_cotizacion = Column(
        Numeric(precision=10, scale=2), default=1, nullable=False
    )
    gravado = Column(
        Numeric(precision=10, scale=2), default=0, nullable=False
    )  # Total - IVA - Percepción
    total_iva = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    total_tributos = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    total = Column(Numeric(precision=10, scale=2), default=0, nullable=False)
    cae = Column(String, nullable=True)  # Código de Autorización Electrónico
    vencimiento_cae = Column(DateTime, nullable=True)
    observacion = Column(String, nullable=True)
    estado = Column(Enum(EstadoVenta), default=EstadoVenta.orden, nullable=False)
    # TODO investigar como almacenar los tipos de pagos, teniendo en cuenta que una venta puede pagarse con varios tipos de pagos

    # Relaciones con otras tablas
    tipo_comprobante_id = Column(
        Integer, ForeignKey("tipo_comprobante.id"), nullable=False
    )
    tipo_comprobante = relationship("TipoComprobante", backref="ventas")
    punto_venta_id = Column(Integer, ForeignKey("punto_venta.id"), nullable=False)
    punto_venta = relationship("PuntoVenta", backref="ventas")
    cliente_id = Column(Integer, ForeignKey("cliente.id"), nullable=False)
    cliente = relationship("Cliente", backref="ventas")
    moneda_id = Column(Integer, ForeignKey("moneda.id"), default=1, nullable=False)
    moneda = relationship("Moneda", backref="ventas")
    tipo_pago_id = Column(
        Integer, ForeignKey("tipo_pago.id"), default=1, nullable=False
    )
    tipo_pago = relationship("TipoPago", backref="ventas")
    venta_asociada_id = Column(Integer, ForeignKey("venta.id"), nullable=True)
    venta_asociada = relationship("Venta", remote_side=[id], backref="ventas_asociadas")

    tributos = relationship(
        "Tributo", secondary="tributo_venta", back_populates="ventas"
    )

    def nro_comprobante(self):
        """
        Devuelve el número de documento en formato 0000-00000000.
        """
        return f"{self.punto_venta.numero:04d}-{self.numero:08d}"

    def get_last_number(self):
        """
        Devuelve el último número de venta, según el comprobante y punto de venta.
        """
        last_number = (
            db.session.query(func.max(Venta.numero))
            .filter(
                Venta.tipo_comprobante_id == self.tipo_comprobante_id,
                Venta.punto_venta_id == self.punto_venta_id,
            )
            .scalar()
        )
        if last_number:
            return last_number
        else:
            return 0

    def get_tributo_importe(self, tributo_id: int) -> float:
        """
        Devuelve el importe de la tabla asociativa tributo_venta
        """
        importe = (
            db.session.query(tributo_venta.c.importe)
            .filter(
                tributo_venta.c.tributo_id == tributo_id,
                tributo_venta.c.venta_id == self.id,
            )
            .scalar()
        )
        return float(importe)

    def get_iva_alicuota(self, return_total=False) -> list:
        """
        Obtiene la lista de alícuotas de IVA según los items de la venta.
        <ar:Iva>
            <ar:AlicIva>
                <ar:Id>5</ar:Id> -> 21%
                <ar:BaseImp>100</ar:BaseImp>
                <ar:Importe>21</ar:Importe>
            </ar:AlicIva>
            <ar:AlicIva>
                <ar:Id>4</ar:Id> -> 10.5%
                <ar:BaseImp>50</ar:BaseImp>
                <ar:Importe>5.25</ar:Importe>
            </ar:AlicIva>
        </ar:Iva>
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

    def get_cbte_asoc_cuit(self):
        """
        Devuelve el CUIT del cliente de la venta asociada.
        """
        if self.venta_asociada and self.venta_asociada.cliente:
            if self.venta_asociada.cliente.tipo_documento.codigo_afip == 80:
                return self.venta_asociada.cliente.nro_documento
        return None

    def to_json_min(self):
        """
        Devuelve un diccionario con los datos mínimos de la venta.
        """
        return {
            "id": self.id,
            "fecha_hora": self.fecha_hora.isoformat(),
            "tipo_comprobante": self.tipo_comprobante.to_json(),
            "nro_comprobante": self.nro_comprobante(),
            "nombre_cliente": self.nombre_cliente,
            "total": self.total,
            "estado": self.estado.value,
        }

    def to_json(self):
        """
        Convierte los datos de la venta a formato JSON.
        """
        tributos = []
        for tributo in self.tributos:
            tributos.append(tributo.to_json())

        cod_articulos = []
        for item in self.items:
            (
                cod_articulos.append(item.articulo.codigo_principal)
                if item.articulo
                else ""
            )

        return {
            "id": self.id,
            "cliente": self.cliente.to_json_min(),
            "tipo_comprobante": self.tipo_comprobante.to_json(),
            "moneda": self.moneda.to_json(),
            "moneda_cotizacion": self.moneda_cotizacion,
            "tipo_pago": self.tipo_pago.to_json(),
            "punto_venta": self.punto_venta.to_json(),
            "numero": self.numero,
            "nro_comprobante": self.nro_comprobante(),
            "nombre_cliente": self.nombre_cliente,
            "fecha_hora": self.fecha_hora.isoformat(),
            "descuento": self.descuento,
            "recargo": self.recargo,
            "gravado": self.gravado,
            "total_iva": self.total_iva,
            "total_tributos": self.total_tributos,
            "total": self.total,
            "cae": self.cae,
            "vencimiento_cae": (
                self.vencimiento_cae.isoformat() if self.vencimiento_cae else None
            ),
            "observacion": self.observacion,
            "estado": self.estado.value,
            "tributos": tributos,
            "cod_articulos": cod_articulos,
            **self.get_audit_fields(),
        }
