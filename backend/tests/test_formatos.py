"""Tests de formatos FO-PFTO-0057: casos felices + errores (401, 403, 404, 400, 409,
orden de firmas)."""

from decimal import Decimal

from app.models.orden_produccion import OrdenProduccion
from app.models.recepcion import Recepcion
from app.models.saldo import Saldo


def _crear_orden(db_session, lider, codigo, estado_cerrada=False):
    orden = OrdenProduccion(
        codigo_orden=codigo,
        turno_apertura="1",
        usuario_apertura_id=lider.id,
    )
    db_session.add(orden)
    db_session.flush()
    if estado_cerrada:
        from datetime import datetime

        from app.models.enums import EstadoOrden

        orden.estado = EstadoOrden.CERRADA
        orden.fecha_cierre = datetime.now()
        db_session.flush()
    return orden


def _crear_saldo(db_session, lider, material, codigo_barras, cantidad="10.00"):
    recepcion = Recepcion(
        codigo_sap=material.codigo_sap,
        lote_sap="TEST-LOTE",
        lote_proveedor="TEST-LOTE-PROV",
        fecha_vencimiento="2099-01-01",
        cantidad_recibida=Decimal(cantidad),
        codigo_barras=codigo_barras,
        usuario_id=lider.id,
    )
    db_session.add(recepcion)
    db_session.flush()

    saldo = Saldo(
        codigo_barras=codigo_barras,
        codigo_sap=material.codigo_sap,
        lote_sap="TEST-LOTE",
        lote_proveedor="TEST-LOTE-PROV",
        fecha_vencimiento="2099-01-01",
        cantidad_disponible=Decimal(cantidad),
        origen_recepcion_id=recepcion.id,
    )
    db_session.add(saldo)
    db_session.flush()
    return saldo


def _crear_orden_cerrada_con_consumo(client, db_session, lider, lider_headers, material, codigo):
    """Helper: orden abierta -> un consumo -> se cierra -> queda lista para generar formato."""
    orden = _crear_orden(db_session, lider, codigo)
    _crear_saldo(db_session, lider, material, f"TEST-CB-{codigo}", cantidad="10.00")

    client.post(
        "/api/consumos",
        json={
            "orden_produccion_id": orden.id,
            "codigo_barras": f"TEST-CB-{codigo}",
            "peso_capturado": "2.00",
            "turno": "1",
        },
        headers=lider_headers,
    )
    client.patch(f"/api/ordenes-produccion/{orden.id}", json={"estado": "CERRADA"}, headers=lider_headers)
    return orden


def test_generar_formato_orden_cerrada_con_consumos(client, lider_headers, lider, db_session, material):
    orden = _crear_orden_cerrada_con_consumo(client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-1")

    resp = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["orden_produccion_id"] == orden.id
    assert data["generado_por"] == lider.id
    assert data["firmado_lider"] is False
    assert data["firmado_calidad"] is False
    assert data["estado"] == "PENDIENTE"
    assert data["pdf_path"] is None


def test_listar_y_consultar_formato_cualquier_autenticado(
    client, lider_headers, operario_headers, lider, db_session, material
):
    orden = _crear_orden_cerrada_con_consumo(client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-2")
    creado = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers).json()

    resp_listar = client.get("/api/formatos", params={"orden_produccion_id": orden.id}, headers=operario_headers)
    assert resp_listar.status_code == 200
    assert len(resp_listar.json()) == 1

    resp_consultar = client.get(f"/api/formatos/{creado['id']}", headers=operario_headers)
    assert resp_consultar.status_code == 200
    assert resp_consultar.json()["id"] == creado["id"]


def test_firmar_lider_luego_calidad_queda_completo(
    client, lider_headers, calidad_headers, lider, calidad, db_session, material
):
    orden = _crear_orden_cerrada_con_consumo(client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-3")
    creado = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers).json()

    resp_lider = client.post(f"/api/formatos/{creado['id']}/firmar-lider", headers=lider_headers)
    assert resp_lider.status_code == 200
    data_lider = resp_lider.json()
    assert data_lider["firmado_lider"] is True
    assert data_lider["lider_id"] == lider.id
    assert data_lider["fecha_firma_lider"] is not None
    assert data_lider["estado"] == "FIRMADO_LIDER"

    resp_calidad = client.post(f"/api/formatos/{creado['id']}/firmar-calidad", headers=calidad_headers)
    assert resp_calidad.status_code == 200
    data_calidad = resp_calidad.json()
    assert data_calidad["firmado_calidad"] is True
    assert data_calidad["calidad_id"] == calidad.id
    assert data_calidad["fecha_firma_calidad"] is not None
    assert data_calidad["estado"] == "COMPLETO"


def test_generar_formato_orden_abierta_400(client, lider_headers, lider, db_session, material):
    orden = _crear_orden(db_session, lider, "TEST-ORD-FMT-ABIERTA")
    _crear_saldo(db_session, lider, material, "TEST-CB-FMT-ABIERTA", cantidad="10.00")
    client.post(
        "/api/consumos",
        json={
            "orden_produccion_id": orden.id,
            "codigo_barras": "TEST-CB-FMT-ABIERTA",
            "peso_capturado": "2.00",
            "turno": "1",
        },
        headers=lider_headers,
    )

    resp = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers)
    assert resp.status_code == 400


