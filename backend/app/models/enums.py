"""Enums compartidos entre modelos. Cada uno debe coincidir exacto con su CREATE TYPE en schema.sql."""

import enum


class EstadoSaldo(str, enum.Enum):
    ACTIVO = "ACTIVO"
    AGOTADO = "AGOTADO"


class EstadoOrden(str, enum.Enum):
    ABIERTA = "ABIERTA"
    CERRADA = "CERRADA"


class TurnoTipo(str, enum.Enum):
    UNO = "1"
    DOS = "2"
    TRES = "3"
