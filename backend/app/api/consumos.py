"""Endpoints de consumos: registrar un pesaje (descuenta el saldo) y listado filtrable por orden."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.usuario import Usuario
from app.schemas.registro_consumo import ConsumoCreate, ConsumoResponse
from app.services.registro_consumo_service import (
    ConflictoConsumoError,
    crear_consumo,
    listar_consumos,
)

router = APIRouter(prefix="/consumos", tags=["consumos"])


@router.post("", response_model=ConsumoResponse, status_code=status.HTTP_201_CREATED)
def crear(
    datos: ConsumoCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    try:
        return crear_consumo(db, datos, usuario_actual.id)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ConflictoConsumoError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("", response_model=List[ConsumoResponse])
def listar(
    orden_produccion_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return listar_consumos(db, orden_produccion_id=orden_produccion_id)