def test_generar_formato_orden_sin_consumos_400(client, lider_headers, lider, db_session):
    orden = _crear_orden(db_session, lider, "TEST-ORD-FMT-SIN-CONSUMOS", estado_cerrada=True)

    resp = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers)
    assert resp.status_code == 400


def test_generar_formato_orden_inexistente_404(client, lider_headers):
    resp = client.post("/api/formatos", json={"orden_produccion_id": 999999}, headers=lider_headers)
    assert resp.status_code == 404


def test_generar_formato_duplicado_409(client, lider_headers, lider, db_session, material):
    orden = _crear_orden_cerrada_con_consumo(client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-DUP")

    resp1 = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers)
    assert resp1.status_code == 201

    resp2 = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers)
    assert resp2.status_code == 409


def test_generar_formato_no_cierra_ni_modifica_orden(client, lider_headers, lider, db_session, material):
    orden = _crear_orden_cerrada_con_consumo(
        client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-NO-TOCA-ORDEN"
    )
    orden_antes = client.get(f"/api/ordenes-produccion/{orden.id}", headers=lider_headers).json()

    client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers)

    orden_despues = client.get(f"/api/ordenes-produccion/{orden.id}", headers=lider_headers).json()
    assert orden_despues == orden_antes


def test_firmar_calidad_sin_firma_lider_previa_400(
    client, lider_headers, calidad_headers, lider, db_session, material
):
    orden = _crear_orden_cerrada_con_consumo(
        client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-SIN-LIDER"
    )
    creado = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers).json()

    resp = client.post(f"/api/formatos/{creado['id']}/firmar-calidad", headers=calidad_headers)
    assert resp.status_code == 400


def test_firmar_lider_dos_veces_409(client, lider_headers, lider, db_session, material):
    orden = _crear_orden_cerrada_con_consumo(client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-2XLIDER")
    creado = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers).json()

    client.post(f"/api/formatos/{creado['id']}/firmar-lider", headers=lider_headers)
    resp = client.post(f"/api/formatos/{creado['id']}/firmar-lider", headers=lider_headers)
    assert resp.status_code == 409


def test_firmar_calidad_dos_veces_409(client, lider_headers, calidad_headers, lider, db_session, material):
    orden = _crear_orden_cerrada_con_consumo(
        client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-2XCALIDAD"
    )
    creado = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers).json()

    client.post(f"/api/formatos/{creado['id']}/firmar-lider", headers=lider_headers)
    resp1 = client.post(f"/api/formatos/{creado['id']}/firmar-calidad", headers=calidad_headers)
    assert resp1.status_code == 200
    resp = client.post(f"/api/formatos/{creado['id']}/firmar-calidad", headers=calidad_headers)
    assert resp.status_code == 409


def test_crear_formato_como_operario_403(client, operario_headers, lider, lider_headers, db_session, material):
    orden = _crear_orden_cerrada_con_consumo(
        client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-OPERARIO-403"
    )

    resp = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=operario_headers)
    assert resp.status_code == 403


def test_firmar_lider_como_operario_403(client, operario_headers, lider, lider_headers, db_session, material):
    orden = _crear_orden_cerrada_con_consumo(
        client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-FIRMA-OPERARIO"
    )
    creado = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers).json()

    resp = client.post(f"/api/formatos/{creado['id']}/firmar-lider", headers=operario_headers)
    assert resp.status_code == 403


