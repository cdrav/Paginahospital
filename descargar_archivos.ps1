# Script para descargar archivos de presupuestos, acuerdos y ejecuciones

# Crear directorios si no existen
$directorios = @(
    "documentos\planeacion\presupuesto\acuerdos",
    "documentos\planeacion\presupuesto\ejecuciones",
    "documentos\planeacion\presupuesto\2024",
    "documentos\planeacion\presupuesto\2023",
    "documentos\planeacion\presupuesto\2022",
    "documentos\planeacion\presupuesto\2021",
    "documentos\planeacion\presupuesto\2020",
    "documentos\planeacion\presupuesto\2019",
    "documentos\planeacion\presupuesto\2018",
    "documentos\planeacion\presupuesto\2017",
    "documentos\planeacion\presupuesto\2016",
    "documentos\planeacion\presupuesto\2015",
    "documentos\planeacion\presupuesto\2014",
    "documentos\planeacion\presupuesto\2013"
)

foreach ($dir in $directorios) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "Directorio creado: $dir"
    }
}

# Función para descargar archivos
function Download-File {
    param (
        [string]$url,
        [string]$outputPath
    )
    
    try {
        $outputDir = Split-Path -Parent $outputPath
        if (-not (Test-Path $outputDir)) {
            New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
        }
        
        if (-not (Test-Path $outputPath)) {
            Write-Host "Descargando $url a $outputPath"
            Invoke-WebRequest -Uri $url -OutFile $outputPath -ErrorAction Stop
            Write-Host "Descarga completada: $outputPath" -ForegroundColor Green
        } else {
            Write-Host "El archivo ya existe: $outputPath" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Error al descargar $url : $_" -ForegroundColor Red
    }
}

# Descargar presupuestos
$presupuestos = @{
    "2013" = "https://hdsa.gov.co/wp-content/uploads/2018/09/Presupuesto-2013.pdf"
    "2014" = "https://hdsa.gov.co/wp-content/uploads/2018/09/Presupuesto-2014.pdf"
    "2015" = "https://hdsa.gov.co/wp-content/uploads/2018/09/Presupuesto-2015.pdf"
    "2016" = "https://hdsa.gov.co/wp-content/uploads/2018/09/Presupuesto-2016.pdf"
    "2017" = "https://hdsa.gov.co/wp-content/uploads/2018/09/Presupuesto-2017.pdf"
    "2018" = "https://hdsa.gov.co/wp-content/uploads/2018/09/Presupuesto-2018.pdf"
    "2019" = "https://hdsa.gov.co/wp-content/uploads/2020/07/Presupuesto-2019.pdf"
    "2020" = "https://hdsa.gov.co/wp-content/uploads/2020/07/Presupuesto-2020.pdf"
    "2021" = "https://hdsa.gov.co/wp-content/uploads/2021/04/Ejecucion-Inicial-ppto-2021.pdf"
    "2022" = "https://hdsa.gov.co/wp-content/uploads/2020/06/Ejecucion-de-Ingresos-Enero-a-Diciembre-2022.pdf"
    "2023" = "https://hdsa.gov.co/wp-content/uploads/2020/06/Ejecucion-Presupuesto-Inicial-2023.pdf"
    "2024" = "https://hdsa.gov.co/wp-content/uploads/2020/06/Presupuesto-2024_.pdf"
}

foreach ($year in $presupuestos.Keys) {
    $url = $presupuestos[$year]
    $outputFile = "documentos\planeacion\presupuesto\$year\Presupuesto-$year.pdf"
    Download-File -url $url -outputPath $outputFile
}

# Descargar ejecuciones presupuestales
$ejecuciones = @{
    "2015" = "https://hdsa.gov.co/wp-content/uploads/2020/06/EJECUCION-AL-31-DE-DICIEMBRE-DE-2015.pdf"
    "2016" = "https://hdsa.gov.co/wp-content/uploads/2020/06/EJECUCION-DE-INGRESOS-Y-GASTOS-AL-31-DE-DICIEMBRE-DEL-2016.pdf"
    "2017" = "https://hdsa.gov.co/wp-content/uploads/2020/06/EJECUCION-DE-INGRESOS-Y-GASTOS-ENER-DIC-2017.pdf"
    "2018" = "https://hdsa.gov.co/wp-content/uploads/2020/06/Ejecucion-Ene-Dic-2018.pdf"
    "2019" = "https://hdsa.gov.co/wp-content/uploads/2020/06/Ejecucion-de-Ingresos-y-Gastos-Ene-Dic-2019.pdf"
    "2020" = "https://hdsa.gov.co/wp-content/uploads/2021/04/EJECUCION-DE-INGRESOS-Y-GASTOS-A-DIC-2020.pdf"
    "2021" = "https://hdsa.gov.co/wp-content/uploads/2020/06/EJECUCION-DE-INGRESOS-Y-GASTOS-2021.pdf"
    "2022" = "https://hdsa.gov.co/wp-content/uploads/2020/06/Ejecucion-de-Ingresos-Enero-a-Diciembre-2022.pdf"
    "2023" = "https://hdsa.gov.co/wp-content/uploads/2020/06/Ejecucion-de-Ingresos-y-gastos-Enero-a-Diciembre-2023.pdf"
}

foreach ($year in $ejecuciones.Keys) {
    $url = $ejecuciones[$year]
    $outputFile = "documentos\planeacion\presupuesto\ejecuciones\Ejecucion-$year.pdf"
    Download-File -url $url -outputPath $outputFile
}

# Descargar acuerdos
$acuerdos = @{
    "2015" = @{
        "numero" = "012"
        "url" = "https://hdsa.gov.co/wp-content/uploads/2020/06/ACUERDO-012-APROBACION-PPTO-2016.pdf"
        "vigencia" = "2016"
    }
    "2016" = @{
        "numero" = "012"
        "url" = "https://hdsa.gov.co/wp-content/uploads/2020/06/ACUERDO-012-APROBACION-PPTO-2017.pdf"
        "vigencia" = "2017"
    }
    "2017" = @{
        "numero" = "018"
        "url" = "https://hdsa.gov.co/wp-content/uploads/2020/06/ACUERDO-018-APROBACION-DEL-PRESUPUESTO-2018.pdf"
        "vigencia" = "2018"
    }
    "2018" = @{
        "numero" = "010"
        "url" = "https://hdsa.gov.co/wp-content/uploads/2020/06/Acuerdo-N%C2%B0010-Presupuesto-2019.pdf"
        "vigencia" = "2019"
    }
    "2019" = @{
        "numero" = "014"
        "url" = "https://hdsa.gov.co/wp-content/uploads/2020/06/Acuerdo-N%C2%B0014.pdf"
        "vigencia" = "2020"
    }
    "2020" = @{
        "numero" = "018"
        "url" = "https://hdsa.gov.co/wp-content/uploads/2021/04/Acuerdo-018-de-2020.pdf"
        "vigencia" = "2021"
    }
    "2021" = @{
        "numero" = "022"
        "url" = "https://hdsa.gov.co/wp-content/uploads/2020/06/ACUERDO-022-DEL-14-DIC-202.pdf"
        "vigencia" = "2022"
    }
    "2022" = @{
        "numero" = "024"
        "url" = "https://hdsa.gov.co/wp-content/uploads/2020/06/Acuerdo-024-2022-Presupuesto-Vigencia-2023.pdf"
        "vigencia" = "2023"
    }
    "2023" = @{
        "numero" = "021"
        "url" = "https://hdsa.gov.co/wp-content/uploads/2020/06/Acuerdo-021-2023-Presupuesto-Vigencia-2024.pdf"
        "vigencia" = "2024"
    }
}

foreach ($year in $acuerdos.Keys) {
    $acuerdo = $acuerdos[$year]
    $outputFile = "documentos\planeacion\presupuesto\acuerdos\Acuerdo-${year}-${($acuerdo.numero)}.pdf"
    Download-File -url $acuerdo.url -outputPath $outputFile
}

Write-Host "Proceso de descarga completado." -ForegroundColor Green
