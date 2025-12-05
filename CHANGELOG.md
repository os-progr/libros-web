# 📝 Registro de Cambios - LibrosWeb

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
