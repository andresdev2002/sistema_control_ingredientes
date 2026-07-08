"""Modelo de la tabla `registros_consumo`. Cada fila es un pesaje. Los campos codigo_sap/lote_sap/
lote_proveedor/fecha_vencimiento son una FOTO del momento (no FK), para no depender de que el
saldo o el maestro sigan igual después -- esto es lo que se audita y se firma."""

from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Enum, Index
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import TurnoTipo


class RegistroConsumo(Base):
    __tablename__ = "registros_consumo"
    __table_args__ = (
        Index("idx_registros_orden", "orden_produccion_id"),
        Index("idx_registros_usuario", "usuario_id"),
        Index("idx_registros_fecha", "fecha_hora"),
        Index("idx_registros_turno", "turno"),
    )

    id = Column(Integer, primary_key=True)
    orden_produccion_id = Column(Integer, ForeignKey("ordenes_produccion.id"), nullable=False)
    saldo_id = Column(Integer, ForeignKey("saldos.id"), nullable=False)  # saldo que se consumió (salida completa)

    # snapshot al momento del registro, no se recalcula si el maestro cambia después
    codigo_sap = Column(String(30), nullable=False)
    lote_sap = Column(String(30), nullable=False)
    lote_proveedor = Column(String(30), nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)

    cantidad_disponible_antes = Column(Numeric(10, 2), nullable=False)
    peso_capturado = Column(Numeric(10, 2), nullable=False)   # lectura cruda (o valor tecleado en el simulador)
    peso_redondeado = Column(Numeric(10, 2), nullable=False)  # tras aplicar round(peso/0.02)*0.02
    cantidad_sobrante = Column(Numeric(10, 2), nullable=False)  # cantidad_disponible_antes - peso_redondeado

    saldo_nuevo_id = Column(Integer, ForeignKey("saldos.id"), nullable=True)  # reingreso, si sobró algo

    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    turno = Column(Enum(TurnoTipo, name="turno_tipo"), nullable=False)
    fecha_hora = Column(DateTime(timezone=False), nullable=False, server_default=func.now())
