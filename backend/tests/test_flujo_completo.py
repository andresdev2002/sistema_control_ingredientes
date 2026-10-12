"""Test de flujo completo end-to-end, usando los endpoints reales (no ORM directo):
LIDER crea operario, material, recepción y orden -> operario registra consumo ->
LIDER cierra la orden -> LIDER genera el formato -> firmar-calidad antes de
firmar-lider da 400 -> LIDER firma -> un LIDER no puede firmar calidad (403) ->
el usuario CALIDAD firma, queda calidad_id y estado COMPLETO.

Todos los datos creados en este test están prefijados con TEST-.
"""


def test_flujo_completo_operario_material_recepcion_orden_consumo_formato(client, lider_headers, lider):
    # 1. LIDER crea un operario
    resp_operario = client.post(
        "/api/usuarios",
        json={
            "nombre": "TEST-Operario-Flujo",
            "documento": "TEST-FLUJO-OPERARIO-1",
            "rol": "OPERARIO",
            "password": "clave-test-flujo",
            "lider_id": lider.id,
        },
        headers=lider_headers,
    )
    assert resp_operario.status_code == 201

    # login real del operario para obtener su token
    resp_login = client.post(
        "/api/auth/login",
        json={"documento": "TEST-FLUJO-OPERARIO-1", "password": "clave-test-flujo"},
    )
    assert resp_login.status_code == 200
    operario_token = resp_login.json()["access_token"]
    operario_headers = {"Authorization": f"Bearer {operario_token}"}

    # 1b. LIDER crea un usuario CALIDAD (sin lider_id) y este hace login real
    resp_calidad = client.post(
        "/api/usuarios",
        json={
            "nombre": "TEST-Calidad-Flujo",
            "documento": "TEST-FLUJO-CALIDAD-1",
            "rol": "CALIDAD",
            "password": "clave-test-flujo",
        },
        headers=lider_headers,
    )
    assert resp_calidad.status_code == 201
    calidad_id = resp_calidad.json()["id"]

    resp_login_calidad = client.post(
        "/api/auth/login",
        json={"documento": "TEST-FLUJO-CALIDAD-1", "password": "clave-test-flujo"},
    )
    assert resp_login_calidad.status_code == 200
    calidad_headers = {"Authorization": f"Bearer {resp_login_calidad.json()['access_token']}"}

    # 2. LIDER crea el material
    resp_material = client.post(
        "/api/material-maestro",
        json={"codigo_sap": "TEST-FLUJO-MAT-1", "descripcion": "TEST Material de flujo", "unidad_medida": "KG"},
        headers=lider_headers,
    )
    assert resp_material.status_code == 201

    # 3. LIDER crea la recepción (y su saldo inicial)
    resp_recepcion = client.post(
        "/api/recepciones",
        json={
            "codigo_sap": "TEST-FLUJO-MAT-1",
            "lote_sap": "TEST-LOTE-FLUJO",
            "lote_proveedor": "TEST-LOTE-PROV-FLUJO",
            "fecha_vencimiento": "2099-01-01",
            "cantidad_recibida": "10.00",
            "codigo_barras": "TEST-CB-FLUJO-1",
        },
        headers=lider_headers,
    )
    assert resp_recepcion.status_code == 201

    # 4. LIDER abre la orden de producción
    resp_orden = client.post(
        "/api/ordenes-produccion",
        json={"codigo_orden": "TEST-FLUJO-ORD-1", "turno_apertura": "1"},
        headers=lider_headers,
    )
    assert resp_orden.status_code == 201
    orden_id = resp_orden.json()["id"]

    # 5. el OPERARIO registra el consumo
    resp_consumo = client.post(
        "/api/consumos",
        json={
            "orden_produccion_id": orden_id,
            "codigo_barras": "TEST-CB-FLUJO-1",
            "peso_capturado": "4.00",
            "turno": "1",
        },
        headers=operario_headers,
    )
    assert resp_consumo.status_code == 201

    # 6. LIDER cierra la orden
    resp_cierre = client.patch(
        f"/api/ordenes-produccion/{orden_id}",
        json={"estado": "CERRADA"},
        headers=lider_headers,
    )
    assert resp_cierre.status_code == 200
    assert resp_cierre.json()["estado"] == "CERRADA"
    assert resp_cierre.json()["fecha_cierre"] is not None

    # 7. LIDER genera el formato
    resp_formato = client.post(
        "/api/formatos",
        json={"orden_produccion_id": orden_id},
        headers=lider_headers,
    )
    assert resp_formato.status_code == 201
    formato_id = resp_formato.json()["id"]
    assert resp_formato.json()["estado"] == "PENDIENTE"

    # 8. firmar-calidad antes de firmar-lider -> 400
    resp_calidad_antes = client.post(f"/api/formatos/{formato_id}/firmar-calidad", headers=calidad_headers)
    assert resp_calidad_antes.status_code == 400

    # 9. firmar-lider -> 200
    resp_firma_lider = client.post(f"/api/formatos/{formato_id}/firmar-lider", headers=lider_headers)
    assert resp_firma_lider.status_code == 200
    assert resp_firma_lider.json()["estado"] == "FIRMADO_LIDER"

    # 10. un LIDER ya no puede firmar calidad -> 403
    resp_calidad_lider = client.post(f"/api/formatos/{formato_id}/firmar-calidad", headers=lider_headers)
    assert resp_calidad_lider.status_code == 403

    # 11. el usuario CALIDAD firma -> 200, estado COMPLETO y calidad_id guardado
    resp_firma_calidad = client.post(f"/api/formatos/{formato_id}/firmar-calidad", headers=calidad_headers)
    assert resp_firma_calidad.status_code == 200
    assert resp_firma_calidad.json()["estado"] == "COMPLETO"
    assert resp_firma_calidad.json()["firmado_lider"] is True
    assert resp_firma_calidad.json()["firmado_calidad"] is True
    assert resp_firma_calidad.json()["calidad_id"] == calidad_id
