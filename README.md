# Grandma Recipes API - Backend

API RESTful para gestión de recetas familiares y grupos, desarrollada con Node.js, Express y MongoDB.

## Tabla de Contenidos
- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Ejecución](#ejecución)
- [Endpoints Principales](#endpoints-principales)
- [Estructura Principal de Carpetas](#estructura-principal-de-carpetas)

---

## Descripción

Este backend permite:
- Registro, login y perfil de usuarios.
- CRUD de recetas (crear, leer, actualizar, eliminar).
- CRUD de grupos (familiares/amigos).
- Búsqueda, filtrado, ordenamiento y paginado de recetas.
- Recetas públicas y privadas por grupo.
- Autenticación JWT.
- Validaciones.
- Permisos para acciones según rol (autor, admin de grupo).

---

## Tecnologías

- Node.js
- Express.js
- MongoDB + Mongoose
- JSON Web Tokens (JWT)
- Bcrypt
- Dotenv

---

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/NicolasRegina/AplicacionesHibridas_GrandmaRecipes.git
   cd AplicacionesHibridas_GrandmaRecipes/backend
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

---

## Variables de Entorno

Crear un archivo `.env` en la carpeta `backend` con el siguiente contenido:

```env
MONGODB_URI=mongodb://localhost:27017/grandma_recipes
JWT_SECRET=tu_clave_secreta_jwt
```

- Cambia los valores según tu entorno local o de producción.

---

## Ejecución

```bash
npm start
```
El servidor por defecto corre en [http://localhost:3000](http://localhost:3000).

---

## Endpoints Principales

### Usuarios
- `POST   /api/users/register` — Registro de usuario
- `POST   /api/users/login`    — Login de usuario
- `GET    /api/users/profile`  — Ver perfil (requiere JWT)

### Recetas
- `GET    /api/recipes`               — Listar recetas (con filtros, paginado, orden)
- `POST   /api/recipes`               — Crear receta (requiere JWT)
- `GET    /api/recipes/:id`           — Ver receta por ID
- `PUT    /api/recipes/:id`           — Actualizar receta (autor)
- `DELETE /api/recipes/:id`           — Eliminar receta (autor)
- `GET    /api/recipes/search?q=xxx`  — Buscar recetas por palabra

### Grupos
- `GET    /api/groups`              — Listar grupos del usuario
- `POST   /api/groups`              — Crear grupo
- `GET    /api/groups/:id`          — Ver grupo por ID
- `PUT    /api/groups/:id`          — Actualizar grupo (admin)
- `DELETE /api/groups/:id`          — Eliminar grupo (solo el creador)

---

## Estructura Principal de Carpetas

```
backend/
├── app.js
├── models/
│   ├── userModel.js
│   ├── groupModel.js
│   └── recipeModel.js
├── controllers/
│   ├── userController.js
│   ├── groupController.js
│   └── recipeController.js
├── routes/
│   ├── userRouter.js
│   ├── groupRouter.js
│   └── recipeRouter.js
├── middleware/
│   └── authMiddleware.js
├── validation/
│   └── validation.js
├── public/
│   └── index.html
└── .env
```

---

## Notas

- Este backend está pensado para funcionar junto al frontend desarrollado en React (ver carpeta `/frontend`).
- Las rutas que requieren autenticación deben recibir el token JWT en el header `Authorization: Bearer <token>`.
- Para desarrollo local, asegurate de tener MongoDB corriendo.

---

**Autor:** Nicolás Regina  
**Materia:** Aplicaciones Híbridas  
**Docente:** Marcos Galbán, Camila Belén  
**Comisión:** DWN4AV
