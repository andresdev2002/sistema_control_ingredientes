"""Endpoints de usuarios: alta, listado, perfil propio y activar/desactivar."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user, require_rol
from app.models.usuario import Usuario, RolUsuario
from app.schemas.usuario import UsuarioCreate, UsuarioEstadoUpdate, UsuarioResponse
from app.services.usuario_service import (
    DocumentoDuplicadoError,
    cambiar_estado_usuario,
    crear_usuario,
    listar_usuarios,
)

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear(
    datos: UsuarioCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_rol(RolUsuario.LIDER)),
):
    try:
        return crear_usuario(db, datos)
    except DocumentoDuplicadoError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=List[UsuarioResponse])
def listar(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_rol(RolUsuario.LIDER)),
):
    return listar_usuarios(db)


@router.get("/me", response_model=UsuarioResponse)
def yo(usuario_actual: Usuario = Depends(get_current_user)):
    return usuario_actual


@router.patch("/{usuario_id}", response_model=UsuarioResponse)
def cambiar_estado(
    usuario_id: int,
    datos: UsuarioEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_rol(RolUsuario.LIDER)),
):
    try:
        return cambiar_estado_usuario(db, usuario_id, datos.activo, usuario_actual)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
