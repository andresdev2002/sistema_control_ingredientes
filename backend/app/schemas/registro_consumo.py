"""Schemas de RegistroConsumo para la API."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import TurnoTipo


class ConsumoCreate(BaseModel):
    """Lo que se recibe al registrar un consumo. usuario_id nunca viene aquí: sale
    de get_current_user. El saldo se identifica por codigo_barras (lo que se escanea).
    turno es obligatorio, no se deduce de ninguna otra fuente."""
    orden_produccion_id: int
    codigo_barras: str
    peso_capturado: Decimal = Field(gt=0)
    turno: TurnoTipo


class ConsumoResponse(BaseModel):
    id: int
    orden_produccion_id: int
    saldo_id: int
    codigo_sap: str
    lote_sap: str
    lote_proveedor: str
    fecha_vencimiento: date
    cantidad_disponible_antes: Decimal
    peso_capturado: Decimal
    peso_redondeado: Decimal
    cantidad_sobrante: Decimal
    saldo_nuevo_id: Optional[int]
    usuario_id: int
    turno: TurnoTipo
    fecha_hora: datetime

    class Config:
        from_attributes = True
