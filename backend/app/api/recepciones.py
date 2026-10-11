"""Endpoints de recepciones: alta (con saldo inicial, en una transacción) y listado."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user, require_rol
from app.models.usuario import Usuario, RolUsuario
from app.schemas.recepcion import RecepcionCreate, RecepcionResponse
from app.services.recepcion_service import (
    CodigoBarrasDuplicadoError,
    crear_recepcion,
    listar_recepciones,
)

router = APIRouter(prefix="/recepciones", tags=["recepciones"])


@router.post("", response_model=RecepcionResponse, status_code=status.HTTP_201_CREATED)
def crear(
    datos: RecepcionCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_rol(RolUsuario.LIDER)),
):
    try:
        return crear_recepcion(db, datos, usuario_actual.id)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except CodigoBarrasDuplicadoError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("", response_model=List[RecepcionResponse])
def listar(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return listar_recepciones(db)
