# Plataforma Digital para Votaciones Estudiantiles - Backend

API REST para la gestion de elecciones estudiantiles con voto anonimo, desarrollada con **Express.js** y **Supabase (PostgreSQL)**.

## Arquitectura

```
src/
├── config/
│   └── supabase.js              # Cliente Supabase
├── database/
│   └── migration.sql            # Schema completo + seed
├── middleware/
│   ├── auth.js                  # JWT admin + Supabase Auth votantes
│   ├── authorize.js             # Control de roles
│   ├── validate.js              # Validacion de request body
│   └── errorHandler.js          # Manejo centralizado de errores
├── utils/
│   └── responseHelper.js        # Formato estandar de respuestas
├── controllers/                 # Capa HTTP
├── services/                    # Logica de negocio
├── routes/                      # Definicion de endpoints
└── app.js                       # Configuracion Express
```

**Patron:** Routes → Controllers → Services → Supabase

## Requisitos previos

- Node.js >= 18
- Cuenta de Supabase con proyecto creado

## Instalacion

```bash
git clone <repo-url>
cd ProyectoGraduacionQ12026-backend-prueba
npm install
```

## Configuracion

Crear archivo `.env` en la raiz:

```env
PORT=3000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_service_role_key
JWT_SECRET=tu_secreto_jwt_seguro
```

> **Importante:** `SUPABASE_KEY` debe ser la **service_role key** (no la anon key) para poder crear usuarios con `auth.admin`.

## Base de datos

Ejecutar el contenido de `src/database/migration.sql` en el **SQL Editor** de Supabase. Esto crea:

- Todas las tablas (admin, organization, voter_profile, election, position, candidate, candidate_in_position, election_voter, ballot, ballot_vote)
- Indices de rendimiento
- Vistas para reportes (v_results_by_position, v_participation, v_blank_votes)
- Admin master seed: `admin@elecciones.edu` / `admin123`

## Ejecucion

```bash
# Desarrollo (hot reload)
npm run dev

# Produccion
npm start
```

## Modelo de datos

```
organization ──< election ──< position ──< candidate_in_position >── candidate
                    │                                                     │
                    │                                                     │
               election_voter                                       organization
                    │
               voter_profile ── auth.users (Supabase Auth)

election ──< ballot ──< ballot_vote >── position
                              │
                    candidate_in_position
```

**Anonimato estructural:** La tabla `ballot` NO tiene referencia al votante. `election_voter` solo registra si ya voto, sin vincularlo a su boleta.

## API Endpoints

### Autenticacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/auth/login` | Login admin (JWT custom) |
| POST | `/api/auth/login-voter` | Login votante (Supabase Auth) |
| GET | `/api/auth/profile` | Perfil del admin autenticado |
| PUT | `/api/auth/profile` | Actualizar perfil |
| PUT | `/api/auth/change-password` | Cambiar contrasena |

### Administradores (solo admin_master)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/admins` | Listar administradores |
| GET | `/api/admins/:id` | Detalle de administrador |
| POST | `/api/admins` | Crear administrador |
| PUT | `/api/admins/:id` | Editar administrador |
| PUT | `/api/admins/:id/deactivate` | Desactivar cuenta |
| DELETE | `/api/admins/:id` | Eliminar administrador |

### Organizaciones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/organizations` | Listar organizaciones |
| GET | `/api/organizations/:id` | Detalle |
| POST | `/api/organizations` | Crear (name, code) |
| PUT | `/api/organizations/:id` | Editar |
| DELETE | `/api/organizations/:id` | Eliminar (solo admin_master) |

### Elecciones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/elections` | Listar (`?status=draft&search=&organization_id=`) |
| GET | `/api/elections/:id` | Detalle |
| POST | `/api/elections` | Crear (Paso 1: config basica) |
| PUT | `/api/elections/:id` | Editar |
| DELETE | `/api/elections/:id` | Eliminar (no si esta abierta) |
| POST | `/api/elections/:id/duplicate` | Duplicar como borrador |
| PUT | `/api/elections/:id/open` | Abrir votacion (valida completitud) |
| PUT | `/api/elections/:id/close` | Cerrar votacion |
| PUT | `/api/elections/:id/reopen` | Reabrir como borrador |
| GET | `/api/elections/:id/results` | Resultados con porcentajes |
| GET | `/api/elections/:id/validate` | Validar si esta lista (Paso 5) |

