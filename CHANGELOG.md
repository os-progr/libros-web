# 📝 Registro de Cambios - LibrosWeb

## v12.4 (2025-12-08)

### 💬 Chat Global Público - Comunicación en Tiempo Real
- **Widget de Chat Flotante**: Esquina inferior derecha, siempre accesible
- **Chat Público para Todos**: Todos los usuarios autenticados pueden participar
- **Simplificación del Header**: 
  - ❌ Eliminado sistema de mensajes privados
  - ❌ Eliminado botón de estadísticas personales
  - ✅ Ahora solo existe el chat global público (más simple y directo)
  - ✅ Todos los usuarios pueden comunicarse en un solo lugar
- **Auto-Limpieza Inteligente**:
  - ✅ Mantiene automáticamente los últimos 199 mensajes
  - ✅ Cuando llega a 200 mensajes, elimina los más antiguos (200-1)
  - ✅ Sistema eficiente que previene sobrecarga de base de datos
- **Características del Widget**:
  - 💬 Icono animado con efecto pulse
  - 📊 Contador de mensajes totales en tiempo real
  - ▼/▲ Botón para expandir/contraer
  - 🎨 Diseño moderno con gradientes
  - 📱 Totalmente responsivo
- **Funcionalidades**:
  - ✅ Envío de mensajes (máximo 500 caracteres)
  - ✅ Auto-refresh cada 5 segundos cuando está abierto
  - ✅ Contador de caracteres en tiempo real
  - ✅ Enter para enviar, Shift+Enter para nueva línea
  - ✅ Scroll automático a mensajes nuevos
  - ✅ Avatar y nombre de usuario en cada mensaje
  - ✅ Timestamp relativo (Ahora, 5m, 2h, etc.)
  - ✅ Mensajes propios destacados con gradiente
- **Backend Robusto**:
  - 🔒 Solo usuarios autenticados pueden participar
  - 🛡️ Validación de longitud de mensajes
  - 🗑️ Auto-limpieza en cada mensaje nuevo
  - 📊 Endpoint para contador de mensajes
- **Base de Datos**:
  - Nueva tabla `global_chat` con índices optimizados
  - Migración automática incluida
- **Archivos Nuevos**:
  - `routes/chat.js` - Backend del chat
  - `public/global-chat.js` - Frontend del widget
  - `public/global-chat.css` - Estilos modernos
  - `migrations/007_global_chat.sql` - Migración de BD
- **Correcciones**:
  - 🔧 Mejorada inicialización del chat con sistema de reintentos
  - 🔧 Agregados logs de depuración para diagnóstico
  - 🔧 Verificaciones de seguridad (null checks)

---

## v12.3 (2025-12-08)

### 🎨 Modernización del Header - Diseño Llamativo y Funcional
- **Diseño Completamente Renovado**: Header moderno con estética premium y llamativa
- **Icono de Mensajes Funcional**: 
  - ✅ Badge animado que muestra mensajes no leídos en tiempo real
  - ✅ Contador actualizado automáticamente
  - ✅ Animaciones suaves y atractivas (bounce, glow)
  - ✅ Gradientes modernos (azul para mensajes, rojo para notificaciones)
- **Botones de Icono Modernos**:
  - ✅ Diseño circular con efectos hover glassmorphism
  - ✅ Transformaciones 3D al interactuar
  - ✅ Sombras dinámicas y gradientes
  - ✅ Botón admin con animación pulse-glow
- **Perfil de Usuario Compacto**:
  - ✅ Diseño pill con gradiente sutil
  - ✅ Avatar con borde de color primario
  - ✅ Nombre truncado con ellipsis
  - ✅ Efectos hover suaves
- **Reorganización Visual**:
  - 🔔 Notificaciones → 💬 Mensajes → 📊 Stats → ⚙️ Admin → 👤 Perfil → 📤 Publicar → 🌙 Tema → 🚪 Salir
  - Orden lógico y flujo visual mejorado
  - Espaciado optimizado (0.75rem gap)
