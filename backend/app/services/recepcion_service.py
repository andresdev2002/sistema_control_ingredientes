"""Lógica de negocio sobre recepciones: alta (con su saldo inicial, en una sola transacción) y listado."""

import uuid
from typing import List

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enums import EstadoSaldo
from app.models.material_maestro import MaterialMaestro
from app.models.recepcion import Recepcion
from app.models.saldo import Saldo
from app.schemas.recepcion import RecepcionCreate


class CodigoBarrasDuplicadoError(Exception):
    """Ya existe una recepción o saldo con ese código de barras."""


def _generar_codigo_barras() -> str:
    return uuid.uuid4().hex


def _codigo_barras_en_uso(db: Session, codigo_barras: str) -> bool:
    en_recepciones = db.query(Recepcion).filter(Recepcion.codigo_barras == codigo_barras).first() is not None
    en_saldos = db.query(Saldo).filter(Saldo.codigo_barras == codigo_barras).first() is not None
    return en_recepciones or en_saldos


def crear_recepcion(db: Session, datos: RecepcionCreate, usuario_id: int) -> Recepcion:
    material = db.query(MaterialMaestro).filter(MaterialMaestro.codigo_sap == datos.codigo_sap).first()
    if material is None:
        raise LookupError("El código SAP especificado no existe")

    codigo_barras = datos.codigo_barras or _generar_codigo_barras()
    if _codigo_barras_en_uso(db, codigo_barras):
        raise CodigoBarrasDuplicadoError("Ya existe una recepción o saldo con ese código de barras")

    recepcion = Recepcion(
        codigo_sap=datos.codigo_sap,
        lote_sap=datos.lote_sap,
        lote_proveedor=datos.lote_proveedor,
        fecha_vencimiento=datos.fecha_vencimiento,
        cantidad_recibida=datos.cantidad_recibida,
        codigo_barras=codigo_barras,
        usuario_id=usuario_id,
    )
    db.add(recepcion)

    try:
        db.flush()  # asigna recepcion.id sin cerrar la transacción

        saldo = Saldo(
            codigo_barras=codigo_barras,
            codigo_sap=datos.codigo_sap,
            lote_sap=datos.lote_sap,
            lote_proveedor=datos.lote_proveedor,
            fecha_vencimiento=datos.fecha_vencimiento,
            cantidad_disponible=datos.cantidad_recibida,
            origen_recepcion_id=recepcion.id,
            saldo_padre_id=None,
            estado=EstadoSaldo.ACTIVO,
        )
        db.add(saldo)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise CodigoBarrasDuplicadoError("Ya existe una recepción o saldo con ese código de barras")

    db.refresh(recepcion)
    return recepcion


def listar_recepciones(db: Session) -> List[Recepcion]:
    return db.query(Recepcion).order_by(Recepcion.id).all()
