# Prueba técnica Full Stack
 
Repositorio con las dos partes de la prueba, en carpetas separadas:

1. Mini sistema de inventario | `Mini sistema de inventario/` | Completa |
2. RPA de consulta de antecedentes | `RPA de consulta de antecedentes/` | Pendiente (se documenta al final de este archivo) |
 
---
 
# Parte 1: Mini sistema de inventario
 
API REST con autenticación JWT, control de inventario con kardex y una interfaz web para operarlo.
 
**Stack:** NestJS 12 · TypeScript · PostgreSQL 16 · TypeORM · React 19 + Vite · Docker Compose · nginx.
 
## Estructura del repositorio
 
```
.
├── Mini sistema de inventario/
│   ├── backend/            API NestJS (Dockerfile multi-stage)
│   └── frontend/           SPA React + Vite (Dockerfile con nginx)
├── RPA de consulta de antecedentes/    (Parte 2)
├── docker-compose.yml
├── .env.example
└── README.md
```
 
### Estructura del backend
 
```
backend/src/
├── auth/          login, estrategia JWT, guard global, decorador @Public()
├── users/         entidad y búsqueda de usuarios (sin CRUD)
├── categories/    listar y crear categorías
├── products/      CRUD, paginación, filtro por categoría, stock bajo
├── movements/     entradas, salidas y kardex
├── common/        DTO de paginación, utilidades de errores de BD
├── config/        validación de variables de entorno (Joi)
└── database/      data-source, migraciones y seed
```
 
---
 
## Requisitos
 
- **Docker** y **Docker Compose v2** (incluidos en Docker Desktop).
- Puertos libres: `8080` (web), `3000` (API) y `5432` (PostgreSQL). Son configurables en el `.env`.
Para desarrollo local sin Docker, además: Node.js 22.12 o superior (se desarrolló con Node 24).
 
---
 
## Cómo levantar el proyecto completo (Docker)
 
**1. Crear el archivo de entorno.** Desde la raíz del repositorio:
 
```bash
Crear el archivo .env a partir del .env.example
```
 
**2. Construir y levantar todo:**
 
```bash
docker compose up --build
```
 
Compose arranca los servicios en orden, esperando a que cada uno esté sano:
 
1. `db`: PostgreSQL.
2. `backend`: al iniciar ejecuta las **migraciones**, luego el **seed** del usuario de prueba y por último la API.
3. `frontend`: nginx sirviendo la aplicación y reenviando `/api` al backend.
Para ejecutarlo en segundo plano usa `docker compose up --build -d` y consulta el estado con `docker compose ps`.
 
**3. Abrir la aplicación:** <http://localhost:8080>
 
**4. Iniciar sesión** con el usuario semilla, definido por `SEED_USER_EMAIL` y `SEED_USER_PASSWORD` en el `.env`. Con los valores de `.env.example`:
 
Email: `admin@test.com`
Contraseña: `Admin123!`
 
> La base de datos está vacía, solo ese usuario semllia funciona. Crea primero una categoría desde el listado de productos (campo "Nueva categoría"), luego productos y por último movimientos.
 
### Detener y reiniciar
 
```bash
docker compose down        # detiene y elimina contenedores; conserva los datos
docker compose down -v     # además elimina el volumen: la base de datos queda desde cero
```
 
> Las variables `DB_USER`, `DB_PASSWORD` y `DB_NAME` solo se aplican cuando el volumen de PostgreSQL está vacío. Si las cambias después del primer arranque, ejecuta `docker compose down -v`, puesto que se perderá ese historial.
 
### URLs
 
| Servicio | URL |
|---|---|
| Aplicación web | <http://localhost:8080> |
| API (directa) | <http://localhost:3000/api> |
| API (a través de nginx) | <http://localhost:8080/api> |
| PostgreSQL | `localhost:5432` |
 
---
 
## Variables de entorno
 
Definidas en `.env.example`. El backend valida las obligatorias al arrancar y se niega a iniciar si falta alguna, listando todas las que faltan.
 
