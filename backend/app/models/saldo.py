"""Modelo de la tabla `saldos`. Cada saldo nace de una recepción o de un reingreso (saldo_padre_id)."""

from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import EstadoSaldo


class Saldo(Base):
    __tablename__ = "saldos"

    id = Column(Integer, primary_key=True, index=True)
    codigo_barras = Column(String(50), nullable=False, unique=True)  # el que se escanea en captura
    codigo_sap = Column(String(30), ForeignKey("material_maestro.codigo_sap"), nullable=False)
    lote_sap = Column(String(30), nullable=False)
    lote_proveedor = Column(String(30), nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    cantidad_disponible = Column(Numeric(10, 2), nullable=False)

    origen_recepcion_id = Column(Integer, ForeignKey("recepciones.id"), nullable=True)
    saldo_padre_id = Column(Integer, ForeignKey("saldos.id"), nullable=True)  # self-referencing: reingreso

    estado = Column(Enum(EstadoSaldo, name="estado_saldo"), nullable=False, default=EstadoSaldo.ACTIVO)
    fecha_creacion = Column(DateTime(timezone=False), server_default=func.now())

    # remote_side=[id]: mismo patrón que en Usuario, resuelve la ambigüedad del self-referencing
    saldos_hijos = relationship("Saldo", backref="saldo_padre", remote_side=[id])
