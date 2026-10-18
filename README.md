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




## GUIA DE USO PARA EL BACKEND: 

### EDITAR UN INFORMACIÓN DE UN SOCIO: 
Método: PUT
URL: http://localhost:4000/api/socios/IdDelSocio
Body: 
{
  "nombre": "Socio",
  "apellido": "De Prueba Perez",
  "documento": "00112345678",
  "email": "prueba.actualizado@example.com",
  "telefono": "8095551234",
  "direccion": "Santiago de los Caballeros",
  "estado": "activo"
}

Un body con la data a cambiar. 

Respuesta del servidor: 

{
    "id": "f7780184-e07c-4479-9c78-27b4e858a545",
    "nombre": "Socio",
    "apellido": "De Prueba Perez",
    "documento": "00112345678",
    "email": "prueba.actualizado@example.com",
    "telefono": "8095551234",
    "direccion": "Santiago de los Caballeros",
    "fechaNacimiento": "2004-07-23",
    "fechaIngreso": "2026-10-18",
    "estado": "activo",
    "createdAt": "2026-10-18T16:10:52.433Z",
    "updatedAt": "2026-10-18T16:38:00.432Z",
    "cuentas": [],
    "prestamos": []
}

### DELETE DE UN SOCIO: 
Método: DELETE
http://localhost:4000/api/socios/IdDelSocio
Respuesta del servidor: 
{
    "mensaje": "Socio eliminado correctamente",
    "id": "f7780184-e07c-4479-9c78-27b4e858a545"
}
