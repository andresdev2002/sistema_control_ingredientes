"""Lógica de negocio sobre ordenes_produccion: alta, consulta, listado y edición
(incluye cierre, que es una transición de estado validada)."""

from datetime import datetime
from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enums import EstadoOrden
from app.models.orden_produccion import OrdenProduccion
from app.schemas.orden_produccion import OrdenProduccionCreate, OrdenProduccionUpdate


class OrdenDuplicadaError(Exception):
    """Ya existe una orden con ese codigo_orden."""


def crear_orden(db: Session, datos: OrdenProduccionCreate, usuario_apertura_id: int) -> OrdenProduccion:
    if obtener_orden_por_codigo(db, datos.codigo_orden) is not None:
        raise OrdenDuplicadaError("Ya existe una orden con ese código de orden")

    orden = OrdenProduccion(
        codigo_orden=datos.codigo_orden,
        codigo_producto_terminado=datos.codigo_producto_terminado,
        turno_apertura=datos.turno_apertura,
        usuario_apertura_id=usuario_apertura_id,
        estado=EstadoOrden.ABIERTA,
    )
    db.add(orden)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise OrdenDuplicadaError("Ya existe una orden con ese código de orden")
    db.refresh(orden)
    return orden


def listar_ordenes(db: Session) -> List[OrdenProduccion]:
    return db.query(OrdenProduccion).order_by(OrdenProduccion.id).all()


def obtener_orden_por_id(db: Session, orden_id: int) -> Optional[OrdenProduccion]:
    return db.query(OrdenProduccion).filter(OrdenProduccion.id == orden_id).first()


def obtener_orden_por_codigo(db: Session, codigo_orden: str) -> Optional[OrdenProduccion]:
    return db.query(OrdenProduccion).filter(OrdenProduccion.codigo_orden == codigo_orden).first()


def actualizar_orden(db: Session, orden_id: int, datos: OrdenProduccionUpdate) -> OrdenProduccion:
    """Lanza LookupError si no existe, ValueError si la orden está cerrada o la transición de estado es inválida."""
    orden = obtener_orden_por_id(db, orden_id)
    if orden is None:
        raise LookupError("Orden no encontrada")

    if orden.estado == EstadoOrden.CERRADA:
        raise ValueError("Una orden cerrada no se puede editar ni reabrir")

    if datos.estado is not None and datos.estado != orden.estado:
        if orden.estado == EstadoOrden.ABIERTA and datos.estado == EstadoOrden.CERRADA:
            orden.estado = EstadoOrden.CERRADA
            orden.fecha_cierre = datetime.now()
        else:
            raise ValueError(f"Transición de estado inválida: {orden.estado.value} -> {datos.estado.value}")

    if datos.codigo_producto_terminado is not None:
        orden.codigo_producto_terminado = datos.codigo_producto_terminado
    if datos.turno_apertura is not None:
        orden.turno_apertura = datos.turno_apertura

    db.commit()
    db.refresh(orden)
    return orden
