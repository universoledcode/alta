# ALTA Dashboard Operativo

Dashboard para consolidar cargas de pedidos (Dropi y Effi), calcular KPIs operativos y visualizar datos en tablas y graficas.

## Stack

- Next.js 14 + React 18 + TypeScript
- Prisma + PostgreSQL
- Recharts + Tailwind CSS

## Deploy en Netlify (recomendado si Render falla)

El repositorio tiene `netlify.toml` en la raíz con `base = "nextjs_space"` y el plugin oficial `@netlify/plugin-nextjs`.

### Antes del primer deploy (obligatorio)

1. En Netlify: **Site configuration** (o al crear el sitio) → **Environment variables** → **Add a variable**.
2. Crea **`DATABASE_URL`** con el mismo valor que usas en tu PC en `nextjs_space/.env` (cadena `postgresql://...` completa).
3. En la variable, activa los contextos que apliquen: como mínimo **"Same value for all deploy contexts"** o marca **Production** y **Deploy Previews** y **Branch deploys**, y asegurate de que Netlify la use en **builds** (en la UI suele llamarse *Scopes*: incluye build + runtime).

Sin `DATABASE_URL`, Prisma falla en el build con **P1012** (exactamente el error que viste).

### Ajustes en la UI de Netlify (muy importante)

- **Base directory**: dejalo vacio en la UI si ya usas `netlify.toml` (el archivo ya pone `base = "nextjs_space"`).
- **Publish directory**: **dejalo vacio**. No pongas `nextjs_space` ahi: con `@netlify/plugin-nextjs` la publicacion la resuelve el plugin. Si lo llenaste, edita el sitio → **Build & deploy** → **Configure** → borra "Publish directory" → guarda.

### Pasos del sitio

