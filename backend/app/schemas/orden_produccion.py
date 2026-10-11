"""Schemas de OrdenProduccion para la API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import EstadoOrden, TurnoTipo


class OrdenProduccionCreate(BaseModel):
    """Lo que se recibe al abrir una orden. usuario_apertura_id nunca viene aquí: sale
    de get_current_user. estado siempre nace en ABIERTA, no se recibe."""
    codigo_orden: str
    codigo_producto_terminado: Optional[str] = None
    turno_apertura: TurnoTipo


class OrdenProduccionUpdate(BaseModel):
    """Lo que se recibe en el PATCH. codigo_orden no es editable (identifica la orden).
    Cerrar la orden es enviar estado=CERRADA; cualquier otra transición es inválida."""
    codigo_producto_terminado: Optional[str] = None
    turno_apertura: Optional[TurnoTipo] = None
    estado: Optional[EstadoOrden] = None


class OrdenProduccionResponse(BaseModel):
    id: int
    codigo_orden: str
    codigo_producto_terminado: Optional[str]
    estado: EstadoOrden
    usuario_apertura_id: int
    turno_apertura: TurnoTipo
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime]

    class Config:
        from_attributes = True
