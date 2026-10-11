"""Schemas de MaterialMaestro para la API."""

from typing import Optional
from pydantic import BaseModel


class MaterialMaestroCreate(BaseModel):
    """Lo que se recibe al crear un material. codigo_sap es la PK, se recibe tal cual."""
    codigo_sap: str
    descripcion: str
    unidad_medida: str = "KG"


class MaterialMaestroUpdate(BaseModel):
    """Lo que se recibe en el PATCH. Todos los campos son opcionales, se actualiza solo lo enviado."""
    descripcion: Optional[str] = None
    unidad_medida: Optional[str] = None


class MaterialMaestroResponse(BaseModel):
    codigo_sap: str
    descripcion: str
    unidad_medida: str

    class Config:
        from_attributes = True