1. Cuenta en [Netlify](https://www.netlify.com/) → **Add new site** → **Import an existing project**.
2. Conecta GitHub y elige el repo `universoledcode/alta`.
3. Agrega variables de entorno (al menos `DATABASE_URL`; luego `ADMIN_API_TOKEN`, `ALLOW_DATA_RESET`, AWS si aplica).
4. **Deploy site** o **Trigger deploy**.

Build en Netlify ejecuta: `yarn install`, `prisma generate`, `prisma db push` (crea tablas) y `next build`.

**Nota:** `git push --force` no arregla errores de compilación en el servidor; solo reescribe historia en Git. Si el build falla, hay que ver el **log de build** (Netlify o Render) y corregir código o variables.

## Requisitos (Windows)

- Node.js 20+ (recomendado 22+)
- PowerShell
- `corepack` habilitado (viene con Node moderno)

## Configuracion inicial (Windows)

1. Abre PowerShell en la carpeta del proyecto:

```powershell
cd C:\Users\Paulina\Videos\alta_dashboard\nextjs_space
```

2. Instala dependencias con Yarn (recomendado en este repo):

```powershell
corepack yarn install
```

3. Genera Prisma Client:

```powershell
corepack yarn prisma generate
```

4. Inicia desarrollo:

```powershell
corepack yarn dev
```

Aplicacion: [http://localhost:3000](http://localhost:3000)

## Comandos utiles (Windows)

```powershell
# Desarrollo
corepack yarn dev

# Lint
corepack yarn lint

# Build de produccion
corepack yarn build

# Ejecutar produccion local
corepack yarn start

# Prisma
corepack yarn prisma generate
corepack yarn prisma studio
```

## Endpoint de salud

La app expone un endpoint simple para verificar estado general:

- URL: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- Resultado esperado:
  - `200` con `status: "ok"` cuando la app y DB estan disponibles.
  - `503` con `status: "degraded"` si falla el chequeo de DB.

## Nota sobre npm en PowerShell

Si `npm` falla por politica de ejecucion (`npm.ps1` bloqueado), usa:

```powershell
npm.cmd -v
```

Para este proyecto, se recomienda usar Yarn con `corepack`.

## Variables de entorno

Crear/editar `.env` con:

```env
DATABASE_URL="postgresql://..."
AWS_PROFILE=...
AWS_REGION=...
AWS_BUCKET_NAME=...
AWS_FOLDER_PREFIX=...

# Seguridad API
ALLOW_DATA_RESET=false
ADMIN_API_TOKEN=pon_un_token_largo_y_unico
```

## Deploy en Vercel (cuando se desbloquee la cuenta)

> Nota: el deploy automatico desde CLI quedo bloqueado por verificacion de cuenta en Vercel.  
> En cuanto se desbloquee, estos son los pasos exactos para publicarlo.

1. Sube el proyecto a GitHub.
2. En Vercel: **Add New Project** y conecta el repositorio.
3. Configura:
   - **Root Directory**: `nextjs_space`
   - **Install Command**: `corepack yarn install`
   - **Build Command**: `corepack yarn prisma generate && corepack yarn build`
   - **Output**: default de Next.js
4. En **Settings -> Environment Variables**, crea las variables de esta app (ver tabla abajo).
5. Deploy.

### Dónde poner variables en Vercel

Ruta: **Project -> Settings -> Environment Variables**

Variables requeridas:

- `DATABASE_URL`
- `AWS_PROFILE`
- `AWS_REGION`
- `AWS_BUCKET_NAME`
- `AWS_FOLDER_PREFIX`
- `ADMIN_API_TOKEN`
- `ALLOW_DATA_RESET`

Valores recomendados por entorno:

- **Preview**
  - `ALLOW_DATA_RESET=false`
  - `ADMIN_API_TOKEN` configurado (aunque no se use diario)
- **Production**
  - `ALLOW_DATA_RESET=false` por defecto
  - activar temporalmente en `true` solo si necesitas limpieza global puntual

## Editar y redeployar sin friccion

1. Editas localmente en Cursor.
2. Pruebas local:

```powershell
corepack yarn lint
corepack yarn build
```

3. `git add`, `git commit`, `git push`.
4. Vercel redeploya automaticamente al detectar el push.

Buenas practicas:
- Usa `main` para produccion.
- Usa PRs para revisar cambios antes de merge.
- Si algo falla, usa rollback desde Deployments en Vercel.

### Seguridad de APIs implementada

- Rate limiting en endpoints de API para reducir abuso.
- Validacion de fechas y paginacion en endpoints de consulta.
- Restriccion de formato en export (`csv`).
- Validacion de extension/tamano/cantidad en uploads.
- `DELETE /api/orders` protegido con:
  - `ALLOW_DATA_RESET=true`
  - Header `x-admin-token` con el valor de `ADMIN_API_TOKEN`

Ejemplo de borrado total (solo administracion):

```powershell
curl.exe -X DELETE "http://localhost:3000/api/orders" `
  -H "x-admin-token: TU_TOKEN_ADMIN"
```

## Flujo recomendado de arranque

```powershell
corepack yarn install
corepack yarn prisma generate
corepack yarn lint
corepack yarn build
corepack yarn dev
```

## Checklist de hardening (simple)

Mantiene seguridad basica sin bloquear desarrollo:

- [ ] **No subir `.env` al repositorio** (usar `.env.example` para plantilla).
- [ ] **Usar token admin largo** en `ADMIN_API_TOKEN` y rotarlo periodicamente.
- [ ] **Mantener `ALLOW_DATA_RESET=false`** por defecto; activarlo solo cuando necesites limpiar data.
- [ ] **Mantener Next.js y Prisma actualizados** (parches de seguridad).
- [ ] **Respaldar DB** antes de pruebas de carga masivas o cambios de esquema.
- [ ] **Revisar logs de errores** de endpoints (`/api/upload`, `/api/orders`, `/api/health`) al menos 1 vez por semana.

## Flujo diario recomendado (Dropi/Effi)

Para trabajar con estados que cambian todos los dias:

1. Entrar a la pestaña de carga.
2. Click en **Eliminar todos los datos y empezar de nuevo**.
3. Ingresar token admin cuando lo solicite.
4. Cargar Excels nuevos del dia.
5. Validar dashboard y exportes.

Configuracion sugerida:
- Desarrollo/local: `ALLOW_DATA_RESET=true` (si realmente borras seguido).
- Produccion: `ALLOW_DATA_RESET=false` y activarlo solo de forma temporal cuando toque recarga total.
