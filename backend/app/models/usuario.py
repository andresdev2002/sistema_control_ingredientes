"""Modelo de la tabla `usuarios`. lider_id es self-referencing: NULL si es LIDER."""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class RolUsuario(str, enum.Enum):
    """Debe coincidir exacto con el ENUM rol_usuario de schema.sql."""
    LIDER = "LIDER"
    OPERARIO = "OPERARIO"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    documento = Column(String(30), nullable=False, unique=True)
    rol = Column(Enum(RolUsuario, name="rol_usuario"), nullable=False)

    lider_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)  # NULL si es LIDER

    password_hash = Column(String(255), nullable=False)  # nunca texto plano
    activo = Column(Boolean, nullable=False, default=True)  # baja lógica, no se borra (conserva historial)
    fecha_creacion = Column(DateTime(timezone=False), server_default=func.now())

    # remote_side=[id]: resuelve la ambigüedad de la FK apuntando a la misma tabla
    operarios_a_cargo = relationship("Usuario", backref="lider", remote_side=[id])