def test_firmar_calidad_como_operario_403(client, operario_headers, lider, lider_headers, db_session, material):
    orden = _crear_orden_cerrada_con_consumo(
        client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-CALIDAD-OPERARIO"
    )
    creado = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers).json()
    client.post(f"/api/formatos/{creado['id']}/firmar-lider", headers=lider_headers)

    resp = client.post(f"/api/formatos/{creado['id']}/firmar-calidad", headers=operario_headers)
    assert resp.status_code == 403


def test_firmar_calidad_como_lider_403(client, lider_headers, lider, db_session, material):
    orden = _crear_orden_cerrada_con_consumo(
        client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-CALIDAD-LIDER"
    )
    creado = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers).json()
    client.post(f"/api/formatos/{creado['id']}/firmar-lider", headers=lider_headers)

    resp = client.post(f"/api/formatos/{creado['id']}/firmar-calidad", headers=lider_headers)
    assert resp.status_code == 403

    sin_firma = client.get(f"/api/formatos/{creado['id']}", headers=lider_headers).json()
    assert sin_firma["firmado_calidad"] is False
    assert sin_firma["calidad_id"] is None


def test_firmar_calidad_guarda_calidad_id(
    client, lider_headers, operario_headers, calidad_headers, lider, calidad, db_session, material
):
    orden = _crear_orden_cerrada_con_consumo(
        client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-CALIDAD-ID"
    )
    creado = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers).json()
    assert creado["calidad_id"] is None

    client.post(f"/api/formatos/{creado['id']}/firmar-lider", headers=lider_headers)
    client.post(f"/api/formatos/{creado['id']}/firmar-calidad", headers=calidad_headers)

    listado = client.get("/api/formatos", params={"orden_produccion_id": orden.id}, headers=operario_headers).json()
    assert len(listado) == 1
    assert listado[0]["calidad_id"] == calidad.id
    assert listado[0]["lider_id"] == lider.id
    assert listado[0]["estado"] == "COMPLETO"


def test_firmar_lider_como_calidad_403(client, lider_headers, calidad_headers, lider, db_session, material):
    orden = _crear_orden_cerrada_con_consumo(
        client, db_session, lider, lider_headers, material, "TEST-ORD-FMT-LIDER-CALIDAD"
    )
    creado = client.post("/api/formatos", json={"orden_produccion_id": orden.id}, headers=lider_headers).json()

    resp = client.post(f"/api/formatos/{creado['id']}/firmar-lider", headers=calidad_headers)
    assert resp.status_code == 403


def test_crear_usuario_calidad_sin_lider_id(client, lider_headers):
    resp = client.post(
        "/api/usuarios",
        json={
            "nombre": "TEST-Calidad-Nuevo",
            "documento": "TEST-CALIDAD-NUEVO-1",
            "rol": "CALIDAD",
            "password": "clave-test",
        },
        headers=lider_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["rol"] == "CALIDAD"
    assert resp.json()["lider_id"] is None


def test_crear_usuario_calidad_como_calidad_403(client, calidad_headers):
    resp = client.post(
        "/api/usuarios",
        json={
            "nombre": "TEST-Calidad-Otro",
            "documento": "TEST-CALIDAD-OTRO-1",
            "rol": "CALIDAD",
            "password": "clave-test",
        },
        headers=calidad_headers,
    )
    assert resp.status_code == 403


def test_consultar_formato_inexistente_404(client, lider_headers):
    resp = client.get("/api/formatos/999999", headers=lider_headers)
    assert resp.status_code == 404


def test_firmar_lider_formato_inexistente_404(client, lider_headers):
    resp = client.post("/api/formatos/999999/firmar-lider", headers=lider_headers)
    assert resp.status_code == 404


def test_firmar_calidad_formato_inexistente_404(client, calidad_headers):
    resp = client.post("/api/formatos/999999/firmar-calidad", headers=calidad_headers)
    assert resp.status_code == 404


def test_crear_formato_sin_token_401(client, lider, db_session):
    orden = _crear_orden(db_session, lider, "TEST-ORD-FMT-SIN-TOKEN", estado_cerrada=True)
    resp = client.post("/api/formatos", json={"orden_produccion_id": orden.id})
    assert resp.status_code == 401


def test_listar_formatos_sin_token_401(client):
    resp = client.get("/api/formatos")
    assert resp.status_code == 401
