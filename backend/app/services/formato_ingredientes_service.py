"""Lógica de negocio sobre formatos_fo_pfto_0057: generación (solo datos, sin PDF),
consulta y firmas (líder y calidad).

Firma de calidad: por decisión de negocio, hoy también la marca un LIDER (no existe
rol CALIDAD ni un campo en el modelo para registrar quién firmó esa parte) — queda
anotado como pendiente de diseño en CLAUDE.md, no se inventan campos nuevos aquí."""

from datetime import datetime
from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enums import EstadoOrden
from app.models.formato_ingredientes import FormatoIngredientes
from app.models.orden_produccion import OrdenProduccion
from app.models.registro_consumo import RegistroConsumo


class FormatoDuplicadoError(Exception):
    """Ya existe un formato para esa orden."""


class FirmaDuplicadaError(Exception):
    """Esa firma ya fue aplicada a este formato."""


def obtener_formato_por_id(db: Session, formato_id: int) -> Optional[FormatoIngredientes]:
    return db.query(FormatoIngredientes).filter(FormatoIngredientes.id == formato_id).first()


def obtener_formato_por_orden(db: Session, orden_produccion_id: int) -> Optional[FormatoIngredientes]:
    return (
        db.query(FormatoIngredientes)
        .filter(FormatoIngredientes.orden_produccion_id == orden_produccion_id)
        .first()
    )


def listar_formatos(db: Session, orden_produccion_id: Optional[int] = None) -> List[FormatoIngredientes]:
    query = db.query(FormatoIngredientes)
    if orden_produccion_id is not None:
        query = query.filter(FormatoIngredientes.orden_produccion_id == orden_produccion_id)
    return query.order_by(FormatoIngredientes.id).all()


def crear_formato(db: Session, orden_produccion_id: int, generado_por: int) -> FormatoIngredientes:
    """Lanza LookupError si la orden no existe, ValueError si la orden está abierta o sin
    consumos, FormatoDuplicadoError si ya existe un formato para esa orden."""
    orden = db.query(OrdenProduccion).filter(OrdenProduccion.id == orden_produccion_id).first()
    if orden is None:
        raise LookupError("Orden no encontrada")

    if orden.estado != EstadoOrden.CERRADA:
        raise ValueError("La orden debe estar cerrada para generar el formato")

    tiene_consumos = (
        db.query(RegistroConsumo).filter(RegistroConsumo.orden_produccion_id == orden.id).first() is not None
    )
    if not tiene_consumos:
        raise ValueError("La orden no tiene consumos registrados")

    if obtener_formato_por_orden(db, orden.id) is not None:
        raise FormatoDuplicadoError("Ya existe un formato para esa orden")

    formato = FormatoIngredientes(
        orden_produccion_id=orden.id,
        generado_por=generado_por,
    )
    db.add(formato)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise FormatoDuplicadoError("Ya existe un formato para esa orden")
    db.refresh(formato)
    return formato


def firmar_lider(db: Session, formato_id: int, lider_id: int) -> FormatoIngredientes:
    """Lanza LookupError si no existe, FirmaDuplicadaError si ya fue firmado por el líder."""
    formato = obtener_formato_por_id(db, formato_id)
    if formato is None:
        raise LookupError("Formato no encontrado")
    if formato.firmado_lider:
        raise FirmaDuplicadaError("El formato ya fue firmado por el líder")

    formato.lider_id = lider_id
    formato.firmado_lider = True
    formato.fecha_firma_lider = datetime.now()
    db.commit()
    db.refresh(formato)
    return formato


def firmar_calidad(db: Session, formato_id: int) -> FormatoIngredientes:
    """Lanza LookupError si no existe, ValueError si falta la firma de líder previa,
    FirmaDuplicadaError si ya fue firmado por calidad."""
    formato = obtener_formato_por_id(db, formato_id)
    if formato is None:
        raise LookupError("Formato no encontrado")
    if not formato.firmado_lider:
        raise ValueError("Debe firmar primero el líder")
    if formato.firmado_calidad:
        raise FirmaDuplicadaError("El formato ya fue firmado por calidad")

    formato.firmado_calidad = True
    formato.fecha_firma_calidad = datetime.now()
    db.commit()
    db.refresh(formato)
    return formato
