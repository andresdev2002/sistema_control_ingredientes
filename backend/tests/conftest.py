"""Fixtures compartidas: aislamiento transaccional (savepoints) y clientes autenticados.

Cada test corre dentro de una transacción externa que se revierte al final, así que
ningún dato de prueba sobrevive en la base real. Todo dato creado se prefija con TEST-.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.database import engine, get_db
from app.main import app
from app.models.material_maestro import MaterialMaestro
from app.models.usuario import RolUsuario, Usuario


@pytest.fixture()
def db_session():
    connection = engine.connect()
    outer_transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    yield session

    session.close()
    outer_transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def lider(db_session):
    usuario = Usuario(
        nombre="TEST-Lider",
        documento="TEST-LIDER-001",
        rol=RolUsuario.LIDER,
        password_hash=hash_password("clave-test"),
        lider_id=None,
    )
    db_session.add(usuario)
    db_session.flush()
    return usuario


@pytest.fixture()
def operario(db_session, lider):
    usuario = Usuario(
        nombre="TEST-Operario",
        documento="TEST-OPERARIO-001",
        rol=RolUsuario.OPERARIO,
        password_hash=hash_password("clave-test"),
        lider_id=lider.id,
    )
    db_session.add(usuario)
    db_session.flush()
    return usuario


@pytest.fixture()
def calidad(db_session):
    usuario = Usuario(
        nombre="TEST-Calidad",
        documento="TEST-CALIDAD-001",
        rol=RolUsuario.CALIDAD,
        password_hash=hash_password("clave-test"),
        lider_id=None,
    )
    db_session.add(usuario)
    db_session.flush()
    return usuario


@pytest.fixture()
def material(db_session):
    material = MaterialMaestro(
        codigo_sap="TEST-MAT-001",
        descripcion="TEST Material de prueba",
        unidad_medida="KG",
    )
    db_session.add(material)
    db_session.flush()
    return material


def auth_header(usuario: Usuario) -> dict:
    token = create_access_token(data={"sub": usuario.documento, "rol": usuario.rol.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def lider_headers(lider):
    return auth_header(lider)


@pytest.fixture()
def operario_headers(operario):
    return auth_header(operario)


@pytest.fixture()
def calidad_headers(calidad):
    return auth_header(calidad)
