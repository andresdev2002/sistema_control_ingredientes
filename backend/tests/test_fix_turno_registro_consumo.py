"""Regresión del fix de values_callable en TurnoTipo para registro_consumo.turno.

A nivel de modelo (sin pasar por API): el endpoint de consumos es el Módulo 3,
todavía no existe. Esta prueba solo confirma que la serialización del enum
(.value en vez de .name) funciona para los 3 turnos al insertar y leer.
"""

from decimal import Decimal

from app.models.orden_produccion import OrdenProduccion
from app.models.recepcion import Recepcion
from app.models.registro_consumo import RegistroConsumo
from app.models.saldo import Saldo


def test_crear_y_leer_registro_consumo_con_cada_valor_de_turno(db_session, lider, material):
    orden = OrdenProduccion(
        codigo_orden="TEST-ORD-CONSUMO-TURNO",
        turno_apertura="1",
        usuario_apertura_id=lider.id,
    )
    db_session.add(orden)
    db_session.flush()

    for turno in ["1", "2", "3"]:
        recepcion = Recepcion(
            codigo_sap=material.codigo_sap,
            lote_sap="TEST-LOTE",
            lote_proveedor="TEST-LOTE-PROV",
            fecha_vencimiento="2099-01-01",
            cantidad_recibida=Decimal("10.00"),
            codigo_barras=f"TEST-CB-TURNO-{turno}",
            usuario_id=lider.id,
        )
        db_session.add(recepcion)
        db_session.flush()

        saldo = Saldo(
            codigo_barras=f"TEST-CB-TURNO-{turno}",
            codigo_sap=material.codigo_sap,
            lote_sap="TEST-LOTE",
            lote_proveedor="TEST-LOTE-PROV",
            fecha_vencimiento="2099-01-01",
            cantidad_disponible=Decimal("10.00"),
            origen_recepcion_id=recepcion.id,
        )
        db_session.add(saldo)
        db_session.flush()

        registro = RegistroConsumo(
            orden_produccion_id=orden.id,
            saldo_id=saldo.id,
            codigo_sap=material.codigo_sap,
            lote_sap="TEST-LOTE",
            lote_proveedor="TEST-LOTE-PROV",
            fecha_vencimiento="2099-01-01",
            cantidad_disponible_antes=Decimal("10.00"),
            peso_capturado=Decimal("5.00"),
            peso_redondeado=Decimal("5.00"),
            cantidad_sobrante=Decimal("5.00"),
            usuario_id=lider.id,
            turno=turno,
        )
        db_session.add(registro)
        db_session.flush()
        db_session.refresh(registro)

        assert registro.turno == turno
