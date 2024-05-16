from sqlalchemy import Column, func, DateTime, Boolean


class DatosAuditoria:
    fecha_alta = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, onupdate=func.utc_timestamp())
    baja = Column(Boolean, default=False)
    fecha_baja = Column(DateTime, nullable=True)
