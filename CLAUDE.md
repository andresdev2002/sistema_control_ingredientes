# Notas del proyecto

- bcrypt debe quedar fijado en 4.0.1 por incompatibilidad con passlib 1.7.4. No actualizarlo.
- Alcance actual: el PDF del formato FO-PFTO-0057 está FUERA de alcance por ahora. Los endpoints de formatos solo manejan los datos (generar, consultar, cerrar/firmar). La generación de PDF se hace en una fase posterior.

## Stack

FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT con bcrypt.

## Estructura

`backend/app/{models,schemas,services,api,core}`. Un schema, un service y un router por entidad.

## Convenciones

- La lógica de negocio va en services, no en los routers.
- Los permisos se aplican con `require_rol(...)` desde `app/api/deps.py`. Acepta uno o varios roles: `require_rol(RolUsuario.OPERARIO, RolUsuario.LIDER)`.
- Las contraseñas nunca se devuelven en las respuestas.
- `registros_consumo` guarda campos snapshot para auditoría.
- Operaciones que tocan saldos van en una sola transacción.

## Cómo correr

Desde `backend/`:

```
./venv_wsl/bin/uvicorn app.main:app
```

## Decisiones confirmadas

- **Redondeo de peso en consumos** (CONFIRMADO con Symrise): `peso_redondeado = round(peso_capturado / 0.02) * 0.02`, paso `0.02`, modo `ROUND_HALF_UP`. La báscula solo imprime centésimas pares, así que el paso 0.02 coincide con lo que produce el equipo.
- **Firma de calidad** en `formatos_fo_pfto_0057`: la firma Camilo, con un usuario de rol `CALIDAD`. `POST /formatos/{id}/firmar-calidad` exige `rol=CALIDAD` (un LIDER recibe 403) y guarda su id en `calidad_id` (FK a `usuarios`, migración `a7c3e1d94b20`). Sigue exigiendo la firma de líder previa (400) y no permite firmar dos veces (409). Un usuario `CALIDAD` no requiere `lider_id`.

## Supuestos pendientes de confirmar con Symrise

- Un `peso_capturado` que redondea a `0.00` se rechaza (400). No está escrito en ningún lado, es una extensión de la regla general "cantidades > 0".

## Pendientes de diseño

- **Reingreso de sobrante** (saldo hijo): `saldo.saldo_padre_id` y `registro_consumo.saldo_nuevo_id` existen en el modelo para este flujo, pero quedan `NULL` siempre — el Módulo de consumos solo decrementa el saldo existente, nunca crea un saldo nuevo a partir de lo que sobra. Implementar el reingreso real (reetiquetar el sobrante con su propio código de barras) queda fuera de alcance.
- **Concurrencia real sin probar**: `with_for_update()` se usa en consumos (orden primero, saldo después, siempre en ese orden) para evitar saldos negativos bajo carrera, pero no hay ningún test con dos conexiones/transacciones reales ejecutando en paralelo — toda la suite usa una sola sesión por test. El comportamiento bajo contención real (bloqueo, orden de espera, posibles deadlocks) no está verificado empíricamente.
- **Generación de PDF** del formato FO-PFTO-0057: fuera de alcance, ver nota de arriba. `pdf_path` queda `NULL`.
- **CRLF/LF mezclados**: algunos archivos editados en esta sesión pueden tener finales de línea inconsistentes entre ediciones hechas desde Windows y desde WSL. No se normalizó; revisar con `git diff --check` o un `.gitattributes` si se vuelve un problema real.
- **Warnings `PydanticDeprecatedSince20`**: todos los schemas usan `class Config: from_attributes = True` (sintaxis Pydantic v1), que Pydantic v2 acepta pero marca como deprecada a favor de `model_config = ConfigDict(from_attributes=True)`. No se migró para no tocar más archivos de los necesarios; es un cambio cosmético sin impacto funcional.

## Endpoints existentes

Todos bajo el prefijo `/api`. "Autenticado" = cualquier usuario activo con token válido (operario, líder o calidad); "LIDER"/"CALIDAD" = requiere además ese rol.

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
| POST | `/consumos` | OPERARIO o LIDER (CALIDAD recibe 403) |
| GET | `/consumos` | Autenticado (filtro `orden_produccion_id`) |
| POST | `/formatos` | LIDER |
| GET | `/formatos` | Autenticado (filtro `orden_produccion_id`) |
| GET | `/formatos/{formato_id}` | Autenticado |
| POST | `/formatos/{formato_id}/firmar-lider` | LIDER |
| POST | `/formatos/{formato_id}/firmar-calidad` | CALIDAD |

