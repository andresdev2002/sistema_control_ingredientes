"""Endpoints de formatos_fo_pfto_0057: generar (solo datos), consultar y firmar (líder/calidad)."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user, require_rol
from app.models.usuario import Usuario, RolUsuario
from app.schemas.formato_ingredientes import FormatoCreate, FormatoResponse
from app.services.formato_ingredientes_service import (
    FirmaDuplicadaError,
    FormatoDuplicadoError,
    crear_formato,
    firmar_calidad,
    firmar_lider,
    listar_formatos,
    obtener_formato_por_id,
)

router = APIRouter(prefix="/formatos", tags=["formatos"])


@router.post("", response_model=FormatoResponse, status_code=status.HTTP_201_CREATED)
def crear(
    datos: FormatoCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_rol(RolUsuario.LIDER)),
):
    try:
        return crear_formato(db, datos.orden_produccion_id, usuario_actual.id)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FormatoDuplicadoError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("", response_model=List[FormatoResponse])
def listar(
    orden_produccion_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return listar_formatos(db, orden_produccion_id=orden_produccion_id)


@router.get("/{formato_id}", response_model=FormatoResponse)
def consultar(
    formato_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    formato = obtener_formato_por_id(db, formato_id)
    if formato is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formato no encontrado")
    return formato


@router.post("/{formato_id}/firmar-lider", response_model=FormatoResponse)
def firmar_lider_endpoint(
    formato_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_rol(RolUsuario.LIDER)),
):
    try:
        return firmar_lider(db, formato_id, usuario_actual.id)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except FirmaDuplicadaError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/{formato_id}/firmar-calidad", response_model=FormatoResponse)
def firmar_calidad_endpoint(
    formato_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_rol(RolUsuario.CALIDAD)),
):
    try:
        return firmar_calidad(db, formato_id, usuario_actual.id)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FirmaDuplicadaError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
