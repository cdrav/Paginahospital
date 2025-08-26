# Script para estandarizar nombres de archivos financieros
# Este script renombra los archivos a un formato consistente

# Configuración
$basePath = "c:\Users\crist\OneDrive\Escritorio\Paginahospital\documentos\financieros"

# Mapeo de patrones antiguos a nuevos
$patterns = @{
    # Patrones para 2023
    "2023/Estados Financieros 2023-2022.pdf" = "2023/ESTADOS-FINANCIEROS-2023-2022.pdf"
    
    # Patrones para 2022
    "2022/ESTADOS FINANCIEROS A DICIEMBRE 2022.pdf" = "2022/ESTADOS-FINANCIEROS-A-DICIEMBRE-2022.pdf"
    
    # Patrones para 2017 (NIIF)
    "2017/ESTADOS-FINANCIEROS-NIIF-AL-31-DE-DICIEMBRE-2017.pdf" = "2017/ESTADOS-FINANCIEROS-NIIF-DIC-2017.pdf"
    
    # Patrones para 2015 (trimestrales)
    "2015/Estados-Financieros-a-Marzo-31-2015.pdf" = "2015/ESTADOS-FINANCIEROS-T1-2015.pdf"
    "2015/Estados-Financieros-a-Junio-2015.pdf" = "2015/ESTADOS-FINANCIEROS-T2-2015.pdf"
    "2015/Estados-Financieros-3t-2015.pdf" = "2015/ESTADOS-FINANCIEROS-T3-2015.pdf"
    "2015/Estados-Financiero-Dic-2015.pdf" = "2015/ESTADOS-FINANCIEROS-ANUAL-2015.pdf"
    
    # Patrones para 2014
    "2014/Estados-Financiero-Sept-2014.pdf" = "2014/ESTADOS-FINANCIEROS-T3-2014.pdf"
    "2014/Estados-Financiero-Dic-2014.pdf" = "2014/ESTADOS-FINANCIEROS-ANUAL-2014.pdf"
    
    # Agregar más patrones según sea necesario
}

# Crear directorio de respaldo
$backupDir = "$basePath\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "Iniciando estandarización de nombres de archivos..."
Write-Host "Se creará una copia de seguridad en: $backupDir"

# Procesar cada patrón
foreach ($oldPattern in $patterns.Keys) {
    $oldPath = Join-Path $basePath $oldPattern
    $newPath = Join-Path $basePath $patterns[$oldPattern]
    
    # Verificar si el archivo fuente existe
    if (Test-Path $oldPath) {
        # Crear directorio de destino si no existe
        $targetDir = Split-Path $newPath -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        # Copiar a respaldo
        Copy-Item -Path $oldPath -Destination (Join-Path $backupDir (Split-Path $oldPath -Leaf))
        
        # Mover/renombrar archivo
        Move-Item -Path $oldPath -Destination $newPath -Force
        Write-Host "Renombrado: $oldPath -> $newPath"
    } else {
        Write-Host "ADVERTENCIA: No se encontró el archivo: $oldPath"
    }
}

Write-Host "Proceso de estandarización completado."
Write-Host "Se creó una copia de seguridad en: $backupDir"
