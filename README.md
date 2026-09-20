# Sistema de Gestión de Cooperativa de Ahorros y Préstamos

Sistema web para que una cooperativa administre digitalmente a sus socios, cuentas de
ahorro, operaciones financieras y préstamos.

## Stack tecnológico

- **Frontend:** React + Vite, React Router, Axios
- **Backend:** Node.js + Express, dotenv, cors
- **Base de datos:** PostgreSQL vía Sequelize
- **Seguridad:** JSON Web Tokens (jsonwebtoken), bcryptjs, express-validator
- **Desarrollo:** nodemon

## Estructura del proyecto

```
cooperativa-app/
├── client/          # Frontend en React (Vite)
│   └── src/
│       ├── components/   # Componentes reutilizables
│       ├── context/      # AuthContext (login/logout con JWT)
│       ├── features/     # Un módulo por cada entregable del alcance
│       ├── hooks/
│       ├── pages/
│       ├── routes/        # React Router
│       ├── services/      # Cliente Axios hacia la API
│       └── utils/
├── server/          # Backend en Node/Express
│   └── src/
│       ├── config/         # env y conexión Sequelize/Postgres
│       ├── controllers/    # Un controller por módulo
│       ├── middlewares/    # auth (jwt), roles, auditoría, validate, errores
│       ├── models/         # Entidades Sequelize (Usuario usa bcryptjs)
│       ├── routes/         # Un router por módulo
│       ├── services/       # Lógica de negocio
│       └── validators/     # Reglas con express-validator
├── docs/            # Documentación del proyecto
└── docker-compose.yml
```

## Módulos actuales

1. Gestión de socios
2. Gestión de cuentas de ahorro
3. Depósitos y retiros
4. Solicitudes de préstamos
5. Evaluación de préstamos
6. Aprobación
7. Desembolso
8. Cuotas e intereses
9. Pagos y mora
10. Usuarios y roles
11. Auditoría
12. Reportes
13. Scoring crediticio

Fuera de alcance: transferencias bancarias reales, pagos con tarjetas de débito/crédito,
aplicación móvil, nómina de empleados, cajeros automáticos y contabilidad de la cooperativa.

## Cómo empezar

### Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

### Con Docker
```bash
docker compose up --build
```