### Cargos / Posiciones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/positions/election/:electionId` | Listar por eleccion (con candidatos) |
| GET | `/api/positions/:id` | Detalle |
| POST | `/api/positions/election/:electionId` | Crear cargo |
| PUT | `/api/positions/:id` | Editar |
| DELETE | `/api/positions/:id` | Eliminar |
| POST | `/api/positions/:positionId/candidates` | Asignar candidato al cargo |
| DELETE | `/api/positions/candidates/:cipId` | Remover candidato del cargo |

### Candidatos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/candidates` | Listar (`?organization_id=&search=`) |
| GET | `/api/candidates/:id` | Detalle |
| POST | `/api/candidates` | Crear |
| POST | `/api/candidates/import` | Importar lote |
| PUT | `/api/candidates/:id` | Editar |
| DELETE | `/api/candidates/:id` | Eliminar |

### Votantes

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/voters/profiles` | Listar perfiles |
| GET | `/api/voters/profiles/:id` | Detalle perfil |
| POST | `/api/voters/profiles` | Crear (crea usuario Supabase Auth) |
| PUT | `/api/voters/profiles/:id` | Editar perfil |
| DELETE | `/api/voters/profiles/:id` | Eliminar (tambien en Auth) |
| GET | `/api/voters/election/:electionId` | Votantes habilitados en eleccion |
| POST | `/api/voters/election/:electionId` | Habilitar votante |
| POST | `/api/voters/election/:electionId/bulk` | Habilitar varios |
| DELETE | `/api/voters/:id` | Deshabilitar votante |

### Flujo de votacion (autenticacion Supabase Auth)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/vote/elections` | Elecciones disponibles para el votante |
| GET | `/api/vote/elections/:electionId/ballot` | Boleta (posiciones + candidatos) |
| POST | `/api/vote/elections/:electionId/cast` | Emitir voto |
| GET | `/api/vote/elections/:electionId/status` | Estado del voto |

#### Ejemplo: emitir voto

```json
POST /api/vote/elections/:electionId/cast
{
  "votes": [
    {
      "position_id": "uuid-del-cargo",
      "candidate_in_position_id": "uuid-del-candidato-en-posicion",
      "is_blank": false
    },
    {
      "position_id": "uuid-otro-cargo",
      "candidate_in_position_id": null,
      "is_blank": true
    }
  ]
}
```

## Formato de respuesta

Todas las respuestas siguen este formato:

```json
{
  "success": true,
  "message": "OK",
  "data": { ... }
}
```

Errores:

```json
{
  "success": false,
  "message": "Descripcion del error"
}
```

## Flujo de creacion de eleccion

1. **Paso 1 - Config basica:** `POST /api/elections` (title, description, dates, organization)
2. **Paso 2 - Cargos:** `POST /api/positions/election/:id` (crear cargos como Presidente, Secretario)
3. **Paso 3 - Candidatos:** `POST /api/candidates` + `POST /api/positions/:id/candidates` (crear y asignar)
4. **Paso 4 - Votantes:** `POST /api/voters/profiles` + `POST /api/voters/election/:id` (crear y habilitar)
5. **Paso 5 - Validacion:** `GET /api/elections/:id/validate` (verificar completitud)
6. **Activar:** `PUT /api/elections/:id/open` (valida automaticamente antes de abrir)

## Roles

| Rol | Permisos |
|-----|----------|
| `admin_master` | Todo + gestion de admins + eliminar organizaciones |
| `admin` | CRUD elecciones, organizaciones, candidatos, votantes |
| `voter` (Supabase Auth) | Ver boleta, emitir voto |

## Tecnologias

- **Runtime:** Node.js
- **Framework:** Express.js v5
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticacion admin:** bcryptjs + jsonwebtoken
- **Autenticacion votante:** Supabase Auth
