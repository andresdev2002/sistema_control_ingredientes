"""Schemas de Recepcion para la API."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class RecepcionCreate(BaseModel):
    """Lo que se recibe al crear una recepción. usuario_id nunca viene aquí: sale de get_current_user.
    codigo_barras es opcional: si no viene, se genera en el service."""
    codigo_sap: str
    lote_sap: str
    lote_proveedor: str
    fecha_vencimiento: date
    cantidad_recibida: Decimal = Field(gt=0)
    codigo_barras: Optional[str] = None


class RecepcionResponse(BaseModel):
    id: int
    codigo_sap: str
    lote_sap: str
    lote_proveedor: str
    fecha_vencimiento: date
    cantidad_recibida: Decimal
    codigo_barras: str
    usuario_id: int
    fecha_recepcion: datetime

    class Config:
        from_attributes = True
