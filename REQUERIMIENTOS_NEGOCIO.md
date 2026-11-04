# Racinggram — Requerimientos de negocio

## 1. Descripción general

Racingram es una red social donde los usuarios publican, reaccionan con "me gusta" y comentan. Solo se puede usar estando registrado o logueado. Cada usuario tiene un perfil propio que puede ver y editar.

## 2. Roles

| Rol | Descripción |
|---|---|
| Usuario | Perfil por defecto. Publica, da me gusta, comenta, guarda y comparte. |
| Administrador | Todo lo anterior, más moderación (baja de publicaciones ajenas), gestión de usuarios y estadísticas. |

## 3. Reglas generales

- RN-01. Solo se accede a la aplicación registrado o logueado.
- RN-02. El correo o nombre de usuario (el que se elija para login) es único.
- RN-03. La contraseña tiene al menos 8 caracteres, una mayúscula y un número.
- RN-04. Las bajas (publicaciones y usuarios) son lógicas, nunca físicas.
- RN-05. Un usuario deshabilitado no puede ingresar y se le informa el motivo.
- RN-06. Un usuario da un solo me gusta por publicación y solo puede quitarlo si lo dio.
- RN-07. Solo el autor de una publicación o un administrador pueden darla de baja. Al darla de baja dejan de estar disponibles la publicación y sus comentarios.
- RN-08. Solo el autor de un comentario puede editarlo, y el comentario editado debe mostrarse como "editado".
- RN-09. La sesión dura 15 minutos. A los 10 se avisa al usuario y se le ofrece extenderla.
- RN-10. No se usa `alert()`: toda notificación o confirmación es por modal.
- RN-11. Los mensajes al usuario deben ser claros y completos (éxito, error, validación).

## 4. Requerimientos funcionales

### Cuentas y sesión
- RF-01. Registro con: nombre, apellido, correo, nombre de usuario, contraseña, repetir contraseña, fecha de nacimiento, descripción breve e imagen de perfil.
- RF-02. Login con correo o nombre de usuario y contraseña.
- RF-03. Al abrir la app se muestra una pantalla de carga mientras se valida la sesión; según el resultado se va a publicaciones o a login.
- RF-04. Aviso de sesión por vencer con opción de extenderla.
- RF-05. Si la sesión es inválida, se redirige al login.

### Publicaciones
- RF-06. Crear publicación con título, mensaje e imagen opcional.
- RF-07. Listar publicaciones, por fecha por defecto, con opción de ordenar por cantidad de me gusta, de veces guardada y de veces compartida.
- RF-08. Ver publicaciones en tandas limitadas (paginación, luego scroll infinito).
- RF-09. Dar y quitar me gusta.
- RF-10. Eliminar publicaciones propias.
- RF-11. Ver una publicación en grande con sus comentarios.

### Comentarios
- RF-12. Comentar una publicación.
- RF-13. Ver comentarios de forma ordenada, los más recientes primero, con botón "cargar más".
- RF-14. Editar los propios comentarios.

### Perfil
- RF-15. Ver mis datos, mi foto y mis últimas 3 publicaciones con sus comentarios.
- RF-16. Editar mi perfil.
- RF-17. Ver el perfil de otro usuario (datos y últimas 3 publicaciones) al tocar su nombre o foto.

### Guardados y compartidos
- RF-18. Guardar y quitar publicaciones de mis guardados, indicando si está guardada.
- RF-19. Pantalla con todas mis publicaciones guardadas, con las mismas interacciones.
- RF-20. Compartir una publicación con otro usuario elegido.
- RF-21. Pantalla de compartidos con las publicaciones recibidas y quién las compartió.

### Administración
- RF-22. El administrador puede dar de baja cualquier publicación, desde el listado, el detalle y el perfil de otro usuario.
- RF-23. Dashboard de usuarios: listar, crear (con rol usuario o administrador), habilitar y deshabilitar.
- RF-24. Dashboard de estadísticas con rango de fechas elegible:
  - Publicaciones por usuario.
  - Comentarios totales.
  - Comentarios por publicación.
  - Ingresos (login) por usuario.
  - Visitas a mi perfil (de otros usuarios).
  - Me gusta otorgados por día.
- RF-25. Los gráficos deben ser de tipos distintos (torta, barras, líneas, etc.).

## 5. Experiencia de usuario

- Diseño trabajado y uniforme en toda la aplicación, no HTML plano.
- Identidad visual propia del tema elegido, con favicon propio.
- Navegación clara entre pantallas.
- Retroalimentación clara al realizar cualquier acción.

## 6. Pantallas

Registro, Login, Carga, Publicaciones, Publicación (detalle), Mi Perfil, Perfil de otro usuario, Guardados, Compartidos, Dashboard/Usuarios, Dashboard/Estadísticas.

## 7. Entregas por sprint

| Sprint | Alcance |
|---|---|
| 1 | Registro, login, navegación, favicon, deploy. |
| 2 | Listado de publicaciones, me gusta, borrado propio, Mi Perfil. |
| 3 | Detalle y comentarios, manejo de sesión, pantalla de carga. |
| 4 | Administración (usuarios y estadísticas), PWA. |
| 5 (recuperatorio) | Perfil de otros, scroll infinito, estadísticas nuevas. |
| 6 (final) | Guardados, compartidos, nuevos ordenamientos. |
