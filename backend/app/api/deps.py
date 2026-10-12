"""Dependencias de FastAPI para proteger endpoints: usuario autenticado y control de rol."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token
from app.models.usuario import Usuario, RolUsuario

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la credencial",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise credentials_exception

    documento = payload.get("sub")
    if documento is None:
        raise credentials_exception

    usuario = db.query(Usuario).filter(Usuario.documento == documento).first()
    if usuario is None or not usuario.activo:
        raise credentials_exception

    return usuario


def require_rol(*roles: RolUsuario):
    """Uso: Depends(require_rol(RolUsuario.LIDER)) o, para varios roles permitidos,
    Depends(require_rol(RolUsuario.OPERARIO, RolUsuario.LIDER))"""
    if not roles:
        raise ValueError("require_rol necesita al menos un rol")

    def checker(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.rol not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para esta acción")
        return usuario

    return checker
