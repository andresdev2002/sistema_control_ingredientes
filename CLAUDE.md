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

## Pendiente de diseño

- Firma de "calidad" en `formatos_fo_pfto_0057`: el modelo no tiene rol `CALIDAD` ni un campo para registrar quién firmó esa parte (solo `firmado_calidad` + `fecha_firma_calidad`, sin FK a usuario). Por decisión de negocio temporal, hoy la marca cualquier `LIDER` activo, igual que la firma de líder, pero sin guardar su identidad. Si se agrega un rol `CALIDAD` real, esto requerirá tocar el modelo (`lider_id`-equivalente para calidad) y una migración.

## Endpoints existentes

- `POST /api/auth/login` (público)
