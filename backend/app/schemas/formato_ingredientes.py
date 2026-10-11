"""Schemas de FormatoIngredientes para la API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, computed_field


class FormatoCreate(BaseModel):
    """Lo que se recibe al generar un formato. generado_por nunca viene aquí: sale de get_current_user."""
    orden_produccion_id: int


class FormatoResponse(BaseModel):
    id: int
    orden_produccion_id: int
    generado_por: int
    fecha_generacion: datetime
    firmado_lider: bool
    lider_id: Optional[int]
    fecha_firma_lider: Optional[datetime]
    firmado_calidad: bool
    fecha_firma_calidad: Optional[datetime]
    pdf_path: Optional[str]

    class Config:
        from_attributes = True

    @computed_field
    @property
    def estado(self) -> str:
        """Derivado de los dos booleanos, no existe como columna en el modelo."""
        if self.firmado_calidad:
            return "COMPLETO"
        if self.firmado_lider:
            return "FIRMADO_LIDER"
        return "PENDIENTE"