| Variable | Descripción | Ejemplo |
|---|---|---|
| `DB_HOST` | Host de la BD. Solo se usa en desarrollo local; en Docker se fuerza a `db` | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL publicado en tu máquina | `5432` |
| `DB_USER` | Usuario de la BD | `inventory_user` |
| `DB_PASSWORD` | Contraseña de la BD | `change_me` |
| `DB_NAME` | Nombre de la BD | `inventory_db` |
| `PORT` | Puerto de la API (desarrollo local) | `3000` |
| `CORS_ORIGIN` | Origen permitido por CORS | `http://localhost:5173` |
| `JWT_SECRET` | Secreto de firma del JWT (mínimo 16 caracteres) | cadena larga aleatoria |
| `JWT_EXPIRES_IN` | Vigencia del token | `1h` |
| `SEED_USER_EMAIL` | Email del usuario semilla | `admin@test.com` |
| `SEED_USER_PASSWORD` | Contraseña del usuario semilla | `Admin123!` |
| `FRONTEND_PORT` | Puerto donde se publica la web | `8080` |
 
---
 
## Desarrollo local (sin dockerizar backend y frontend)
 
Útil para trabajar con recarga en caliente. Solo la base de datos corre en Docker.
 
```bash
# 1. Raíz: variables de entorno y base de datos
cp .env.example .env
docker compose up -d db
 
# 2. Backend
cd "Mini sistema de inventario/backend"
npm install
npm run migration:run
npm run seed
npm run start:dev          # http://localhost:3000/api
 
# 3. Frontend (en otra terminal)
cd "Mini sistema de inventario/frontend"
npm install
npm run dev                # http://localhost:5173
```
 
El servidor de desarrollo de Vite reenvía `/api` a `http://localhost:3000`. Si tienes el backend dockerizado corriendo, detenlo antes (`docker compose stop backend`) para liberar el puerto 3000.
 
### Migraciones
 
Ejecutar desde `backend/`:
 
```bash
npm run migration:generate -- src/database/migrations/NombreMigracion
npm run migration:run
npm run migration:revert
```
 
`synchronize` está desactivado: el esquema solo cambia mediante migraciones versionadas.
 
---
 
## API
 
Prefijo global `/api`. **Todos los endpoints exigen JWT** (`Authorization: Bearer <token>`), excepto el login.
 
### Autenticación
 
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Recibe `{ email, password }` y devuelve `{ accessToken, tokenType, expiresIn }`. Límite de 5 intentos por minuto por IP |
 
### Categorías
 
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/categories` | Lista las categorías ordenadas por nombre |
| POST | `/api/categories` | Crea una categoría `{ name }` |
 
### Productos
 
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/products` | Crea un producto `{ name, sku, price, categoryId }`. El stock inicial es 0 |
| GET | `/api/products?page=1&limit=10&categoryId=3` | Listado paginado con filtro opcional por categoría |
| GET | `/api/products/low-stock?threshold=10&page=1&limit=10` | Productos con `stock < threshold` (umbral por defecto: 10) |
| GET | `/api/products/:id` | Detalle de un producto |
| PATCH | `/api/products/:id` | Actualización parcial. No acepta `stock` |
| DELETE | `/api/products/:id` | Elimina un producto sin movimientos |
 
Respuesta de los listados:
 
```json
{
  "data": [ ... ],
  "meta": { "total": 25, "page": 1, "limit": 10, "totalPages": 3 }
}
```
 
`limit` admite un máximo de 100.
 
### Movimientos y kardex
 
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/movements` | Registra una entrada o salida `{ productId, type: "IN" \| "OUT", quantity, note? }`. Devuelve el movimiento y `stockAfter` |
| GET | `/api/products/:productId/kardex?page=1&limit=10` | Historial del producto con saldo acumulado por movimiento |
 
### Códigos HTTP
 
| Código | Cuándo |
|---|---|
| 200 / 201 / 204 | Éxito (204 al eliminar) |
| 400 | Datos inválidos, campos no permitidos o parámetros mal formados |
| 401 | Sin token, token inválido o vencido, credenciales incorrectas |
| 404 | Producto o categoría inexistente |
| 409 | SKU o nombre de categoría duplicado; eliminar un producto con movimientos |
| 422 | Salida que dejaría el stock en negativo, o entrada que excede el máximo |
| 429 | Demasiadas peticiones (límite general y límite del login) |
 
### Ejemplo rápido con curl
 
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
 
curl -s http://localhost:8080/api/products -H "Authorization: Bearer $TOKEN"
```
 
