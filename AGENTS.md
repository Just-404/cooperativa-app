# AGENTS.md — Cooperativa App

## Project Overview
Monorepo with separate **client/** (React + Vite) and **server/** (Node/Express + Sequelize/PostgreSQL) packages. No root package.json — each subdirectory is independent.

---

## Key Commands

### Backend (server/)
```bash
cd server
cp .env.example .env   # edit DB creds & JWT_SECRET
npm install
npm run seed           # creates admin user + loan type catalog
npm run dev            # nodemon, auto-syncs tables (alter: true in dev)
npm start              # production
npm test               # jest (no tests yet)
```

### Frontend (client/)
```bash
cd client
cp .env.example .env   # VITE_API_URL if needed
npm install
npm run dev            # Vite on :5173, proxies /api → localhost:4000
npm run build          # production build
npm run preview        # preview build
```

### Docker (optional)
```bash
docker compose up --build   # db:5432, server:4000, client:5173
```

---

## Architecture Notes

### Server Structure (server/src/)
| Directory | Purpose |
|-----------|---------|
| `config/` | `env.js` (dotenv), `db.js` (Sequelize instance) |
| `models/` | Sequelize models + associations in `index.js` |
| `controllers/` | Thin handlers → call services |
| `services/` | Business logic, DB transactions |
| `routes/` | Express routers, middleware chains per module |
| `middlewares/` | `auth` (JWT), `roles`, `validate` (express-validator), `auditoria`, `error` |
| `validators/` | (empty — validators inline in routes) |

### Auth & Roles
- JWT in `Authorization: Bearer <token>` header
- Roles: `administrador`, `cajero`, `oficial_credito`, `gerente`, `auditor`
- `authMiddleware` attaches `req.user = { id, email, rol, ... }`
- `checkRole(...roles)` middleware gates endpoints

### Route Pattern (every module)
```
GET    /api/<module>          # list (auth)
GET    /api/<module>/:id      # get one (auth)
POST   /api/<module>          # create (auth + role + validation + auditoria)
PUT    /api/<module>/:id      # update (auth + role + validation + auditoria)
PATCH  /api/<module>/:id/estado # state change (auth + role + validation + auditoria)
DELETE /api/<module>/:id      # delete (auth + admin role + auditoria)
```
Validation uses `express-validator` → `validate` middleware returns 400 with `details`.

### Database
- PostgreSQL via Sequelize v6
- Auto-sync on server start: `sequelize.sync({ alter: env.nodeEnv !== 'production' })`
- Seed (`npm run seed`) creates:
  - Admin: `admin@cooperativa.com` / `Admin123!` (change immediately)
  - 3 loan types: personal, hipotecario, comercial
- Migrations in `server/migrations/` (e.g., `20261018-add-inactive-savings-account-state.sql`)

### Frontend Structure (client/src/)
| Path | Purpose |
|------|---------|
| `features/<module>/` | Pages + services per domain (socios, prestamos, cuentas-ahorro, etc.) |
| `context/AuthContext.jsx` | JWT login/logout, stores user in localStorage |
| `services/apiClient.js` | Axios instance with baseURL + auth interceptor |
| `components/common/` | ProtectedRoute, Paginacion, EstadoTag, ConfirmacionModal |
| `hooks/usePaginacion.js` | Reusable pagination logic |
| `styles/` | CSS modules organized by base/components/features/pages |

### API Proxy
Vite dev server proxies `/api` → `http://localhost:4000` (see `vite.config.js`).

---

## Common Gotchas

1. **No .env.example files exist** — create manually from README or `env.js` keys:
   - Server: `PORT`, `NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN`
   - Client: `VITE_API_URL` (optional, defaults to proxy)

2. **Sequelize `alter: true` in dev** — schema changes auto-applied on restart. In production, use migrations.

3. **No test suite yet** — `jest` installed but no test files. Add tests under `__tests__/` or `*.test.js`.

4. **Roles are strings** — compare exactly (`'administrador'`, not `'admin'`).

5. **Auditoría middleware** logs actions to `Auditoria` table; include on mutating routes.

6. **Client uses React 19** — ensure compatibility if adding libraries.

7. **Express 5** — uses native Promise-based route handlers (no `next(err)` wrapper needed but used for consistency).

---

## Useful Files to Reference
- `server/src/models/index.js` — all model associations
- `server/src/routes/index.js` — full API route map
- `server/src/seed.js` — initial data
- `client/src/services/apiClient.js` — API client setup
- `client/src/context/AuthContext.jsx` — auth flow