"""Lógica de negocio sobre saldos: listado con filtros y consulta puntual."""

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.enums import EstadoSaldo
from app.models.saldo import Saldo


def listar_saldos(db: Session, estado: Optional[EstadoSaldo] = None, codigo_sap: Optional[str] = None) -> List[Saldo]:
    query = db.query(Saldo)
    if estado is not None:
        query = query.filter(Saldo.estado == estado)
    if codigo_sap is not None:
        query = query.filter(Saldo.codigo_sap == codigo_sap)
    return query.order_by(Saldo.id).all()


def obtener_saldo_por_codigo_barras(db: Session, codigo_barras: str) -> Optional[Saldo]:
    return db.query(Saldo).filter(Saldo.codigo_barras == codigo_barras).first()