---
 
## Modelo de datos
 
| Tabla | Campos principales | Restricciones |
|---|---|---|
| `categories` | `id`, `name` | `name` único |
| `products` | `id`, `name`, `sku`, `price numeric(12,2)`, `stock`, `category_id`, fechas | `sku` único; `CHECK (stock >= 0)`; `CHECK (price >= 0)`; FK a categoría con `ON DELETE RESTRICT` |
| `movements` | `id`, `product_id`, `type` (enum `IN`/`OUT`), `quantity`, `created_at`, `note` | `CHECK (quantity > 0)`; FK a producto con `ON DELETE RESTRICT`; índice `(product_id, created_at)` |
| `users` | `id`, `email`, `password_hash` | `email` único |
 
**Invariante central:** el stock de un producto es siempre la suma de sus movimientos (entradas menos salidas). Puede verificarse con:
 
```sql
SELECT p.id, p.stock,
       COALESCE(SUM(CASE WHEN m.type = 'IN' THEN m.quantity ELSE -m.quantity END), 0) AS kardex
FROM products p
LEFT JOIN movements m ON m.product_id = p.id
GROUP BY p.id ORDER BY p.id;
```
 
---
 
## Cómo comprobar la consistencia con concurrencia
 
Con un producto de stock exactamente 5 (por ejemplo `productId` 2), se lanzan 10 salidas simultáneas de 1 unidad:
 
```bash
( for i in $(seq 1 10); do
    curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8080/api/movements \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      -d '{"productId":2,"type":"OUT","quantity":1}' &
  done; wait ) | sort | uniq -c
```
 
Resultado esperado: **5 respuestas `201` y 5 respuestas `422`**, con stock final 0.
 
---
 
# Parte 2: RPA de consulta de antecedentes

RPA en Python que lee un Excel con cédulas, las valida, elimina duplicadas, las consulta en un servicio y genera un reporte Excel.

> **Servicio simulado y datos ficticios.** Tal como indica el enunciado, la prueba usa un servicio simulado (`mock_service/`). El cliente HTTP apunta a una URL configurable (`SERVICE_URL`) y espera el contrato descrito más abajo. No se implementó ninguna automatización contra el sitio real de la Procuraduría: las consultas reales de antecedentes requieren autorización del titular y el uso de canales oficiales, y ese sitio no expone una API con este contrato.

**Stack:** Python 3.12 · pandas + openpyxl · requests · logging · Docker.

## Ejecución con Docker

Los servicios del RPA (`mock` y `rpa`) usan el perfil `rpa`, por lo que **no se levantan con `docker compose up`** y no interfieren con el sistema de inventario (no publican puertos, se comunican por la red interna `http://mock:8000`). Una sola imagen sirve para el RPA, el servicio simulado y los tests, cambiando el `entrypoint`. No se usa `venv` en Docker: las dependencias se instalan en la imagen vía `requirements.txt`.

Todos los comandos se ejecutan desde la raíz del repositorio. En **Git Bash** antepón `MSYS_NO_PATHCONV=1` a los comandos que lleven rutas `/data` o `/logs`, para que Git Bash no convierta `/data/...` en `C:/Program Files/Git/data/...` (en PowerShell/CMD se omite el prefijo).

