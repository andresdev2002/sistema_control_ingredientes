"""Tests de consumos: casos felices + errores, incluidos los 4 casos límite pedidos
(cantidad mayor al saldo, saldo agotado, orden cerrada, consumo exacto que deja AGOTADO)."""

from decimal import Decimal

from app.models.orden_produccion import OrdenProduccion
from app.models.recepcion import Recepcion
from app.models.saldo import Saldo


def _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-CONSUMO-1"):
    orden = OrdenProduccion(
        codigo_orden=codigo,
        turno_apertura="1",
        usuario_apertura_id=lider.id,
    )
    db_session.add(orden)
    db_session.flush()
    return orden


def _crear_saldo_activo(db_session, lider, material, codigo_barras, cantidad="10.00"):
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


def _payload_consumo(orden_id, codigo_barras, **overrides):
    datos = {
        "orden_produccion_id": orden_id,
        "codigo_barras": codigo_barras,
        "peso_capturado": "3.00",
        "turno": "1",
    }
    datos.update(overrides)
    return datos


def test_crear_consumo_descuenta_el_saldo(client, lider_headers, lider, db_session, material):
    orden = _crear_orden_abierta(db_session, lider)
    saldo = _crear_saldo_activo(db_session, lider, material, "TEST-CB-CONSUMO-1", cantidad="10.00")

    resp = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-CONSUMO-1", peso_capturado="3.00"),
        headers=lider_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["peso_redondeado"] == "3.00"
    assert data["cantidad_disponible_antes"] == "10.00"
    assert data["cantidad_sobrante"] == "7.00"
    assert data["saldo_nuevo_id"] is None

    saldo_resp = client.get("/api/saldos/TEST-CB-CONSUMO-1", headers=lider_headers)
    assert saldo_resp.json()["cantidad_disponible"] == "7.00"
    assert saldo_resp.json()["estado"] == "ACTIVO"


def test_operario_puede_crear_consumo(client, operario_headers, lider, db_session, material):
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-CONSUMO-OPERARIO")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-OPERARIO-1", cantidad="5.00")

    resp = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-OPERARIO-1", peso_capturado="2.00"),
        headers=operario_headers,
    )
    assert resp.status_code == 201


def test_calidad_no_puede_crear_consumo_403(client, calidad_headers, lider_headers, lider, db_session, material):
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-CONSUMO-CALIDAD")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-CALIDAD-1", cantidad="5.00")

    resp = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-CALIDAD-1", peso_capturado="2.00"),
        headers=calidad_headers,
    )
    assert resp.status_code == 403

    # no se guardó nada: sin registros para la orden y el saldo intacto
    consumos = client.get("/api/consumos", params={"orden_produccion_id": orden.id}, headers=calidad_headers)
    assert consumos.status_code == 200
    assert consumos.json() == []
    saldo_resp = client.get("/api/saldos/TEST-CB-CALIDAD-1", headers=lider_headers)
    assert saldo_resp.json()["cantidad_disponible"] == "5.00"
    assert saldo_resp.json()["estado"] == "ACTIVO"


def test_listar_consumos_filtrado_por_orden(client, lider_headers, lider, db_session, material):
    orden1 = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-FILTRO-1")
    orden2 = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-FILTRO-2")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-FILTRO-C1", cantidad="10.00")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-FILTRO-C2", cantidad="10.00")

    client.post(
        "/api/consumos",
        json=_payload_consumo(orden1.id, "TEST-CB-FILTRO-C1", peso_capturado="1.00"),
        headers=lider_headers,
    )
    client.post(
        "/api/consumos",
        json=_payload_consumo(orden2.id, "TEST-CB-FILTRO-C2", peso_capturado="1.00"),
        headers=lider_headers,
    )

    resp = client.get("/api/consumos", params={"orden_produccion_id": orden1.id}, headers=lider_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["orden_produccion_id"] == orden1.id


def test_consumo_exacto_deja_saldo_agotado(client, lider_headers, lider, db_session, material):
    """Caso límite pedido: consumo exacto que deja el saldo en AGOTADO."""
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-AGOTA-EXACTO")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-AGOTA-EXACTO", cantidad="5.00")

    resp = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-AGOTA-EXACTO", peso_capturado="5.00"),
        headers=lider_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["cantidad_sobrante"] == "0.00"

    saldo_resp = client.get("/api/saldos/TEST-CB-AGOTA-EXACTO", headers=lider_headers)
    assert saldo_resp.json()["estado"] == "AGOTADO"
    assert saldo_resp.json()["cantidad_disponible"] == "0.00"


