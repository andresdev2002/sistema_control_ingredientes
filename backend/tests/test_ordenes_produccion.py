"""Tests de ordenes_produccion: casos felices + errores (401, 403, 404, 409, 400, 422)."""


def _payload_orden(**overrides):
    datos = {
        "codigo_orden": "TEST-ORD-001",
        "codigo_producto_terminado": "TEST-PROD-001",
        "turno_apertura": "1",
    }
    datos.update(overrides)
    return datos


def test_crear_orden_queda_abierta_y_usuario_sale_del_token(client, lider_headers, lider):
    resp = client.post("/api/ordenes-produccion", json=_payload_orden(), headers=lider_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["estado"] == "ABIERTA"
    assert data["usuario_apertura_id"] == lider.id
    assert data["fecha_cierre"] is None


def test_listar_ordenes_cualquier_usuario_autenticado(client, lider_headers, operario_headers):
    client.post("/api/ordenes-produccion", json=_payload_orden(), headers=lider_headers)

    resp = client.get("/api/ordenes-produccion", headers=operario_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_consultar_orden_por_id(client, lider_headers, operario_headers):
    creada = client.post("/api/ordenes-produccion", json=_payload_orden(), headers=lider_headers).json()

    resp = client.get(f"/api/ordenes-produccion/{creada['id']}", headers=operario_headers)
    assert resp.status_code == 200
    assert resp.json()["codigo_orden"] == "TEST-ORD-001"


def test_editar_orden_campos_no_identificadores(client, lider_headers):
    creada = client.post("/api/ordenes-produccion", json=_payload_orden(), headers=lider_headers).json()

    resp = client.patch(
        f"/api/ordenes-produccion/{creada['id']}",
        json={"codigo_producto_terminado": "TEST-PROD-NUEVO", "turno_apertura": "2"},
        headers=lider_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["codigo_producto_terminado"] == "TEST-PROD-NUEVO"
    assert data["turno_apertura"] == "2"
    assert data["estado"] == "ABIERTA"


def test_cerrar_orden_transicion_valida(client, lider_headers):
    creada = client.post("/api/ordenes-produccion", json=_payload_orden(), headers=lider_headers).json()

    resp = client.patch(
        f"/api/ordenes-produccion/{creada['id']}",
        json={"estado": "CERRADA"},
        headers=lider_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["estado"] == "CERRADA"
    assert data["fecha_cierre"] is not None


def test_orden_cerrada_no_se_puede_reabrir_400(client, lider_headers):
    creada = client.post("/api/ordenes-produccion", json=_payload_orden(), headers=lider_headers).json()
    client.patch(f"/api/ordenes-produccion/{creada['id']}", json={"estado": "CERRADA"}, headers=lider_headers)

    resp = client.patch(
        f"/api/ordenes-produccion/{creada['id']}",
        json={"estado": "ABIERTA"},
        headers=lider_headers,
    )
    assert resp.status_code == 400


def test_orden_cerrada_no_se_puede_editar_400(client, lider_headers):
    creada = client.post("/api/ordenes-produccion", json=_payload_orden(), headers=lider_headers).json()
    client.patch(f"/api/ordenes-produccion/{creada['id']}", json={"estado": "CERRADA"}, headers=lider_headers)

    resp = client.patch(
        f"/api/ordenes-produccion/{creada['id']}",
        json={"codigo_producto_terminado": "TEST-NO-DEBE-APLICAR"},
        headers=lider_headers,
    )
    assert resp.status_code == 400


def test_crear_orden_codigo_duplicado_409(client, lider_headers):
    resp1 = client.post("/api/ordenes-produccion", json=_payload_orden(), headers=lider_headers)
    assert resp1.status_code == 201

    resp2 = client.post("/api/ordenes-produccion", json=_payload_orden(), headers=lider_headers)
    assert resp2.status_code == 409


def test_crear_orden_sin_token_401(client):
    resp = client.post("/api/ordenes-produccion", json=_payload_orden())
    assert resp.status_code == 401


def test_crear_orden_como_operario_403(client, operario_headers):
    resp = client.post("/api/ordenes-produccion", json=_payload_orden(), headers=operario_headers)
    assert resp.status_code == 403


def test_editar_orden_como_operario_403(client, lider_headers, operario_headers):
    creada = client.post("/api/ordenes-produccion", json=_payload_orden(), headers=lider_headers).json()

    resp = client.patch(
        f"/api/ordenes-produccion/{creada['id']}",
        json={"estado": "CERRADA"},
        headers=operario_headers,
    )
    assert resp.status_code == 403


def test_consultar_orden_inexistente_404(client, lider_headers):
    resp = client.get("/api/ordenes-produccion/999999", headers=lider_headers)
    assert resp.status_code == 404


def test_editar_orden_inexistente_404(client, lider_headers):
    resp = client.patch(
        "/api/ordenes-produccion/999999",
        json={"estado": "CERRADA"},
        headers=lider_headers,
    )
    assert resp.status_code == 404


def test_crear_orden_turno_invalido_422(client, lider_headers):
    resp = client.post(
        "/api/ordenes-produccion",
        json=_payload_orden(turno_apertura="9"),
        headers=lider_headers,
    )
    assert resp.status_code == 422


def test_listar_ordenes_sin_token_401(client):
    resp = client.get("/api/ordenes-produccion")
    assert resp.status_code == 401


def test_crear_y_leer_orden_con_cada_valor_de_turno(client, lider_headers):
    """Regresión del bug de serialización TurnoTipo (.name vs .value): cada valor
    '1'/'2'/'3' debe poder guardarse y volver a leerse exactamente igual."""
    for i, turno in enumerate(["1", "2", "3"]):
        creada = client.post(
            "/api/ordenes-produccion",
            json=_payload_orden(codigo_orden=f"TEST-ORD-TURNO-{turno}", turno_apertura=turno),
            headers=lider_headers,
        )
        assert creada.status_code == 201
        assert creada.json()["turno_apertura"] == turno

        leida = client.get(f"/api/ordenes-produccion/{creada.json()['id']}", headers=lider_headers)
        assert leida.status_code == 200
        assert leida.json()["turno_apertura"] == turno
