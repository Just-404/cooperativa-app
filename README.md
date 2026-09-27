# Sistema de Gestión de Cooperativa de Ahorros y Préstamos

Sistema web para que una cooperativa administre digitalmente a sus socios, cuentas de
ahorro, operaciones financieras y préstamos.

Basado en el documento `docs/Alcance_del_proyecto.docx`.

## Stack tecnológico (limitado a lo autorizado)

- **Frontend:** React + Vite, React Router, Axios
- **Backend:** Node.js + Express, dotenv, cors
- **Base de datos:** PostgreSQL vía Sequelize
- **Seguridad:** JSON Web Tokens (jsonwebtoken), bcryptjs, express-validator
- **Desarrollo:** nodemon

No se usan otras dependencias fuera de esta lista (sin helmet, morgan, node-cron, etc.)
para mantener la superficie de vulnerabilidades al mínimo.

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

## Módulos (según el alcance del proyecto)

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
cp .env.example .env    # ajusta credenciales de tu PostgreSQL local
npm install
npm run seed             # crea el usuario administrador y catálogo de tipos de préstamo
npm run dev
```
El primer arranque (`npm run dev` o `npm start`) sincroniza automáticamente las tablas en
PostgreSQL a partir de los modelos Sequelize.

**Usuario administrador inicial** (creado por `npm run seed`):
- Email: `admin@cooperativa.com`
- Contraseña: `Admin123!`

Cámbiala apenas entres al sistema.

### Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

### Con Docker (opcional)
```bash
docker compose up --build
```

## Estado actual del sistema

Ya implementado y probado de punta a punta (login → socio → cuenta → depósito/retiro →
solicitud de préstamo → evaluación → aprobación → desembolso con generación automática de
cuotas → pago → cierre del préstamo):

- Autenticación con JWT y bcryptjs, control de acceso por rol en cada endpoint.
- CRUD de socios y apertura de cuentas de ahorro.
- Depósitos y retiros con actualización transaccional de saldo.
- Ciclo completo de préstamos: solicitud, evaluación, aprobación/rechazo, desembolso,
  generación de cuotas (amortización simple) y registro de pagos.
- Cálculo de mora por cuota vencida (`POST /api/pagos/calcular-mora`, pensado para
  dispararse desde un cron externo al proceso Node).
- Scoring crediticio simplificado basado en historial de pagos.
- Auditoría de acciones y reportes básicos (resumen general, préstamos por estado).
- Frontend en React con el mismo sistema de diseño en tonos verdes del esquema inicial:
  login, panel principal, socios, préstamos (con stepper de estado), cuotas en mora,
  usuarios y auditoría.

Pendiente de refinar: paginación en los listados, edición de socios/usuarios desde la UI,
reportes exportables y ajuste fino de la matriz de permisos según el detalle final del
alcance.
