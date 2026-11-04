# Racinggram — Requerimientos técnicos

Basado en la consigna del TP #2 de Programación IV (2026 C1).

## 1. Arquitectura

- Dos proyectos separados: **frontend** (Angular) y **backend** (NestJS).
- Base de datos **MongoDB**.
- Comunicación por API REST con JSON; la subida de imágenes por `multipart/form-data`.
- Frontend desplegado en un hosting (deploy requerido desde el Sprint 1).
- Backend desplegado en **Vercel** (funciones serverless). Ver sección 6 por las restricciones que esto implica.

## 2. Backend (NestJS)

### Módulos
- **Autenticación**, **Usuarios** y **Publicaciones** (con sub-controllers de comentarios y estadísticas).

### Autenticación
- JWT con payload que identifica al usuario (id, correo o usuario) y su rol.
- Vencimiento del token: **15 minutos**.
- El token se devuelve en la respuesta o por cookie.
- Contraseñas encriptadas (hash, por ejemplo bcrypt). El login compara contra el hash.
- Guards para: usuario autenticado, rol administrador.
- Rutas:
  - `POST` registro: valida todos los datos, guarda la imagen y su URL, y crea el usuario.
  - `POST` login: acepta usuario o correo y contraseña; devuelve token y datos del usuario; rechaza usuarios deshabilitados.
  - `POST` autorizar: valida el token; devuelve los datos del usuario o 401.
  - `POST` refrescar: valida el token y devuelve uno nuevo con el mismo payload y 15 minutos.

### Usuarios (solo administrador)
- `GET` listar usuarios.
- `POST` crear usuario con rol.
- `DELETE` deshabilitar (baja lógica).
- `POST` habilitar (alta lógica).

### Publicaciones
- `POST` crear (título, descripción, imagen opcional subida a almacenamiento externo, ver sección 6).
- `GET` listar con parámetros: `orden` (fecha, me gusta, guardados, compartidos), `usuario`, `offset`, `limit`.
- `DELETE` baja lógica (autor o administrador); oculta también sus comentarios.
- `POST` / `DELETE` me gusta (uno por usuario).
- `POST` guardar y quitar de guardados (usuario tomado del token).
- `POST` compartir con otro usuario (destinatario en el body).
- `GET` compartidas conmigo, con quién las compartió.

### Comentarios
- `POST` crear (con usuario y fecha).
- `PUT` modificar mensaje, marcando `modificado: true`.
- `GET` por publicación, paginado, más recientes primero.

### Estadísticas (solo administrador)
- `GET` con rango de fechas para: publicaciones por usuario, comentarios totales, comentarios por publicación, ingresos por usuario, visitas a perfil, me gusta por día.
- Requiere registrar eventos de login y de visita a perfil.

### Códigos de estado
- 201 al crear, 200 en lecturas y actualizaciones correctas, 204 si no devuelve contenido.
- 400 datos inválidos, 401 no autenticado o token inválido, 403 sin permisos, 404 no existe, 409 duplicado.
- Nunca 200 en un error ni 400 en una respuesta correcta.

### Calidad
- Validación de entrada con DTOs (`class-validator`) y `ValidationPipe`.
- Unicidad de correo y nombre de usuario a nivel de base de datos (índice único).
- CORS configurado para el frontend.
- Variables de entorno para secretos y conexión (no subir al repositorio).
- Límite de tipo y tamaño en la subida de imágenes.

## 3. Modelo de datos (MongoDB)

| Colección | Campos principales |
|---|---|
| `usuarios` | nombre, apellido, correo, usuario, passwordHash, fechaNacimiento, descripcion, imagenUrl, perfil (`usuario`/`administrador`), habilitado |
| `publicaciones` | autor, titulo, mensaje, imagenUrl, fecha, eliminada, meGusta[] (ids), cantidadMeGusta, cantidadGuardados, cantidadCompartidos |
| `comentarios` | publicacion, autor, mensaje, fecha, modificado |
| `guardados` | usuario, publicacion, fecha |
| `compartidos` | de, para, publicacion, fecha |
| `eventos` | tipo (`login`/`visitaPerfil`), usuario, objetivo, fecha |