## Frontend: reglas y decisiones

TAREA: construir el frontend del Sistema de Captura Automatizada de Ingredientes (React + MUI) que consume el backend FastAPI que ya existe y está probado (72 tests). Trabaja en la rama `frontend`. La Fase 0 (plan) ya se hizo y fue aprobada: NO la repitas.

### 1. Contexto del backend

URL: http://127.0.0.1:8000, todas las rutas bajo /api. Roles: LIDER, OPERARIO, CALIDAD. Auth: JWT Bearer (sub=documento, rol). Los decimales llegan como STRING ("25.00"). Errores: {"detail": "mensaje"} (400, 401, 403, 404, 409) o {"detail": [{loc, msg, type}]} (422). Las fechas fecha_* llegan sin zona horaria: muéstralas tal cual, como hora local.

ENDPOINTS (no inventes otros):
- POST /auth/login {documento, password} -> {access_token, token_type}
- GET /usuarios/me -> {id, nombre, documento, rol, lider_id, activo, fecha_creacion}
- GET /usuarios (LIDER) | POST /usuarios (LIDER) {nombre, documento, password, rol, lider_id?} (lider_id obligatorio solo si rol=OPERARIO) | PATCH /usuarios/{id} (LIDER) {activo}
- GET /material-maestro | POST (LIDER) {codigo_sap, descripcion, unidad_medida?} (unidad_medida opcional, "KG" por defecto) | GET /material-maestro/{codigo_sap} | PATCH /material-maestro/{codigo_sap} (LIDER) campos opcionales
- POST /recepciones (LIDER) {codigo_sap, lote_sap, lote_proveedor, fecha_vencimiento YYYY-MM-DD, cantidad_recibida, codigo_barras?} | GET /recepciones
- GET /saldos?estado=&codigo_sap= | GET /saldos/{codigo_barras} (devuelve 200 también si el saldo está AGOTADO; estado: ACTIVO o AGOTADO)
- GET /ordenes-produccion | POST (LIDER) {codigo_orden, codigo_producto_terminado?, turno_apertura "1"|"2"|"3"} | GET /ordenes-produccion/{id} | PATCH /ordenes-produccion/{id} (LIDER) parcial; para cerrar enviar SOLO {"estado":"CERRADA"}
- POST /consumos (OPERARIO o LIDER; CALIDAD recibe 403) {orden_produccion_id, codigo_barras, peso_capturado, turno "1"|"2"|"3"} -> incluye peso_capturado, peso_redondeado, cantidad_sobrante | GET /consumos?orden_produccion_id=
- POST /formatos (LIDER) {orden_produccion_id} (orden CERRADA y con consumos) | GET /formatos?orden_produccion_id= | GET /formatos/{id} | POST /formatos/{id}/firmar-lider (LIDER) | POST /formatos/{id}/firmar-calidad (solo CALIDAD; exige firma de líder previa)
- Formato: estado derivado PENDIENTE, FIRMADO_LIDER o COMPLETO; campos lider_id, calidad_id, fecha_firma_lider, fecha_firma_calidad.
- Códigos posibles: POST /consumos 404, 400, 409; POST /recepciones 404 (SAP inexistente), 409.

REGLAS DE NEGOCIO QUE LA UI REFLEJA (el backend las valida):
- La báscula solo imprime centésimas pares. El BACKEND redondea a pasos de 0.02: la UI NO calcula el redondeo; muestra peso_capturado y peso_redondeado como los devuelve el servidor.
- Consumo que deja el saldo en 0 lo pasa a AGOTADO. Saldo AGOTADO u orden CERRADA rechazan consumos (400).
- El operario consume escribiendo/escaneando el código de barras del bulto.

### 2. Reglas de alcance (no las rompas aunque parezca buena idea)