def test_consumo_cantidad_mayor_al_saldo_400(client, lider_headers, lider, db_session, material):
    """Caso límite pedido: cantidad mayor al saldo disponible."""
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-MAYOR-SALDO")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-MAYOR-SALDO", cantidad="2.00")

    resp = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-MAYOR-SALDO", peso_capturado="5.00"),
        headers=lider_headers,
    )
    assert resp.status_code == 400


def test_consumo_sobre_saldo_agotado_400(client, lider_headers, lider, db_session, material):
    """Caso límite pedido: saldo ya agotado."""
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-SALDO-AGOTADO")
    saldo = _crear_saldo_activo(db_session, lider, material, "TEST-CB-YA-AGOTADO", cantidad="3.00")
    saldo.cantidad_disponible = Decimal("0.00")
    from app.models.enums import EstadoSaldo

    saldo.estado = EstadoSaldo.AGOTADO
    db_session.flush()

    resp = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-YA-AGOTADO", peso_capturado="1.00"),
        headers=lider_headers,
    )
    assert resp.status_code == 400


def test_consumo_sobre_orden_cerrada_400(client, lider_headers, lider, db_session, material):
    """Caso límite pedido: orden cerrada."""
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-CERRADA-CONSUMO")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-ORDEN-CERRADA", cantidad="5.00")

    client.patch(f"/api/ordenes-produccion/{orden.id}", json={"estado": "CERRADA"}, headers=lider_headers)

    resp = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-ORDEN-CERRADA", peso_capturado="1.00"),
        headers=lider_headers,
    )
    assert resp.status_code == 400


def test_consumo_orden_inexistente_404(client, lider_headers, lider, db_session, material):
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-ORDEN-NO-EXISTE", cantidad="5.00")

    resp = client.post(
        "/api/consumos",
        json=_payload_consumo(999999, "TEST-CB-ORDEN-NO-EXISTE", peso_capturado="1.00"),
        headers=lider_headers,
    )
    assert resp.status_code == 404


def test_consumo_saldo_inexistente_404(client, lider_headers, lider, db_session, material):
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-SALDO-NO-EXISTE")

    resp = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-NO-EXISTE-NUNCA", peso_capturado="1.00"),
        headers=lider_headers,
    )
    assert resp.status_code == 404


def test_consumo_peso_cero_o_negativo_422(client, lider_headers, lider, db_session, material):
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-PESO-INVALIDO")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-PESO-INVALIDO", cantidad="5.00")

    resp_cero = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-PESO-INVALIDO", peso_capturado="0"),
        headers=lider_headers,
    )
    assert resp_cero.status_code == 422

    resp_negativo = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-PESO-INVALIDO", peso_capturado="-1"),
        headers=lider_headers,
    )
    assert resp_negativo.status_code == 422


def test_consumo_turno_faltante_422(client, lider_headers, lider, db_session, material):
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-SIN-TURNO")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-SIN-TURNO", cantidad="5.00")

    payload = _payload_consumo(orden.id, "TEST-CB-SIN-TURNO")
    del payload["turno"]

    resp = client.post("/api/consumos", json=payload, headers=lider_headers)
    assert resp.status_code == 422


def test_consumo_turno_invalido_422(client, lider_headers, lider, db_session, material):
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-TURNO-INVALIDO")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-TURNO-INVALIDO", cantidad="5.00")

    resp = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-TURNO-INVALIDO", turno="9"),
        headers=lider_headers,
    )
    assert resp.status_code == 422


def test_crear_consumo_sin_token_401(client, lider, db_session, material):
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-SIN-TOKEN")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-SIN-TOKEN", cantidad="5.00")

    resp = client.post("/api/consumos", json=_payload_consumo(orden.id, "TEST-CB-SIN-TOKEN"))
    assert resp.status_code == 401


def test_listar_consumos_sin_token_401(client):
    resp = client.get("/api/consumos")
    assert resp.status_code == 401


def test_snapshot_fields_se_copian_del_saldo_no_son_fk(client, lider_headers, lider, db_session, material):
    orden = _crear_orden_abierta(db_session, lider, codigo="TEST-ORD-SNAPSHOT")
    _crear_saldo_activo(db_session, lider, material, "TEST-CB-SNAPSHOT", cantidad="8.00")

    resp = client.post(
        "/api/consumos",
        json=_payload_consumo(orden.id, "TEST-CB-SNAPSHOT", peso_capturado="2.00"),
        headers=lider_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["codigo_sap"] == material.codigo_sap
    assert data["lote_sap"] == "TEST-LOTE"
    assert data["lote_proveedor"] == "TEST-LOTE-PROV"
