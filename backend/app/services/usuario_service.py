"""Lógica de negocio sobre usuarios: creación (hashea password) y autenticación."""

from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.usuario import Usuario, RolUsuario
from app.schemas.usuario import UsuarioCreate


class DocumentoDuplicadoError(Exception):
    """Ya existe un usuario con ese documento."""


def crear_usuario(db: Session, datos: UsuarioCreate) -> Usuario:
    if datos.rol == RolUsuario.OPERARIO and datos.lider_id is None:
        raise ValueError("Un OPERARIO debe tener lider_id")

    if datos.lider_id is not None and obtener_usuario_por_id(db, datos.lider_id) is None:
        raise ValueError("El lider_id especificado no existe")

    if db.query(Usuario).filter(Usuario.documento == datos.documento).first() is not None:
        raise DocumentoDuplicadoError("Ya existe un usuario con ese documento")

    usuario = Usuario(
        nombre=datos.nombre,
        documento=datos.documento,
        rol=datos.rol,
        lider_id=datos.lider_id,
        password_hash=hash_password(datos.password),
    )
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DocumentoDuplicadoError("Ya existe un usuario con ese documento")
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


def listar_usuarios(db: Session) -> List[Usuario]:
    return db.query(Usuario).order_by(Usuario.id).all()


def obtener_usuario_por_id(db: Session, usuario_id: int) -> Optional[Usuario]:
    return db.query(Usuario).filter(Usuario.id == usuario_id).first()


def cambiar_estado_usuario(db: Session, usuario_id: int, activo: bool, usuario_actual: Usuario) -> Usuario:
    """Activa/desactiva un usuario. Lanza LookupError si no existe, ValueError si viola una regla de negocio."""
    if usuario_id == usuario_actual.id and not activo:
        raise ValueError("Un usuario no puede desactivarse a sí mismo")

    usuario = obtener_usuario_por_id(db, usuario_id)
    if usuario is None:
        raise LookupError("Usuario no encontrado")

    usuario.activo = activo
    db.commit()
    db.refresh(usuario)
    return usuario
