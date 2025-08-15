# Script para agregar el script del breadcrumb a todas las páginas HTML
# Ejecutar este script desde la carpeta raíz del proyecto

# Obtener la ruta del directorio raíz del proyecto
$rootDir = Split-Path -Parent $PSScriptRoot

# Definir la ruta al script del breadcrumb
$breadcrumbScript = "<script src="/js/breadcrumb.js"></script>"

# Obtener todos los archivos HTML en el directorio raíz y subdirectorios, excluyendo la carpeta de herramientas
$htmlFiles = Get-ChildItem -Path $rootDir -Recurse -Filter "*.html" -Exclude @("herramientas", "node_modules", "dist", "build") | 
             Where-Object { $_.FullName -notlike '*\herramientas\*' -and $_.FullName -notlike '*\node_modules\*' -and $_.FullName -notlike '*\dist\*' -and $_.FullName -notlike '*\build\*' }

# Contador de archivos actualizados
$updatedFiles = 0

# Procesar cada archivo HTML
foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Verificar si el archivo ya tiene el script del breadcrumb
    if ($content -notmatch "breadcrumb\.js") {
        # Verificar si tiene etiqueta de cierre de body
        if ($content -match "</body>") {
            # Insertar el script antes del cierre del body
            $newContent = $content -replace "</body>", "$breadcrumbScript`n</body>"
            
            # Guardar los cambios
            Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
            Write-Host "Actualizado: $($file.FullName)"
            $updatedFiles++
        } else {
            Write-Host "Advertencia: No se encontró la etiqueta </body> en $($file.FullName)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Ya tiene breadcrumb: $($file.FullName)" -ForegroundColor Gray
    }
}

Write-Host "`nProceso completado. Se actualizaron $updatedFiles archivos." -ForegroundColor Green