- **Diseño Responsivo**:
  - En tablets: Oculta textos de botones, solo iconos
  - En móviles: Botones más compactos, spacing reducido
  - Perfil compacto se adapta automáticamente
- **Archivo CSS Dedicado**: `header-modern.css` para mejor organización
- **Mejoras de UX**:
  - Feedback visual inmediato en todas las interacciones
  - Animaciones fluidas con cubic-bezier
  - Estados hover, active y focus bien definidos

---

## v12.2 (2025-12-08)

### 🛡️ Corrección de Errores del Panel Admin
- **Problema Resuelto**: Error `Cannot read properties of undefined (reading 'total')` en `/api/admin/stats`
- **Causa**: Las consultas a la base de datos no manejaban casos donde las tablas no existen o retornan resultados vacíos
- **Solución**: Implementada programación defensiva con:
  - ✅ Función helper `safeCount()` para validar resultados antes de acceder a propiedades
  - ✅ Try-catch individual para cada consulta de estadísticas
  - ✅ Valores por defecto (0) cuando las consultas fallan
  - ✅ El panel admin ahora muestra estadísticas en 0 en lugar de crashear
- **Impacto**: El panel de administración es ahora más robusto y no falla durante el despliegue inicial

---

## v12.1 (2025-12-08)

### 🔧 Corrección Crítica de Migraciones
- **Problema Resuelto**: Error `Table 'railway.messages' doesn't exist` en producción
- **Causa**: El script de migración solo ejecutaba `add_reviews_and_profiles.sql`, ignorando otras migraciones críticas
- **Solución**: Actualizado `scripts/db_update.js` para ejecutar **todas** las migraciones automáticamente
- **Impacto**: 
  - ✅ Tabla `messages` ahora se crea correctamente
  - ✅ Tabla `follows` ahora se crea correctamente
  - ✅ Tabla `comments` ahora se crea correctamente
  - ✅ Todas las funcionalidades sociales funcionan en producción
  - ✅ Sistema de comentarios funcional
- **Mejora Técnica**: El sistema ahora descubre y ejecuta automáticamente todos los archivos `.sql` en el directorio `migrations/` en orden alfabético

---

## v10.8 (2025-12-05)

### 🔔 Notificaciones y Feedback Admin
- **Sistema de Notificaciones**: Los usuarios ahora reciben notificaciones en tiempo real (campana en el header).
- **Feedback de Admin**: El administrador puede enviar recomendaciones, advertencias o consejos directamente a los autores desde el panel de gestión de libros.
- **Base de Datos**: Nueva tabla `notifications` inicializada automáticamente.
- **Mejoras UI**: Nueva interfaz para envío de feedback y visualización de alertas.

---

## v10.7 (2025-12-05)

### 🌍 Acceso Público
- **Biblioteca Compartida**: Ahora todos los usuarios autenticados pueden ver y descargar TODOS los libros publicados, no solo los suyos.
- **Inicio de Sesión**: La página de inicio ya no redirige automáticamente. Muestra una pantalla de bienvenida invitando a iniciar sesión para acceder.

### 🐛 Correcciones
- **Sintaxis**: Corregido error de comillas en el módulo de JavaScript que impedía la carga de la aplicación.
- **Navegación**: Flujo de usuario mejorado para visitantes no autenticados.

---

## v10.6 (2025-12-04)

### 📚 Gestión de Libros (Admin)
- **Vista de Libros**: Tabla completa con todos los libros, autores y quién los subió.
- **Edición de Libros**: Modal para editar título, autor y descripción de cualquier libro.
- **Eliminación de Libros**: Capacidad para eliminar libros problemáticos o duplicados.
- **Indicadores**: Visualización rápida de descargas y reportes por libro.

---

## v10.5 (2025-12-04)

### 👥 Gestión de Usuarios (Admin)
- **Vista de Usuarios**: Nueva tabla detallada con todos los usuarios registrados.
- **Datos de Usuario**: Visualización de avatar, email, fecha de registro, libros subidos y descargas realizadas.
- **Eliminación de Usuarios**: Capacidad para que el administrador elimine usuarios (con confirmación de seguridad).
- **Protección**: El administrador principal no puede ser eliminado.

