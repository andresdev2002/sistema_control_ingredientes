"""Modelo de la tabla `material_maestro`. Datos SAP del producto, no cambian por lote."""

from sqlalchemy import Column, String

from app.database import Base


class MaterialMaestro(Base):
    __tablename__ = "material_maestro"

    codigo_sap = Column(String(30), primary_key=True)  # PK es el propio código SAP, no un id autoincremental
    descripcion = Column(String(200), nullable=False)
    unidad_medida = Column(String(10), nullable=False, default="KG")
