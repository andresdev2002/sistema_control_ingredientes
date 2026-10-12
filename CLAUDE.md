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

## Frontend

Estado: fases 1 a 5 terminadas en la rama `frontend` (sin push). React 18 + Vite + MUI, JavaScript.

### Instalar y correr

Todo desde Ubuntu (WSL), con el Node de nvm (`which node` debe apuntar a `/home/andres/.nvm/...`, nunca a `/mnt/c`).

1. Backend, desde `backend/`: `./venv_wsl/bin/uvicorn app.main:app` (puerto 8000). Reiniciarlo tras cambios en `main.py`: no corre con `--reload`.
2. Frontend, desde `frontend/`:
   - Primera vez: `cp .env.example .env.local` y `npm install`.
   - `npm run dev` y abrir http://localhost:5173.
   - Verificación: `npm run build` y `npm run lint` (el template de Vite trae **oxlint**, no ESLint).

### Variables de entorno

- `frontend/.env.local` (gitignored; plantilla en `.env.example`): `VITE_API_URL=http://127.0.0.1:8000/api`.
- Backend: `CORS_ORIGINS` (lista separada por comas). Por defecto `http://localhost:5173,http://127.0.0.1:5173`. Si el frontend se sirve desde otro origen, hay que agregarlo ahí.

### Estructura de `frontend/src`

- `api/`: `client.js` (fetch, token Bearer, errores en español, 401 → `/login` con "Sesión expirada", 403 → "No tienes permiso para esta acción"), un archivo por recurso y `useCarga.js` (hook de carga con cargando/error/recargar que usan todas las listas).
- `context/`: `AuthContext.jsx` (provider: usuario, rol, login, logout; al cargar llama `GET /usuarios/me`) y `useAuth.js` (contexto + hook; nombre distinto porque `authContext.js` choca con `AuthContext.jsx` en el disco de Windows, que no distingue mayúsculas).
- `components/`: Layout, ProtectedRoute, DataTable (maneja los 4 estados), ConfirmDialog, ErrorAlert, LoadingBlock, Mensaje (Snackbar), EstadoChip, Dato, TurnoSelect y formularios/paneles por pantalla.
- `pages/`: una por pantalla (lista de la sección 3).
- `utils/formato.js`: decimales (2 decimales, sin floats para decidir), fechas `dd/mm/aaaa hh:mm`, `fecha_vencimiento` partiendo el string, normalizar coma → punto, validaciones básicas.
- Token en `localStorage` bajo la clave `ingredientes_token`.

### Matriz de pantallas por rol

| Pantalla | Ruta | LIDER | OPERARIO | CALIDAD |
|---|---|---|---|---|
| Inicio | `/` | Sí | Sí | Sí |
| Registrar consumo | `/consumos/registrar` | Sí | Sí | No (Sin acceso) |
| Órdenes / detalle | `/ordenes`, `/ordenes/:id` | Ver, crear, cerrar, generar formato | Solo ver | Solo ver |
| Consumos | `/consumos` | Ver | Ver | Ver |
| Formatos / detalle | `/formatos`, `/formatos/:id` | Ver, firmar como líder | Solo ver | Ver, firmar calidad (si el líder ya firmó) |
| Materiales | `/materiales` | Ver, crear, editar | Solo ver | No (Sin acceso) |
| Recepciones | `/recepciones` | Ver, crear | Solo ver | No (Sin acceso) |
| Saldos | `/saldos` | Ver, filtrar, consultar | Ver, filtrar, consultar | No (Sin acceso) |
| Usuarios | `/usuarios` | Ver, crear, activar/desactivar (no a sí mismo) | No (Sin acceso) | No (Sin acceso) |

La UI oculta menú y botones; el backend es quien decide. Ruta desconocida → "Página no encontrada".

### Decisiones tomadas en la implementación

- En Registrar consumo, Enter en el campo de código de barras consulta el saldo y pasa el foco al peso (los lectores envían Enter al final); Enter en el peso envía el formulario.
- `peso_capturado` se muestra tal cual lo devuelve el servidor (sin forzar 2 decimales); los demás decimales pasan por `formatearDecimal`.
- En Recepciones el material se elige de un Select con los materiales existentes (el 404 por SAP inexistente casi no se da desde la UI, pero se muestra si llega).
- Consumos y Formatos muestran el código de la orden cruzando con `GET /ordenes-produccion`; si esa carga falla, muestran `ID n`.

### Pendientes del frontend

