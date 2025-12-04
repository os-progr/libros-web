# 📝 Registro de Cambios - LibrosWeb

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
