# Configuración CORS para Firebase Storage

## Problema
Firebase Storage está bloqueando solicitudes desde el dominio `https://hdsa.gov.co` debido a políticas CORS.

## Solución

### Opción 1: Configurar CORS con gsutil (Recomendado)

1. **Instalar Google Cloud SDK**:
```bash
# Descargar desde: https://cloud.google.com/sdk/docs/install
```

2. **Autenticarse con Google Cloud**:
```bash
gcloud auth login
gcloud config set project portal-institucional-185ec
```

3. **Aplicar configuración CORS**:
```bash
gsutil cors set cors-config.json gs://portal-institucional-185ec.firebasestorage.app
```

### Opción 2: Usar Firebase CLI

1. **Instalar Firebase CLI**:
```bash
npm install -g firebase-tools
```

2. **Iniciar sesión**:
```bash
firebase login
```

3. **Configurar CORS en storage.rules**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Opción 3: Configuración manual en consola

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Buscar "Cloud Storage"
3. Seleccionar el bucket: `portal-institucional-185ec.firebasestorage.app`
4. Ir a "Protección" → "Configuración de CORS"
5. Agregar la configuración del archivo `cors-config.json`

## Verificación

Después de configurar CORS, verificar con:
```bash
gsutil cors get gs://portal-institucional-185ec.firebasestorage.app
```

## Dominios permitidos

- `https://hdsa.gov.co` (producción)
- `https://www.hdsa.gov.co` (producción con www)
- `https://localhost:3000` (desarrollo local)
- `https://127.0.0.1:3000` (desarrollo local)

## Tiempo de propagación

La configuración CORS puede tardar hasta 15 minutos en propagarse completamente.
