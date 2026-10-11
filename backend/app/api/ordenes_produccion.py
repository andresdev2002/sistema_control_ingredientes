"""Endpoints de ordenes_produccion: alta, listado, consulta y edición (incluye cierre)."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user, require_rol
from app.models.usuario import Usuario, RolUsuario
from app.schemas.orden_produccion import (
    OrdenProduccionCreate,
    OrdenProduccionResponse,
    OrdenProduccionUpdate,
)
from app.services.orden_produccion_service import (
    OrdenDuplicadaError,
    actualizar_orden,
    crear_orden,
    listar_ordenes,
    obtener_orden_por_id,
)

router = APIRouter(prefix="/ordenes-produccion", tags=["ordenes-produccion"])


@router.post("", response_model=OrdenProduccionResponse, status_code=status.HTTP_201_CREATED)
def crear(
    datos: OrdenProduccionCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_rol(RolUsuario.LIDER)),
):
    try:
        return crear_orden(db, datos, usuario_actual.id)
    except OrdenDuplicadaError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("", response_model=List[OrdenProduccionResponse])
def listar(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return listar_ordenes(db)


@router.get("/{orden_id}", response_model=OrdenProduccionResponse)
def consultar(
    orden_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    orden = obtener_orden_por_id(db, orden_id)
    if orden is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    return orden


@router.patch("/{orden_id}", response_model=OrdenProduccionResponse)
def editar(
    orden_id: int,
    datos: OrdenProduccionUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_rol(RolUsuario.LIDER)),
):
    try:
        return actualizar_orden(db, orden_id, datos)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
