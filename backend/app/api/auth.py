"""Endpoint de login: recibe documento/password, devuelve un JWT."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import create_access_token
from app.schemas.usuario import UsuarioLogin
from app.services.usuario_service import autenticar_usuario

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(datos: UsuarioLogin, db: Session = Depends(get_db)):
    usuario = autenticar_usuario(db, datos.documento, datos.password)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Documento o contraseña incorrectos",
        )

    token = create_access_token(data={"sub": usuario.documento, "rol": usuario.rol.value})
    return {"access_token": token, "token_type": "bearer"}
