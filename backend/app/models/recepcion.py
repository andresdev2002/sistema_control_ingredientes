"""Modelo de la tabla `recepciones`. Registro del ingreso de un bulto completo al almacén."""

from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class Recepcion(Base):
    __tablename__ = "recepciones"

    id = Column(Integer, primary_key=True)
    codigo_sap = Column(String(30), ForeignKey("material_maestro.codigo_sap"), nullable=False)
    lote_sap = Column(String(30), nullable=False)
    lote_proveedor = Column(String(30), nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    cantidad_recibida = Column(Numeric(10, 2), nullable=False)
    codigo_barras = Column(String(50), nullable=False, unique=True)  # generado por el sistema al recibir
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_recepcion = Column(DateTime(timezone=False), nullable=False, server_default=func.now())
