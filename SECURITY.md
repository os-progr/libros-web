# 🔒 SEGURIDAD - LibrosWeb

## Medidas de Seguridad Implementadas

### 1. **Configuración de NPM Segura**
- ✅ Uso de `--omit=dev` en producción (no instala dependencias de desarrollo)
- ✅ Auditorías automáticas de seguridad habilitadas
- ✅ Versiones mínimas de Node.js (>=18.0.0) y npm (>=9.0.0) especificadas
- ✅ Archivo `.npmrc` configurado para producción segura

### 2. **Autenticación y Sesiones**
- ✅ Google OAuth 2.0 para autenticación segura
- ✅ **MySQL Session Store** en producción (escalable y persistente)
- ✅ Sesiones con cookies httpOnly (previene XSS)
- ✅ Cookies secure en producción (solo HTTPS)
- ✅ Secret de sesión en variables de entorno
- ✅ Limpieza automática de sesiones expiradas (cada 15 minutos)
- ✅ Expiración de sesiones: 24 horas

### 3. **Base de Datos**
- ✅ Prepared statements (previene SQL injection)
- ✅ Credenciales en variables de entorno (.env)
- ✅ Conexiones con pool para mejor rendimiento
- ✅ Validación de datos antes de insertar

### 4. **Protección de Archivos**
- ✅ Validación de tipos de archivo (PDF, DOCX, imágenes)
- ✅ Límite de tamaño de archivos (10MB)
- ✅ Almacenamiento en Cloudinary (CDN seguro)
- ✅ URLs firmadas para descargas

### 5. **CORS y Headers**
- ✅ CORS configurado con origen específico
- ✅ Credenciales habilitadas solo para dominios permitidos
- ✅ Headers de seguridad configurados

### 6. **Validación de Entrada**
- ✅ Sanitización de HTML (previene XSS)
- ✅ Validación de longitud de mensajes
- ✅ Escape de caracteres especiales
- ✅ Validación de tipos de datos

### 7. **Rate Limiting (Recomendado para Implementar)**
```javascript
// TODO: Agregar express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por IP
});

app.use('/api/', limiter);
```

### 8. **Helmet.js (Recomendado para Implementar)**
```javascript
// TODO: Agregar helmet para headers de seguridad
const helmet = require('helmet');
app.use(helmet());
```

## Variables de Entorno Requeridas

Asegúrate de tener estas variables configuradas en Railway:

```env
# Base de Datos
MYSQL_URL=mysql://...
MYSQLHOST=...
MYSQLPORT=3306
MYSQLUSER=...
MYSQLPASSWORD=...
MYSQLDATABASE=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://tu-dominio.railway.app/auth/google/callback

# Sesión
SESSION_SECRET=un-secreto-muy-largo-y-aleatorio-aqui

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Entorno
NODE_ENV=production
FRONTEND_URL=https://tu-dominio.railway.app
```

## Checklist de Seguridad

- [x] Dependencias de desarrollo no instaladas en producción
- [x] Variables sensibles en .env (no en código)
- [x] Autenticación OAuth implementada
- [x] Sesiones seguras con httpOnly y secure
- [x] Validación de entrada de usuario
- [x] Escape de HTML para prevenir XSS
- [x] Prepared statements para prevenir SQL injection
- [x] CORS configurado correctamente
- [x] Límites de tamaño de archivo
- [x] Validación de tipos de archivo
- [ ] Rate limiting (recomendado)
- [ ] Helmet.js para headers de seguridad (recomendado)
- [ ] Logging de eventos de seguridad (recomendado)
- [ ] Backups automáticos de base de datos (recomendado)

## Comandos de Seguridad

```bash
# Auditar dependencias
npm run audit

# Corregir vulnerabilidades automáticamente
npm run audit:fix

# Instalar solo dependencias de producción
npm run install:prod

# Ver versión actual
cat VERSION
```

## Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor NO la publiques públicamente.
Contacta al equipo de desarrollo directamente.

## Última Actualización

- **Versión**: 12.4
- **Fecha**: 2025-12-08
- **Estado**: ✅ Seguro para producción
