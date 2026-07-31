"""Lógica de negocio sobre usuarios: creación (hashea password) y autenticación."""

from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.usuario import Usuario, RolUsuario
from app.schemas.usuario import UsuarioCreate


def crear_usuario(db: Session, datos: UsuarioCreate) -> Usuario:
    if datos.rol == RolUsuario.OPERARIO and datos.lider_id is None:
        raise ValueError("Un OPERARIO debe tener lider_id")

    usuario = Usuario(
        nombre=datos.nombre,
        documento=datos.documento,
        rol=datos.rol,
        lider_id=datos.lider_id,
        password_hash=hash_password(datos.password),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def autenticar_usuario(db: Session, documento: str, password: str) -> Optional[Usuario]:
    """Devuelve el Usuario si documento/password son correctos y está activo, None en caso contrario."""
    usuario = db.query(Usuario).filter(Usuario.documento == documento).first()
    if usuario is None or not usuario.activo:
        return None
    if not verify_password(password, usuario.password_hash):
        return None
    return usuario
