"""Lógica de negocio sobre material_maestro: creación, consulta y edición."""

from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.material_maestro import MaterialMaestro
from app.schemas.material_maestro import MaterialMaestroCreate, MaterialMaestroUpdate


class MaterialDuplicadoError(Exception):
    """Ya existe un material con ese código SAP."""


def crear_material(db: Session, datos: MaterialMaestroCreate) -> MaterialMaestro:
    if obtener_material_por_codigo(db, datos.codigo_sap) is not None:
        raise MaterialDuplicadoError("Ya existe un material con ese código SAP")

    material = MaterialMaestro(
        codigo_sap=datos.codigo_sap,
        descripcion=datos.descripcion,
        unidad_medida=datos.unidad_medida,
    )
    db.add(material)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise MaterialDuplicadoError("Ya existe un material con ese código SAP")
    db.refresh(material)
    return material


def listar_materiales(db: Session) -> List[MaterialMaestro]:
    return db.query(MaterialMaestro).order_by(MaterialMaestro.codigo_sap).all()


def obtener_material_por_codigo(db: Session, codigo_sap: str) -> Optional[MaterialMaestro]:
    return db.query(MaterialMaestro).filter(MaterialMaestro.codigo_sap == codigo_sap).first()


def actualizar_material(db: Session, codigo_sap: str, datos: MaterialMaestroUpdate) -> MaterialMaestro:
    """Lanza LookupError si el material no existe."""
    material = obtener_material_por_codigo(db, codigo_sap)
    if material is None:
        raise LookupError("Material no encontrado")

    if datos.descripcion is not None:
        material.descripcion = datos.descripcion
    if datos.unidad_medida is not None:
        material.unidad_medida = datos.unidad_medida

    db.commit()
    db.refresh(material)
    return material
