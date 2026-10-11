# Notas del proyecto

- bcrypt debe quedar fijado en 4.0.1 por incompatibilidad con passlib 1.7.4. No actualizarlo.
- Alcance actual: el PDF del formato FO-PFTO-0057 está FUERA de alcance por ahora. Los endpoints de formatos solo manejan los datos (generar, consultar, cerrar/firmar). La generación de PDF se hace en una fase posterior.

## Stack

FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT con bcrypt.

## Estructura

`backend/app/{models,schemas,services,api,core}`. Un schema, un service y un router por entidad.

## Convenciones

- La lógica de negocio va en services, no en los routers.
- Los permisos se aplican con `require_rol(...)` desde `app/api/deps.py`.
- Las contraseñas nunca se devuelven en las respuestas.
- `registros_consumo` guarda campos snapshot para auditoría.
- Operaciones que tocan saldos van en una sola transacción.

## Cómo correr

Desde `backend/`:

```
./venv_wsl/bin/uvicorn app.main:app
```

## Supuestos pendientes de confirmar con Symrise

- **Redondeo de peso en consumos**: `peso_redondeado = round(peso_capturado / 0.02) * 0.02`, con modo `ROUND_HALF_UP` y paso `0.02`. El paso y la forma de la fórmula salen del comentario en `app/models/registro_consumo.py`, pero el **modo de redondeo en empates fue supuesto** (Python's `round()` nativo usa banker's rounding, no se usó). También se supuso que un `peso_capturado` que redondea a `0.00` debe rechazarse (400) — no está escrito en ningún lado, es una extensión de la regla general "cantidades > 0".
- **Firma de calidad** en `formatos_fo_pfto_0057`: la marca cualquier `LIDER` activo, sin registrar quién (el modelo no tiene rol `CALIDAD` ni un campo `calidad_id`). Decisión de negocio temporal, confirmada por el usuario para esta fase, pero sigue pendiente de validar si Symrise requiere un rol o identidad real para esta firma.

## Pendientes de diseño

- Firma de "calidad" en `formatos_fo_pfto_0057`: el modelo no tiene rol `CALIDAD` ni un campo para registrar quién firmó esa parte (solo `firmado_calidad` + `fecha_firma_calidad`, sin FK a usuario). Por decisión de negocio temporal, hoy la marca cualquier `LIDER` activo, igual que la firma de líder, pero sin guardar su identidad. Si se agrega un rol `CALIDAD` real, esto requerirá tocar el modelo (`lider_id`-equivalente para calidad) y una migración.
- **Reingreso de sobrante** (saldo hijo): `saldo.saldo_padre_id` y `registro_consumo.saldo_nuevo_id` existen en el modelo para este flujo, pero quedan `NULL` siempre — el Módulo de consumos solo decrementa el saldo existente, nunca crea un saldo nuevo a partir de lo que sobra. Implementar el reingreso real (reetiquetar el sobrante con su propio código de barras) queda fuera de alcance.
- **Concurrencia real sin probar**: `with_for_update()` se usa en consumos (orden primero, saldo después, siempre en ese orden) para evitar saldos negativos bajo carrera, pero no hay ningún test con dos conexiones/transacciones reales ejecutando en paralelo — toda la suite usa una sola sesión por test. El comportamiento bajo contención real (bloqueo, orden de espera, posibles deadlocks) no está verificado empíricamente.
- **Generación de PDF** del formato FO-PFTO-0057: fuera de alcance, ver nota de arriba. `pdf_path` queda `NULL`.
- **CRLF/LF mezclados**: algunos archivos editados en esta sesión pueden tener finales de línea inconsistentes entre ediciones hechas desde Windows y desde WSL. No se normalizó; revisar con `git diff --check` o un `.gitattributes` si se vuelve un problema real.
- **Warnings `PydanticDeprecatedSince20`**: todos los schemas usan `class Config: from_attributes = True` (sintaxis Pydantic v1), que Pydantic v2 acepta pero marca como deprecada a favor de `model_config = ConfigDict(from_attributes=True)`. No se migró para no tocar más archivos de los necesarios; es un cambio cosmético sin impacto funcional.

## Endpoints existentes

Todos bajo el prefijo `/api`. "Autenticado" = cualquier usuario activo con token válido (operario o líder); "LIDER" = requiere además `rol=LIDER`.

| Método | Ruta | Rol permitido |
|---|---|---|
| POST | `/auth/login` | Público |
| POST | `/usuarios` | LIDER |
| GET | `/usuarios` | LIDER |
| GET | `/usuarios/me` | Autenticado |
| PATCH | `/usuarios/{usuario_id}` | LIDER |
| POST | `/material-maestro` | LIDER |
| GET | `/material-maestro` | Autenticado |
| GET | `/material-maestro/{codigo_sap}` | Autenticado |
| PATCH | `/material-maestro/{codigo_sap}` | LIDER |
| POST | `/recepciones` | LIDER |
| GET | `/recepciones` | Autenticado |
| GET | `/saldos` | Autenticado (filtros `estado`, `codigo_sap`) |
| GET | `/saldos/{codigo_barras}` | Autenticado |
| POST | `/ordenes-produccion` | LIDER |
| GET | `/ordenes-produccion` | Autenticado |
| GET | `/ordenes-produccion/{orden_id}` | Autenticado |
| PATCH | `/ordenes-produccion/{orden_id}` | LIDER |
| POST | `/consumos` | Autenticado (operario o líder) |
| GET | `/consumos` | Autenticado (filtro `orden_produccion_id`) |
| POST | `/formatos` | LIDER |
| GET | `/formatos` | Autenticado (filtro `orden_produccion_id`) |
| GET | `/formatos/{formato_id}` | Autenticado |
| POST | `/formatos/{formato_id}/firmar-lider` | LIDER |
| POST | `/formatos/{formato_id}/firmar-calidad` | LIDER |