### 🛠️ Backend
- **Nueva Ruta**: `DELETE /api/admin/users/:id` para eliminar usuarios de forma segura.

---

## v10.4 (2025-12-04)

### ✨ Panel de Administración
- **Panel Simplificado**: Nuevo modal de administración accesible desde el icono de desarrollador (⚙️)
- **Estadísticas en Tiempo Real**:
  - Usuarios registrados
  - Total de libros
  - Descargas del día y totales
  - Libro más popular
- **Acciones Rápidas**:
  - Actualizar datos
  - Limpiar caché
  - Gestión de usuarios y libros (próximamente)

### 🛠️ Mejoras Técnicas
- **Backend**: Nuevas rutas `/api/admin` para estadísticas y gestión
- **Base de Datos**: Nueva tabla `downloads` para rastrear descargas
- **Frontend**: Lógica modular para el panel de administración (`AdminPanel`)

---

## v10.3 (2025-12-04)

### 🐛 Correcciones de Errores
- **routes/auth.js**: Corregida importación de `../config/passport` a `../config/google-auth`
- **Despliegue**: Solucionado error `MODULE_NOT_FOUND` en producción

### 🔧 Impacto
- ✅ La aplicación ahora se despliega correctamente en Railway
- ✅ La autenticación con Google funciona sin errores
- ✅ Todos los módulos se cargan correctamente

---

## v10.2 (2025-12-04)

### 📚 Documentación
- **CHANGELOG.md**: Registro completo de cambios y versiones
- **DEVELOPER_MODE_GUIDE.md**: Guía detallada del modo desarrollador para el administrador
- **auto-version.ps1**: Script mejorado de versionado automático

### 🔧 Mejoras
- Sistema de versionado automático completamente funcional
- Documentación completa para el administrador
- Guías de uso para las nuevas funcionalidades

---

## v10.1 (2025-12-04)

### ✨ Nuevas Funcionalidades

#### 🔧 Modo Desarrollador (Solo Administrador)
- **Icono de Engranaje (⚙️)**: Reemplaza el botón de cambio de tema
- **Acceso Exclusivo**: Solo visible para `edaninguna@gmail.com`
- **Funcionalidades**:
  - Activa/desactiva herramientas de desarrollador
  - Permite usar F12, clic derecho y atajos de teclado
  - Animación de pulso para fácil identificación
  - Estado persistente en localStorage

#### 📥 Confirmación de Descarga
- **Diálogo de Confirmación**: Aparece antes de descargar cualquier libro
- **Información Clara**: Muestra el título del libro y formato (PDF/Word)
- **Mensaje de Éxito**: Confirma que la descarga ha iniciado

### 🛠️ Cambios Técnicos
- Modificado `public/index.html`: Nuevo botón de desarrollador
- Modificado `public/app.js`: 
  - Nuevo módulo `DeveloperMode`
  - Actualizada función `downloadCurrentBook()`
  - Protección de código condicional
- Modificado `public/styles.css`: Estilos con animación para el botón de desarrollador
- Creado `VERSION`: Archivo de control de versiones
- Creado `auto-version.ps1`: Script de versionado automático

### 📦 Archivos Nuevos
- `VERSION` - Control de versiones
- `auto-version.ps1` - Script de versionado automático
- `CHANGELOG.md` - Este archivo

---

## 🚀 Cómo Usar el Script de Versionado

Para crear una nueva versión automáticamente:

```powershell
.\auto-version.ps1
```

Este script:
1. Lee la versión actual del archivo `VERSION`
2. Incrementa el número menor (10.1 → 10.2 → 10.3)
3. Hace commit con el mensaje de versión
4. Crea el tag correspondiente
5. Sube todo a GitHub

---

## 📋 Versiones Anteriores

### v10.0 y anteriores
- Sistema de autenticación con Google OAuth
- Gestión de libros (subir, ver, descargar)
- Soporte para PDF y Word
- Imágenes de portada personalizadas
- Búsqueda de libros
- Sistema de géneros
- Panel de administración
- Sistema de reportes
- Protección anti-inspección de código
