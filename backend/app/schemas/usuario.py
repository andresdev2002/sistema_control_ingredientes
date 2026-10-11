"""Schemas de Usuario para la API. No confundir con app/models/usuario.py: el modelo
describe la tabla, estos schemas describen qué entra/sale por los endpoints."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.usuario import RolUsuario


class UsuarioCreate(BaseModel):
    """Lo que se recibe al crear un usuario. password va en texto plano aqui,
    se hashea en el service antes de guardar -- nunca se guarda tal cual."""
    nombre: str
    documento: str
    rol: RolUsuario
    password: str
    lider_id: Optional[int] = None  # obligatorio en la practica si rol=OPERARIO, se valida en el service


class UsuarioLogin(BaseModel):
    """Lo que se recibe en el endpoint de login."""
    documento: str
    password: str


class UsuarioEstadoUpdate(BaseModel):
    """Lo que se recibe en el PATCH para activar/desactivar un usuario."""
    activo: bool


class UsuarioResponse(BaseModel):
    """Lo que se devuelve al cliente. Nunca incluye password_hash."""
    id: int
    nombre: str
    documento: str
    rol: RolUsuario
    lider_id: Optional[int]
    activo: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True  # permite construir esto directo desde un objeto Usuario de SQLAlchemy
