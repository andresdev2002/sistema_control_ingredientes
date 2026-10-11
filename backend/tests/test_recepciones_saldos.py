"""Tests de recepciones y saldos: casos felices + errores (401, 403, 404, 409, 422)."""

from app.models.recepcion import Recepcion
from app.models.saldo import Saldo


def _payload_recepcion(**overrides):
    datos = {
        "codigo_sap": "TEST-MAT-001",
        "lote_sap": "TEST-LOTE-SAP-1",
        "lote_proveedor": "TEST-LOTE-PROV-1",
        "fecha_vencimiento": "2099-01-01",
        "cantidad_recibida": "10.50",
    }
    datos.update(overrides)
    return datos


def test_crear_recepcion_sin_codigo_barras_genera_uno_y_crea_saldo_activo(client, lider_headers, material):
    resp = client.post("/api/recepciones", json=_payload_recepcion(), headers=lider_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["codigo_sap"] == "TEST-MAT-001"
    assert data["codigo_barras"]  # se generó algo no vacío

    saldo_resp = client.get(f"/api/saldos/{data['codigo_barras']}", headers=lider_headers)
    assert saldo_resp.status_code == 200
    saldo = saldo_resp.json()
    assert saldo["estado"] == "ACTIVO"
    assert saldo["saldo_padre_id"] is None
    assert float(saldo["cantidad_disponible"]) == float(data["cantidad_recibida"])
    assert saldo["origen_recepcion_id"] == data["id"]


def test_crear_recepcion_con_codigo_barras_propio_se_usa_en_ambas_tablas(client, lider_headers, material):
    resp = client.post(
        "/api/recepciones",
        json=_payload_recepcion(codigo_barras="TEST-CB-PROPIO-1"),
        headers=lider_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["codigo_barras"] == "TEST-CB-PROPIO-1"

    saldo_resp = client.get("/api/saldos/TEST-CB-PROPIO-1", headers=lider_headers)
    assert saldo_resp.status_code == 200


def test_listar_recepciones_cualquier_usuario_autenticado(client, lider_headers, operario_headers, material):
    client.post("/api/recepciones", json=_payload_recepcion(), headers=lider_headers)

    resp = client.get("/api/recepciones", headers=operario_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_listar_saldos_con_filtros(client, lider_headers, material):
    client.post(
        "/api/recepciones",
        json=_payload_recepcion(codigo_barras="TEST-CB-FILTRO-1"),
        headers=lider_headers,
    )

    resp = client.get("/api/saldos", params={"estado": "ACTIVO", "codigo_sap": "TEST-MAT-001"}, headers=lider_headers)
    assert resp.status_code == 200
    codigos = [s["codigo_barras"] for s in resp.json()]
    assert "TEST-CB-FILTRO-1" in codigos

    resp_agotado = client.get("/api/saldos", params={"estado": "AGOTADO"}, headers=lider_headers)
    assert resp_agotado.status_code == 200
    assert "TEST-CB-FILTRO-1" not in [s["codigo_barras"] for s in resp_agotado.json()]


def test_crear_recepcion_sin_token_401(client, material):
    resp = client.post("/api/recepciones", json=_payload_recepcion())
    assert resp.status_code == 401


def test_crear_recepcion_como_operario_403(client, operario_headers, material):
    resp = client.post("/api/recepciones", json=_payload_recepcion(), headers=operario_headers)
    assert resp.status_code == 403


def test_crear_recepcion_material_inexistente_404(client, lider_headers):
    resp = client.post(
        "/api/recepciones",
        json=_payload_recepcion(codigo_sap="TEST-MAT-NO-EXISTE"),
        headers=lider_headers,
    )
    assert resp.status_code == 404


def test_crear_recepcion_codigo_barras_duplicado_409(client, lider_headers, material):
    resp1 = client.post(
        "/api/recepciones",
        json=_payload_recepcion(codigo_barras="TEST-CB-DUP-1"),
        headers=lider_headers,
    )
    assert resp1.status_code == 201

    resp2 = client.post(
        "/api/recepciones",
        json=_payload_recepcion(codigo_barras="TEST-CB-DUP-1"),
        headers=lider_headers,
    )
    assert resp2.status_code == 409


def test_crear_recepcion_codigo_barras_duplicado_contra_saldo_existente_409(
    client, lider_headers, db_session, material, lider
):
    """Un codigo_barras ya usado por un Saldo (aunque pertenezca a OTRA recepción) también debe bloquear.

    saldos tiene un CHECK constraint en la base real (chk_origen) que exige
    origen_recepcion_id o saldo_padre_id no nulos, así que el saldo de prueba
    se crea con un origen_recepcion_id válido (no puede ser "huérfano")."""
    recepcion_base = Recepcion(
        codigo_sap="TEST-MAT-001",
        lote_sap="TEST-LOTE-BASE",
        lote_proveedor="TEST-LOTE-BASE-PROV",
        fecha_vencimiento="2099-01-01",
        cantidad_recibida="1.00",
        codigo_barras="TEST-CB-BASE-RECEP",
        usuario_id=lider.id,
    )
    db_session.add(recepcion_base)
    db_session.flush()

    saldo_suelto = Saldo(
        codigo_barras="TEST-CB-EN-SALDO-1",
        codigo_sap="TEST-MAT-001",
        lote_sap="TEST-LOTE-X",
        lote_proveedor="TEST-LOTE-Y",
        fecha_vencimiento="2099-01-01",
        cantidad_disponible="5.00",
        origen_recepcion_id=recepcion_base.id,
    )
    db_session.add(saldo_suelto)
    db_session.flush()

    resp = client.post(
        "/api/recepciones",
        json=_payload_recepcion(codigo_barras="TEST-CB-EN-SALDO-1"),
        headers=lider_headers,
    )
    assert resp.status_code == 409


def test_crear_recepcion_cantidad_cero_o_negativa_422(client, lider_headers, material):
    resp_cero = client.post("/api/recepciones", json=_payload_recepcion(cantidad_recibida="0"), headers=lider_headers)
    assert resp_cero.status_code == 422

    resp_negativa = client.post(
        "/api/recepciones", json=_payload_recepcion(cantidad_recibida="-5"), headers=lider_headers
    )
    assert resp_negativa.status_code == 422


def test_consultar_saldo_inexistente_404(client, lider_headers):
    resp = client.get("/api/saldos/TEST-CB-NO-EXISTE", headers=lider_headers)
    assert resp.status_code == 404


def test_listar_recepciones_sin_token_401(client):
    resp = client.get("/api/recepciones")
    assert resp.status_code == 401


def test_listar_saldos_sin_token_401(client):
    resp = client.get("/api/saldos")
    assert resp.status_code == 401


def test_commit_unico_recepcion_y_saldo_persisten_juntos(client, lider_headers, db_session, material):
    """Ambas filas deben existir tras el POST, confirmando la transacción única."""
    resp = client.post(
        "/api/recepciones",
        json=_payload_recepcion(codigo_barras="TEST-CB-ATOMICO-1"),
        headers=lider_headers,
    )
    assert resp.status_code == 201

    recepcion = db_session.query(Recepcion).filter(Recepcion.codigo_barras == "TEST-CB-ATOMICO-1").first()
    saldo = db_session.query(Saldo).filter(Saldo.codigo_barras == "TEST-CB-ATOMICO-1").first()
    assert recepcion is not None
    assert saldo is not None
    assert saldo.origen_recepcion_id == recepcion.id
    assert saldo.saldo_padre_id is None
    assert saldo.estado.value == "ACTIVO"
