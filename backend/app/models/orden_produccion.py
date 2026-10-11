"""Modelo de la tabla `ordenes_produccion`. Agrupa varios registros_consumo bajo una misma preparación."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import EstadoOrden, TurnoTipo


class OrdenProduccion(Base):
    __tablename__ = "ordenes_produccion"

    id = Column(Integer, primary_key=True)
    codigo_orden = Column(String(30), nullable=False, unique=True)  # identificador de la preparación (SAP u otro)
    codigo_producto_terminado = Column(String(30), nullable=True)
    estado = Column(Enum(EstadoOrden, name="estado_orden"), nullable=False, default=EstadoOrden.ABIERTA)
    usuario_apertura_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    turno_apertura = Column(
        Enum(TurnoTipo, name="turno_tipo", values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=False,
    )
    fecha_apertura = Column(DateTime(timezone=False), nullable=False, server_default=func.now())
    fecha_cierre = Column(DateTime(timezone=False), nullable=True)  # se llena al generar el formato