- Mostrar nombres en vez de ids de líder (`lider_id`) y calidad (`calidad_id`), y también de `usuario_id`, `usuario_apertura_id` y `generado_por`. Hoy se muestran como ID porque los usuarios no-LIDER no pueden pedir `GET /usuarios`.
- Sin pruebas automatizadas del frontend: solo build, lint y el checklist manual de abajo.
- Menú lateral permanente: en pantallas muy angostas (celular) ocupa espacio; no hay versión responsive.
- Generación de PDF del formato: fuera de alcance (ver arriba).

### Checklist de pruebas manuales por rol

Requisitos: backend corriendo con CORS, `npm run dev`, y al menos un usuario de cada rol (crearlos como LIDER en Usuarios).

**LIDER**
1. Login con contraseña incorrecta → "Documento o contraseña incorrectos". Login correcto → Inicio con nombre y rol en la barra; el menú muestra las 9 opciones.
2. Materiales: crear `MAT-T1` / "Prueba" → Snackbar y fila nueva con unidad KG. Crear `MAT-T1` otra vez → error 409. Editar descripción → Snackbar y fila actualizada.
3. Recepciones: registrar `MAT-T1`, lote SAP `L1`, lote prov. `P1`, vencimiento cualquiera, cantidad `10,00` → código de barras destacado; "Copiar" copia. Cantidad `0` → error de validación. Repetir un código de barras ya usado → 409.
4. Saldos: consultar el código copiado → ACTIVO, disponible 10.00. Código inexistente → "Saldo no encontrado". Filtrar por ACTIVO y por `MAT-T1`; filtro sin resultados → "No hay registros".
5. Órdenes: crear `OP-T1`, turno 1 → chip ABIERTA. Crear `OP-T1` otra vez → 409.
6. Registrar consumo: orden `OP-T1`, turno 1, escanear/escribir el código + Enter → resumen del saldo y foco en peso. Peso `4,03` + Enter → panel con capturado, redondeado y sobrante del servidor; orden y turno se conservan, código y peso vacíos, foco en código. Consumir el resto exacto del bulto (el sobrante que mostró) → sobrante 0. Volver a escanear el bulto → aviso AGOTADO y Registrar deshabilitado.
7. Órdenes: "Cerrar" en `OP-T1` → diálogo "Al cerrar no se podrán registrar más consumos" → confirmar → CERRADA; ya no aparece en el selector de Registrar consumo.
8. Detalle de `OP-T1` → tabla con los consumos → "Generar formato" → Snackbar. Repetir → 409. Crear y cerrar una orden sin consumos y generar → 400.
9. Formatos: el nuevo aparece PENDIENTE → Ver → "Firmar como líder" → confirmar → FIRMADO_LIDER con `lider_id` y fecha; el botón desaparece. No aparece "Firmar calidad".
10. Usuarios: crear CALIDAD (sin campo Líder). Crear OPERARIO sin líder → error; con líder → Snackbar. Desactivar ese operario → confirmar → Inactivo. En la fila propia no hay botón. Reactivarlo.
11. URL inventada `/xyz` → "Página no encontrada". Cerrar sesión → vuelve a `/login`.
12. Con el backend apagado, abrir cualquier lista → "No se pudo conectar con el servidor" + Reintentar; encender el backend y Reintentar → carga.

**OPERARIO**
1. Login → menú: Inicio, Registrar consumo, Órdenes, Consumos, Formatos, Materiales, Recepciones, Saldos (sin Usuarios).
2. Materiales y Recepciones: solo tabla, sin formularios ni botón Editar. Saldos: consulta y filtros funcionan.
3. Órdenes: sin formulario de crear ni botón Cerrar; detalle sin "Generar formato".
4. Registrar consumo: con una orden ABIERTA y un bulto ACTIVO, registrar un consumo → panel de resultado. Orden cerrada no aparece en el selector.
5. Formatos: ver lista y detalle, sin botones de firma.
6. Ir a `/usuarios` a mano → "Sin acceso".

**CALIDAD**
1. Login → menú: Inicio, Órdenes, Consumos, Formatos (sin Registrar consumo, Materiales, Recepciones, Saldos ni Usuarios).
2. Ir a `/saldos`, `/materiales`, `/recepciones`, `/consumos/registrar` y `/usuarios` a mano → "Sin acceso" en cada una.
3. Órdenes y Consumos: solo lectura.
4. Formatos: uno PENDIENTE → sin botones. Uno FIRMADO_LIDER → "Firmar calidad" → confirmar → COMPLETO con `calidad_id` y fecha; el botón desaparece.

**Sesión**
1. Con sesión abierta, borrar en DevTools > Application > Local Storage el valor de `ingredientes_token` y navegar a otra pantalla (o recargar) → `/login` con aviso "Sesión expirada".
2. Desactivar como LIDER a un usuario con sesión abierta en otra ventana; en esa ventana, la siguiente petición lo lleva a `/login` con "Sesión expirada".
