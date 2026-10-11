"""Endpoints de material_maestro: alta, listado, consulta y edición."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user, require_rol
from app.models.usuario import Usuario, RolUsuario
from app.schemas.material_maestro import (
    MaterialMaestroCreate,
    MaterialMaestroResponse,
    MaterialMaestroUpdate,
)
from app.services.material_maestro_service import (
    MaterialDuplicadoError,
    actualizar_material,
    crear_material,
    listar_materiales,
    obtener_material_por_codigo,
)

router = APIRouter(prefix="/material-maestro", tags=["material-maestro"])


@router.post("", response_model=MaterialMaestroResponse, status_code=status.HTTP_201_CREATED)
def crear(
    datos: MaterialMaestroCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_rol(RolUsuario.LIDER)),
):
    try:
        return crear_material(db, datos)
    except MaterialDuplicadoError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("", response_model=List[MaterialMaestroResponse])
def listar(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return listar_materiales(db)


@router.get("/{codigo_sap}", response_model=MaterialMaestroResponse)
def consultar(
    codigo_sap: str,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    material = obtener_material_por_codigo(db, codigo_sap)
    if material is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado")
    return material


@router.patch("/{codigo_sap}", response_model=MaterialMaestroResponse)
def editar(
    codigo_sap: str,
    datos: MaterialMaestroUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_rol(RolUsuario.LIDER)),
):
    try:
        return actualizar_material(db, codigo_sap, datos)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
