"""Endpoints de saldos: listado con filtros y consulta puntual. Solo lectura por ahora."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.enums import EstadoSaldo
from app.models.usuario import Usuario
from app.schemas.saldo import SaldoResponse
from app.services.saldo_service import listar_saldos, obtener_saldo_por_codigo_barras

router = APIRouter(prefix="/saldos", tags=["saldos"])


@router.get("", response_model=List[SaldoResponse])
def listar(
    estado: Optional[EstadoSaldo] = None,
    codigo_sap: Optional[str] = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return listar_saldos(db, estado=estado, codigo_sap=codigo_sap)


@router.get("/{codigo_barras}", response_model=SaldoResponse)
def consultar(
    codigo_barras: str,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    saldo = obtener_saldo_por_codigo_barras(db, codigo_barras)
    if saldo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saldo no encontrado")
    return saldo
