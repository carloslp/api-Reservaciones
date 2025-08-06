# API Reservaciones

API RESTful para gestión de reservaciones de recursos (mesas, habitaciones, vehículos, servicios, etc.)

## Tecnologías
- Node.js + Express
- MongoDB + Mongoose
- JWT para autenticación
- Docker

## Endpoints principales
- Reservaciones: `/api/reservations`
- Recursos: `/api/resources`
- Usuarios: `/api/users`

## Configuración
1. Clona el repositorio
2. Crea el archivo `.env` con tus variables de entorno
3. Instala dependencias: `npm install`
4. Ejecuta: `node src/app.js`

## Docker
```
docker build -t api-reservaciones .
docker run -p 3000:3000 --env-file .env api-reservaciones
```

## Notas
- Simulación de envío OTP por WhatsApp (ver consola)
- Índices geoespaciales configurados en los modelos
- Validaciones y manejo de errores incluidos