## 4. Frontend (Angular)

### Estructura
- Componentes por pantalla: registro, login, carga, publicaciones, publicación, mi perfil, perfil de usuario, guardados, compartidos, dashboard de usuarios, dashboard de estadísticas.
- Cada publicación es un **componente** reutilizable.
- Servicios para API, sesión y notificaciones.
- Rutas con **guards** (sesión y administrador).
- **Interceptor HTTP** que adjunta el token y redirige al login ante un 401.

### Formularios
- Formularios reactivos con validaciones y mensajes claros.
- Contraseña: mínimo 8 caracteres, una mayúscula y un número; campo de repetir contraseña.
- Campo file para la imagen de perfil y para la de publicaciones.

### Sesión
- Guardado del token en el navegador (o cookie).
- Pantalla de carga con spinner que valida el token contra la ruta autorizar.
- Temporizador de 10 minutos tras el login; modal que ofrece extender y llama a refrescar.

### UI
- Librería o diseño propio de estilos, uniforme y responsive.
- Favicon propio.
- **Sin `alert()`**: modales para avisos y confirmaciones.

### Listados
- Paginación con `offset`/`limit` y ordenamiento seleccionable.
- Scroll infinito (Sprint 5).
- Comentarios con botón "cargar más" sin perder los anteriores.

### Gráficos
- Librería de gráficos (por ejemplo Chart.js / ng2-charts).
- Selector de rango de fechas.
- Tipos variados: al menos torta, barras y líneas.

### Requisitos de aplicación
- **PWA** (service worker, manifest, instalable).
- **3 pipes propias** (por ejemplo tiempo transcurrido, recortar texto, edad).
- **3 directivas propias** (por ejemplo resaltar texto, autofoco, mostrar según rol).

## 5. Infraestructura y entrega

- Repositorios separados o monorepo con dos carpetas (`frontend/`, `backend/`).
- Deploy del frontend en hosting; backend en Vercel, accesible desde el front desplegado.
- MongoDB en la nube (**Atlas**), ya que Vercel no aloja bases de datos.
- Entrega y corrección por sprint semanal; mantener commits ordenados por sprint.

## 6. Despliegue del backend en Vercel

Vercel ejecuta el backend como funciones serverless, no como un servidor siempre encendido. Eso cambia varias decisiones:

- **No hay disco persistente.** Las imágenes de perfil y de publicaciones no pueden guardarse en una carpeta del servidor. Hay que subirlas a un servicio externo (Vercel Blob, Cloudinary o similar) y guardar solo la URL en MongoDB. Este es el cambio más importante respecto de un servidor tradicional.
- **Adaptador serverless.** Se exporta la app Nest como handler (por ejemplo en `api/index.ts`) y se configura `vercel.json` para dirigir todas las rutas a esa función.
- **Conexión a MongoDB reutilizada.** Cada invocación puede ser un proceso nuevo: hay que cachear la conexión de Mongoose entre invocaciones para no agotar las conexiones de Atlas.
- **Atlas accesible desde Vercel.** Permitir el acceso de red desde cualquier IP (Vercel no tiene IP fija en el plan gratuito).
- **Variables de entorno** (`MONGODB_URI`, `JWT_SECRET`, credenciales del almacenamiento de imágenes) cargadas en el panel de Vercel, no en el repositorio.
- **Límites de las funciones.** Tiempo máximo de ejecución y tamaño máximo del cuerpo de la petición (unos 4,5 MB): limitar el tamaño de las imágenes subidas.
- **Sin tareas en segundo plano ni WebSockets.** El temporizador de sesión vive en el frontend, y la app no debe depender de procesos persistentes en el servidor.
- **CORS** habilitado para el dominio donde esté el frontend.
- **Arranque en frío.** La primera petición tras un período sin uso puede tardar más; la pantalla de carga del Sprint 3 ayuda a disimularlo.