```bash
# 0. (Solo si hubo intentos fallidos) limpieza del perfil rpa
docker compose --profile rpa down --rmi local --volumes
# Borra contenedores, red e imágenes locales rpa/mock. No toca data/logs ni al inventario en ejecución.

# 1. Construir las imágenes (instala pandas, openpyxl, requests, pytest)
docker compose --profile rpa build

# 2. Generar el Excel de ejemplo (12 cédulas que cubren todos los casos)
MSYS_NO_PATHCONV=1 docker compose --profile rpa run --rm --entrypoint python rpa make_sample.py /data/cedulas.xlsx
# Reutiliza la imagen rpa para correr otro script. Escribe en RPA.../data/cedulas.xlsx vía el volumen /data.
# Si tienes tu propio Excel (con columna `cedula`), reemplaza data/cedulas.xlsx y omite este paso.

# 3. Ejecutar el RPA (levanta el mock automáticamente y espera a que esté sano)
MSYS_NO_PATHCONV=1 docker compose --profile rpa run --rm rpa
# Lee /data/cedulas.xlsx, valida, deduplica, consulta http://mock:8000 con reintentos
# y escribe el reporte + log. --rm borra el contenedor rpa al terminar.

# 4. Pruebas (31 tests dentro del contenedor, sin Python local)
MSYS_NO_PATHCONV=1 docker compose --profile rpa run --rm --entrypoint pytest rpa
# Para detalle: ... --entrypoint pytest rpa -v

# 5. Apagar mock y red
docker compose --profile rpa down
```

Resultados en la carpeta del RPA: `data/reporte_antecedentes.xlsx` y `logs/rpa.log`.
Variantes: `docker compose --profile rpa run --rm rpa --help` muestra `--input/--url/--retries/...`; p. ej. `... run --rm rpa --input /data/otro.xlsx --output /data/otro_reporte.xlsx`. Para varias corridas deja el mock en fondo con `docker compose --profile rpa up -d mock` y repite el paso 3.

## Ejecución local (sin Docker)

```bash
cd "RPA de consulta de antecedentes"
pip install -r requirements.txt
python -m mock_service.app &          # servicio simulado en :8000
python make_sample.py
python -m rpa.main                    # opciones: python -m rpa.main --help
python -m pytest
```

| Opción | Variable de entorno | Por defecto |
|---|---|---|
| `--input` | | `data/cedulas.xlsx` |
| `--output` | | `data/reporte_antecedentes.xlsx` |
| `--url` | `SERVICE_URL` | `http://localhost:8000` |
| `--retries` | `MAX_RETRIES` | `3` |
| `--backoff` | `BACKOFF_BASE` | `1.0` s |
| `--timeout` | `REQUEST_TIMEOUT` | `10` s |
| `--log-file` | | `logs/rpa.log` |

Código de salida: `0` si el proceso terminó (aunque haya cédulas con error), `1` si el archivo de entrada no existe, no se puede leer o no tiene la columna `cedula`, o si no se puede escribir el reporte.

## Contrato del servicio

`GET {SERVICE_URL}/consulta?cedula=N`

| Respuesta | Interpretación |
|---|---|
| `200 {"nombres", "antecedentes": bool, "detalle"?}` | `limpio` o `con antecedentes` |
| `404` | `no encontrado` (sin reintentos) |
| `5xx`, `429`, error de conexión o timeout | transitorio: se reintenta |
| Otro `4xx`, o `200` con formato inválido | `error` (sin reintentos) |

El servicio simulado decide según el último dígito de la cédula: `0` con antecedentes, `9` no encontrada, `5` falla dos veces con 503 y luego responde (demuestra los reintentos), `3` siempre 503 (servicio caído), cualquier otro: limpio.

## Reporte y log

`reporte_antecedentes.xlsx` tiene las columnas `cedula, nombres, estado, detalle, fecha_consulta`. Los estados son `limpio`, `con antecedentes`, `no encontrado` y `error`. Las cédulas inválidas **no se consultan**, pero aparecen en el reporte con estado `error` y el motivo en `detalle`, para que nada se pierda en silencio.

El log (consola y archivo) lleva marca de tiempo, nivel y módulo. Registra el resumen de la entrada, cada reintento (con la espera aplicada), el resultado de cada cédula y cada cédula descartada. Al final se imprime en consola el resumen: total, limpios, con antecedentes, no encontrados y errores.