1. Trabaja SOLO en la rama `frontend`. Prohibido: git push, tocar main, git reset --hard, borrar ramas.
2. Todo el frontend vive en frontend/ en la raíz del repo. NO modifiques backend/ (modelos, alembic, tests). ÚNICA excepción: habilitar CORS en backend/app/main.py (CORSMiddleware; allow_origins leídos de la variable de entorno CORS_ORIGINS, default http://localhost:5173 y http://127.0.0.1:5173; allow_methods y allow_headers "*"; sin allow_origins=["*"]). Ese cambio va en su propio commit; luego corre pytest del backend (deben seguir 72 pasando).
3. Stack fijo: React 18 + Vite + JavaScript (sin TypeScript) + react-router-dom + @mui/material + @emotion/react + @emotion/styled + @mui/icons-material. create-vite trae React 19: fija react@18 y react-dom@18. Acepta las devDependencies de ESLint del template (necesarias para npm run lint). Usa fetch nativo (sin axios). NO instales nada más (sin Redux, Zustand, React Query, Formik, Yup, Tailwind, librerías de fechas ni de gráficos). Si crees que hace falta otra dependencia, DETENTE y pregunta.
4. NO agregues funcionalidades no pedidas: sin PDF, sin DELETE, sin cambio de contraseña, sin modo oscuro, sin i18n, sin dashboards ni gráficos, sin paginación, sin edición de usuarios más allá de activar/desactivar, sin refactors "por si acaso", sin README largo.
5. Si no estás seguro de una regla de negocio o de un campo de la API, NO la inventes: pregunta y espera. Si una respuesta del backend no coincide con lo descrito, DETENTE y avisa; no lo "arregles" del lado del frontend.
6. Variables de entorno: VITE_API_URL=http://127.0.0.1:8000/api en frontend/.env.local (gitignored) y frontend/.env.example con el mismo contenido. Nada de URLs hardcodeadas.
7. Nunca escribas contraseñas, tokens ni claves reales en código, logs o commits. Sin console.log con datos de sesión.
8. Comandos permitidos: npm install de las dependencias listadas, npm run dev, npm run build, npm run lint, pytest del backend. Prohibido: npm audit fix --force, npm update masivo, sudo, rm -rf fuera de frontend/node_modules, y cualquier cosa fuera de frontend/ salvo la excepción de CORS y CLAUDE.md. Node ya está instalado en WSL con nvm (v22, en /home/andres/.nvm): verifica con node -v y which node; si apunta a /mnt/c, DETENTE. No uses cmd.exe ni el Node de Windows.
9. Si un paso falla, máximo 2 intentos de corrección. Si sigue fallando, DETENTE y reporta el error completo y tu hipótesis.
10. Un commit local por fase. Antes de cada commit corre `git status` y confirma que no entran node_modules, dist, .env.local ni archivos del backend (salvo el commit de CORS).
11. El proyecto está en /mnt/c: configura Vite con server.host = true y server.watch.usePolling = true.

### 3. Reglas de código

Estructura obligatoria en frontend/src:
  api/ client.js + un archivo por recurso (auth, usuarios, materiales, recepciones, saldos, ordenes, consumos, formatos)
  context/ AuthContext.jsx (usuario, rol, login, logout)
  components/ Layout, ProtectedRoute, DataTable simple, ConfirmDialog, ErrorAlert, LoadingBlock
  pages/ Login, Inicio, Materiales, Recepciones, Saldos, Ordenes, OrdenDetalle, RegistrarConsumo, Consumos, Formatos, FormatoDetalle, Usuarios, NoEncontrado, SinAcceso
  utils/ formato.js (fechas y decimales para mostrar)
- client.js: agrega Authorization: Bearer <token> a toda petición autenticada; convierte errores del backend a mensajes en español (detail string tal cual; detail array 422 -> "campo: mensaje"); ante 401 con sesión activa borra la sesión y redirige a /login con aviso "Sesión expirada"; nunca deja una excepción sin capturar.
- Token en localStorage bajo una sola clave. Al cargar la app, si hay token, llama GET /usuarios/me para obtener el usuario real.
- Los 403 se muestran con el texto propio de la UI: "No tienes permiso para esta acción" (no el del backend); no rompen la pantalla. Los demás errores muestran el mensaje del backend.
- Permisos por rol (la UI oculta, el backend decide):
  · LIDER: todo.
  · OPERARIO: registrar consumo; ver órdenes, saldos, materiales, recepciones (SOLO LECTURA, sin formulario de crear), consumos y formatos (solo lectura). No ve Usuarios.
  · CALIDAD: ver formatos, órdenes y consumos; firmar calidad. NO ve Materiales, Saldos, Recepciones, Usuarios ni Registrar consumo.
- Rutas con <ProtectedRoute roles={[...]}>. Ruta desconocida -> 404 simple. Sin rol -> "Sin acceso".
- Cada pantalla maneja 4 estados: cargando, error (con botón Reintentar), vacío ("No hay registros"), con datos.
- Formularios: validación en cliente solo de lo básico (requeridos, números > 0, fecha válida) y SIEMPRE muestra el error del backend. Botón de envío deshabilitado mientras la petición está en curso. Tras éxito: limpia el formulario y muestra Snackbar.
- Decimales como string; para mostrar usa utils/formato.js (2 decimales). Sin aritmética con floats para decidir nada de negocio. El input de peso normaliza coma a punto antes de enviar.
- Fechas: dd/mm/aaaa hh:mm. fecha_vencimiento (YYYY-MM-DD): formatéala partiendo el string, sin new Date() (evita desfase de zona horaria).
- lider_id y calidad_id se muestran como ID (los no-LIDER no pueden pedir GET /usuarios). Anota en CLAUDE.md como pendiente: mostrar nombres.
- Textos de UI en español; componentes pequeños; sin duplicar lógica de fetch en las páginas; sin comentarios de relleno.
- Accesibilidad mínima: labels en todos los campos, foco inicial en el campo principal (en consumos: código de barras), Enter envía el formulario.

### 4. Fases

- FASE 1 — BASE: CLAUDE.md con estas reglas; commit de CORS en backend + pytest; proyecto Vite en frontend/ con dependencias permitidas, .env.example, .gitignore, vite.config.js; client.js, AuthContext, ProtectedRoute, Layout, páginas Login, Inicio mínima, NoEncontrado y SinAcceso; build y lint; commit "Frontend: base, login y layout".
- FASE 2 — CATÁLOGOS Y ALMACÉN: Materiales (lista; crear/editar solo LIDER), Recepciones (lista + formulario de crear solo LIDER; mostrar de forma destacada el codigo_barras devuelto con botón copiar), Saldos (filtros por estado y código SAP; chip ACTIVO/AGOTADO; detalle por código de barras). Commit "Frontend: materiales, recepciones y saldos".
- FASE 3 — ÓRDENES Y CONSUMOS: Órdenes (lista con chip de estado; crear solo LIDER con turno 1/2/3; cerrar solo LIDER con ConfirmDialog "Al cerrar no se podrán registrar más consumos"), OrdenDetalle (datos + tabla de consumos + botón "Generar formato" si CERRADA y LIDER), Consumos (lista con filtro por orden), RegistrarConsumo (OPERARIO y LIDER; selector de orden SOLO ABIERTAS; código de barras con foco inicial; al salir del campo consulta GET /saldos/{codigo} y muestra material, lote, vencimiento y cantidad disponible; si estado es AGOTADO muestra aviso y deshabilita Registrar; peso en kg; turno; tras éxito muestra peso_capturado, peso_redondeado y cantidad_sobrante del servidor y deja el formulario listo para el siguiente bulto conservando orden y turno, limpiando código y peso y devolviendo el foco al código). Commit "Frontend: ordenes y consumos".
- FASE 4 — FORMATOS Y USUARIOS: Formatos (lista con chip de estado; detalle con las dos firmas, lider_id, calidad_id y fechas; "Firmar como líder" solo LIDER si falta; "Firmar calidad" solo CALIDAD si el líder ya firmó y calidad no; ambos con ConfirmDialog porque no se deshace). Usuarios (solo LIDER: lista, crear con rol LIDER/OPERARIO/CALIDAD, lider_id obligatorio solo si OPERARIO con Select de líderes activos, activar/desactivar con ConfirmDialog, sin permitir desactivarse a sí mismo). Commit "Frontend: formatos y usuarios".
- FASE 5 — CIERRE: revisar roles en rutas y menú, sin console.log, imports sin usar ni URLs hardcodeadas; sección "Frontend" en CLAUDE.md (instalar y correr, variables, estructura, matriz de pantallas por rol, pendientes); build, lint y pytest; checklist de pruebas manuales por rol (LIDER, OPERARIO, CALIDAD) con pasos exactos. Commit "Frontend: revisión final". Sin push. Reporte corto: qué quedó, resultados, supuestos, diferencias con la API, qué falta probar en el navegador.

Ejecutar una fase por sesión/pedido y detenerse al terminarla.

### Pendientes del frontend

- Mostrar nombres en vez de ids de líder (`lider_id`) y calidad (`calidad_id`). Hoy se muestran como ID porque los usuarios no-LIDER no pueden pedir `GET /usuarios`.
