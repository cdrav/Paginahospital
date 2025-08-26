# Script para actualizar los enlaces en el HTML con las rutas estandarizadas
$htmlFile = "c:\Users\crist\OneDrive\Escritorio\Paginahospital\transparencia-acceso-informacion-publica.html"
$content = Get-Content -Path $htmlFile -Raw -Encoding UTF8

# Mapeo de rutas antiguas a nuevas
$pathMappings = @{
    "documentos/financieros/2023/Estados Financieros 2023-2022.pdf" = "documentos/financieros/2023/ESTADOS-FINANCIEROS-2023-2022.pdf"
    "documentos/financieros/2022/ESTADOS FINANCIEROS A DICIEMBRE 2022.pdf" = "documentos/financieros/2022/ESTADOS-FINANCIEROS-A-DICIEMBRE-2022.pdf"
    "documentos/financieros/2017/ESTADOS-FINANCIEROS-NIIF-AL-31-DE-DICIEMBRE-2017.pdf" = "documentos/financieros/2017/ESTADOS-FINANCIEROS-NIIF-DIC-2017.pdf"
    "documentos/financieros/2015/Estados-Financieros-a-Marzo-31-2015.pdf" = "documentos/financieros/2015/ESTADOS-FINANCIEROS-T1-2015.pdf"
    "documentos/financieros/2015/Estados-Financieros-a-Junio-2015.pdf" = "documentos/financieros/2015/ESTADOS-FINANCIEROS-T2-2015.pdf"
    "documentos/financieros/2015/Estados-Financieros-3t-2015.pdf" = "documentos/financieros/2015/ESTADOS-FINANCIEROS-T3-2015.pdf"
    "documentos/financieros/2015/Estados-Financiero-Dic-2015.pdf" = "documentos/financieros/2015/ESTADOS-FINANCIEROS-ANUAL-2015.pdf"
    "documentos/financieros/2014/Estados-Financiero-Sept-2014.pdf" = "documentos/financieros/2014/ESTADOS-FINANCIEROS-T3-2014.pdf"
    "documentos/financieros/2014/Estados-Financiero-Dic-2014.pdf" = "documentos/financieros/2014/ESTADOS-FINANCIEROS-ANUAL-2014.pdf"
}

# Crear copia de seguridad
$backupFile = "$htmlFile.bak"
Copy-Item -Path $htmlFile -Destination $backupFile -Force

# Reemplazar rutas en el contenido
$updatedContent = $content
foreach ($oldPath in $pathMappings.Keys) {
    $newPath = $pathMappings[$oldPath]
    $updatedContent = $updatedContent -replace [regex]::Escape($oldPath), $newPath
    Write-Host "Actualizado: $oldPath -> $newPath"
}

# Guardar cambios
$updatedContent | Set-Content -Path $htmlFile -Encoding UTF8 -NoNewline

Write-Host "Actualización completada. Se creó una copia de seguridad en: $backupFile"
