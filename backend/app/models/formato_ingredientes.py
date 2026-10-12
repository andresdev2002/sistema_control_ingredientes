"""Modelo de la tabla `formatos_fo_pfto_0057`. Un formato por orden de producción (relación 1 a 1)."""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class FormatoIngredientes(Base):
    __tablename__ = "formatos_fo_pfto_0057"

    id = Column(Integer, primary_key=True)
    orden_produccion_id = Column(Integer, ForeignKey("ordenes_produccion.id"), nullable=False, unique=True)
    generado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_generacion = Column(DateTime(timezone=False), nullable=False, server_default=func.now())

    firmado_lider = Column(Boolean, nullable=False, default=False)
    lider_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_firma_lider = Column(DateTime(timezone=False), nullable=True)

    firmado_calidad = Column(Boolean, nullable=False, default=False)
    calidad_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_firma_calidad = Column(DateTime(timezone=False), nullable=True)

    pdf_path = Column(String(255), nullable=True)
