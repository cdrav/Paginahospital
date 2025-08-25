# Create the directory structure if it doesn't exist
$baseDir = "documentos\talento-humano"
$sgsstDir = "$baseDir\sgsst"
$planesTrabajoDir = "$sgsstDir\planes-trabajo"
$politicasDir = "$sgsstDir\politicas"
$planesEstrategicosDir = "$baseDir\planes-estrategicos"
$resolucionesDir = "$baseDir\resoluciones"
$manualesDir = "$baseDir\manuales"
$estandaresDir = "$baseDir\estandares"
$capacitacionesDir = "$baseDir\capacitaciones"
$bienestarSocialDir = "$baseDir\bienestar-social"

# Create directories if they don't exist
@($planesTrabajoDir, $politicasDir, $planesEstrategicosDir, $resolucionesDir, $manualesDir, $estandaresDir, $capacitacionesDir, $bienestarSocialDir) | ForEach-Object {
    if (-not (Test-Path -Path $_)) {
        New-Item -ItemType Directory -Force -Path $_ | Out-Null
    }
}

# Function to download a file
function Download-File {
    param (
        [string]$url,
        [string]$outputPath
    )
    
    try {
        Write-Host "Downloading $url to $outputPath"
        Invoke-WebRequest -Uri $url -OutFile $outputPath -UseBasicParsing
        return $true
    }
    catch {
        Write-Host "Error downloading $url : $_"
        return $false
    }
}

# Download SGSST documents
$documents = @(
    @{url = "https://hdsa.gov.co/wp-content/uploads/2022/01/PLAN-DE-DE-TRABAJO-ANUAL-2022-APROBADO-Y-FIRMADO.pdf"; path = "$planesTrabajoDir\Plan-Trabajo-SGSST-2022.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/Politica-de-Seguridad-y-Salud-en-el-Trabajo-2022.pdf"; path = "$politicasDir\Politica-SST-2022.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/PLAN-DE-TRABAJO-ANUAL-SG-SST-HDSA-2023.pdf"; path = "$planesTrabajoDir\Plan-Trabajo-SGSST-2023.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/POLITICA-DE-SG-SST-HDSA-2023.pdf"; path = "$politicasDir\Politica-SST-2023.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/PLAN-ESTRATEGICO-TH-2023.pdf"; path = "$planesEstrategicosDir\Plan-Estrategico-TH-2023.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2023/01/RES_00022_ADOPCION_PIBS2023.pdf"; path = "$resolucionesDir\Resolucion-022-2023-Plan-Bienestar-Social.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/RES.-00025-ADOPCION-PLAN-INSTITUCIONAL-PIC-2023.pdf"; path = "$resolucionesDir\Resolucion-025-2023-Plan-Capacitacion.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/Plan-Prevision-Recursos-Humanos-2023.pdf"; path = "$planesEstrategicosDir\Plan-Prevision-RH-2023.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/MANUAL-SG-SST.pdf"; path = "$manualesDir\Manual-SGSST-2023.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2024/01/PLAN-DE-TRABAJO-ANUAL-SG-SST-2024.pdf"; path = "$planesTrabajoDir\Plan-Trabajo-SGSST-2024.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2024/01/POLITICA-DE-SEGURIDAD-Y-SALUD-EN-EL-TRABAJO-2024.pdf"; path = "$politicasDir\Politica-SST-2024.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2023/01/RES_00022_ADOPCION_PIBS2023.pdf"; path = "$resolucionesDir\Resolucion-025-2024-Plan-Bienestar-Social.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/Comite-Convivencia-Laboral-2023-2025.pdf"; path = "$resolucionesDir\Resolucion-098-2023-Comite-Convivencia.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/Resolucion-000125-Comision-de-Personal-HDSA-ESE-2022-2024.pdf"; path = "$resolucionesDir\Resolucion-0125-2022-Comision-Personal.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/ESTANDARES-MNIMOS-VIGENCIA-2023.pdf"; path = "$estandaresDir\Estandares-Minimos-SGSST-2023.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/Resolucion-000125-Comision-de-Personal-HDSA-ESE-2022-2024.pdf"; path = "$estandaresDir\Plan-Mejoa-Estandares-Minimos-2023.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/Constancia-realizacion-estandares-minimos-2023-1.pdf"; path = "$estandaresDir\Constancia-Estandares-Minimos-2023.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/F6_-EVALUAC_CAPACIT.pdf"; path = "$capacitacionesDir\Formato-Evaluacion-Capacitaciones.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2025/01/POLITICA-DE-SISTEMA-DE-GESTION-DE-SEGURIDAD-Y-SALUD-EN-EL-TRABAJO-2025.pdf"; path = "$politicasDir\Politica-SST-2025.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2025/01/PLAN-DE-TRABAJO-ANUAL-2025.pdf"; path = "$planesTrabajoDir\Plan-Trabajo-SGSST-2025.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2025/01/PLAN-INTEGRAL-DE-CAPACITACION-SG-SST-2025.pdf"; path = "$capacitacionesDir\Plan-Integral-Capacitaciones-2025.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2025/01/FECHAS-CAPACITACION-BRIGADA-Y-COMITE-HOSPITALARIO-DE-EMERGENCIA.pdf"; path = "$capacitacionesDir\Cronograma-Capacitacion-Brigadas-2025.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/PLAN-ESTRATEGICO-TH-2025.pdf"; path = "$planesEstrategicosDir\Plan-Estrategico-TH-2025.pdf"},
    @{url = "https://hdsa.gov.co/wp-content/uploads/2020/06/RES.-00079-MARZO-04-25-CREA-Y-REGLAMENTA-EL-COMITE-DE-BIENESTAR-SOCIAL-ESTIMULOS-E-INCENTIVOS-Y-CONVALIDA-UNAS-ELECCIONES.pdf"; path = "$resolucionesDir\Resolucion-079-2025-Comite-Bienestar-Social.pdf"}
)

