"""Lógica de negocio sobre registros_consumo: registrar un pesaje (descuenta el saldo
en una sola transacción, con la orden y el saldo bloqueados en ese orden) y listado
filtrable por orden.

El reingreso de sobrante (saldo_padre_id / saldo_nuevo_id) es un flujo separado,
fuera de alcance aquí: este módulo solo decrementa el saldo existente."""

from decimal import ROUND_HALF_UP, Decimal
from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enums import EstadoOrden, EstadoSaldo
from app.models.orden_produccion import OrdenProduccion
from app.models.registro_consumo import RegistroConsumo
from app.models.saldo import Saldo
from app.schemas.registro_consumo import ConsumoCreate

PASO_REDONDEO = Decimal("0.02")


class ConflictoConsumoError(Exception):
    """Conflicto al registrar el consumo (condición de carrera inesperada)."""


def _redondear_peso(peso_capturado: Decimal) -> Decimal:
    pasos = (peso_capturado / PASO_REDONDEO).to_integral_value(rounding=ROUND_HALF_UP)
    return pasos * PASO_REDONDEO


def crear_consumo(db: Session, datos: ConsumoCreate, usuario_id: int) -> RegistroConsumo:
    """Lanza LookupError si orden o saldo no existen, ValueError si viola una regla de negocio
    (orden cerrada, saldo no activo, cantidad fuera de rango)."""
    orden = (
        db.query(OrdenProduccion)
        .filter(OrdenProduccion.id == datos.orden_produccion_id)
        .with_for_update()
        .first()
    )
    if orden is None:
        raise LookupError("Orden no encontrada")
    if orden.estado != EstadoOrden.ABIERTA:
        raise ValueError("La orden no está abierta")

    saldo = db.query(Saldo).filter(Saldo.codigo_barras == datos.codigo_barras).with_for_update().first()
    if saldo is None:
        raise LookupError("Saldo no encontrado")
    if saldo.estado != EstadoSaldo.ACTIVO:
        raise ValueError("El saldo no está activo")

    peso_redondeado = _redondear_peso(datos.peso_capturado)
    if peso_redondeado <= 0:
        raise ValueError("La cantidad redondeada debe ser mayor que cero")
    if peso_redondeado > saldo.cantidad_disponible:
        raise ValueError("La cantidad consumida supera el saldo disponible")

    cantidad_disponible_antes = saldo.cantidad_disponible
    cantidad_sobrante = cantidad_disponible_antes - peso_redondeado

    saldo.cantidad_disponible = cantidad_sobrante
    if cantidad_sobrante == 0:
        saldo.estado = EstadoSaldo.AGOTADO

    registro = RegistroConsumo(
        orden_produccion_id=orden.id,
        saldo_id=saldo.id,
        codigo_sap=saldo.codigo_sap,
        lote_sap=saldo.lote_sap,
        lote_proveedor=saldo.lote_proveedor,
        fecha_vencimiento=saldo.fecha_vencimiento,
        cantidad_disponible_antes=cantidad_disponible_antes,
        peso_capturado=datos.peso_capturado,
        peso_redondeado=peso_redondeado,
        cantidad_sobrante=cantidad_sobrante,
        saldo_nuevo_id=None,
        usuario_id=usuario_id,
        turno=datos.turno,
    )
    db.add(registro)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictoConsumoError("No se pudo registrar el consumo por un conflicto inesperado")
    db.refresh(registro)
    return registro


def listar_consumos(db: Session, orden_produccion_id: Optional[int] = None) -> List[RegistroConsumo]:
    query = db.query(RegistroConsumo)
    if orden_produccion_id is not None:
        query = query.filter(RegistroConsumo.orden_produccion_id == orden_produccion_id)
    return query.order_by(RegistroConsumo.id).all()
