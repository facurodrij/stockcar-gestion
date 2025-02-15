import enum


class EstadoVenta(enum.Enum):
    """
    Enumeración para los estados de una venta.
    """

    orden = "Orden"
    presupuesto = "Presupuesto"
    ticket = "Ticket"
    facturado = "Facturado"
    anulado = "Anulado"
    ticket_mecanico = "Ticket Mecánico"