# Download all documents
$successful = 0
$failed = 0

foreach ($doc in $documents) {
    if (Download-File -url $doc.url -outputPath $doc.path) {
        $successful++
    } else {
        $failed++
    }
}

Write-Host "Download complete. Success: $successful, Failed: $failed"

# Create a summary file
$summary = @"
# Resumen de Documentos de Talento Humano y SGSST

## Planes de Trabajo SGSST
- Plan de Trabajo SGSST 2022: documentos/talento-humano/sgsst/planes-trabajo/Plan-Trabajo-SGSST-2022.pdf
- Plan de Trabajo SGSST 2023: documentos/talento-humano/sgsst/planes-trabajo/Plan-Trabajo-SGSST-2023.pdf
- Plan de Trabajo SGSST 2024: documentos/talento-humano/sgsst/planes-trabajo/Plan-Trabajo-SGSST-2024.pdf
- Plan de Trabajo SGSST 2025: documentos/talento-humano/sgsst/planes-trabajo/Plan-Trabajo-SGSST-2025.pdf

## Políticas de Seguridad y Salud en el Trabajo
- Política SST 2022: documentos/talento-humano/sgsst/politicas/Politica-SST-2022.pdf
- Política SST 2023: documentos/talento-humano/sgsst/politicas/Politica-SST-2023.pdf
- Política SST 2024: documentos/talento-humano/sgsst/politicas/Politica-SST-2024.pdf
- Política SST 2025: documentos/talento-humano/sgsst/politicas/Politica-SST-2025.pdf

## Planes Estratégicos
- Plan Estratégico TH 2023: documentos/talento-humano/planes-estrategicos/Plan-Estrategico-TH-2023.pdf
- Plan Estratégico TH 2025: documentos/talento-humano/planes-estrategicos/Plan-Estrategico-TH-2025.pdf
- Plan Previsión RH 2023: documentos/talento-humano/planes-estrategicos/Plan-Prevision-RH-2023.pdf

## Resoluciones
- Resolución 022-2023 Plan Bienestar Social: documentos/talento-humano/resoluciones/Resolucion-022-2023-Plan-Bienestar-Social.pdf
- Resolución 025-2023 Plan Capacitación: documentos/talento-humano/resoluciones/Resolucion-025-2023-Plan-Capacitacion.pdf
- Resolución 025-2024 Plan Bienestar Social: documentos/talento-humano/resoluciones/Resolucion-025-2024-Plan-Bienestar-Social.pdf
- Resolución 098-2023 Comité Convivencia: documentos/talento-humano/resoluciones/Resolucion-098-2023-Comite-Convivencia.pdf
- Resolución 0125-2022 Comisión Personal: documentos/talento-humano/resoluciones/Resolucion-0125-2022-Comision-Personal.pdf
- Resolución 079-2025 Comité Bienestar Social: documentos/talento-humano/resoluciones/Resolucion-079-2025-Comite-Bienestar-Social.pdf

## Manuales
- Manual SGSST 2023: documentos/talento-humano/manuales/Manual-SGSST-2023.pdf

## Estándares Mínimos SGSST 2023
- Estándares Mínimos: documentos/talento-humano/estandares/Estandares-Minimos-SGSST-2023.pdf
- Plan de Mejora: documentos/talento-humano/estandares/Plan-Mejoa-Estandares-Minimos-2023.pdf
- Constancia: documentos/talento-humano/estandares/Constancia-Estandares-Minimos-2023.pdf

## Capacitaciones
- Plan Integral Capacitaciones 2025: documentos/talento-humano/capacitaciones/Plan-Integral-Capacitaciones-2025.pdf
- Cronograma Capacitación Brigadas 2025: documentos/talento-humano/capacitaciones/Cronograma-Capacitacion-Brigadas-2025.pdf
- Formato Evaluación: documentos/talento-humano/capacitaciones/Formato-Evaluacion-Capacitaciones.pdf
"@

$summary | Out-File -FilePath "$baseDir\resumen-documentos.md" -Encoding utf8
Write-Host "Resumen creado en: $baseDir\resumen-documentos.md"
