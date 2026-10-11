"""Schemas de Saldo para la API. Solo lectura por ahora: no hay POST directo, los saldos nacen
de una recepción o de un reingreso (fuera de alcance en este módulo)."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models.enums import EstadoSaldo


class SaldoResponse(BaseModel):
    id: int
    codigo_barras: str
    codigo_sap: str
    lote_sap: str
    lote_proveedor: str
    fecha_vencimiento: date
    cantidad_disponible: Decimal
    origen_recepcion_id: Optional[int]
    saldo_padre_id: Optional[int]
    estado: EstadoSaldo
    fecha_creacion: datetime

    class Config:
        from_attributes = True
