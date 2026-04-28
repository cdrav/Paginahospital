/**
 * Script de conversión de imágenes JPG/JPEG/PNG a WebP
 * - Convierte todas las imágenes del proyecto (excepto favicons/icons)
 * - Actualiza todas las referencias en HTML, CSS y JS
 * - Elimina los archivos originales tras la conversión exitosa
 * - Genera un reporte de ahorro de espacio
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOG_FILE = path.join(ROOT, 'conversion-log.txt');

// Redirigir toda la salida a un archivo de log
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'w' });
const origLog = console.log;
const origErr = console.error;
console.log = (...args) => { const msg = args.join(' '); origLog(msg); logStream.write(msg + '\n'); };
console.error = (...args) => { const msg = args.join(' '); origErr(msg); logStream.write(msg + '\n'); };

// Carpetas a excluir de la conversión
const SKIP_DIRS = [
  'node_modules',
  '.git',
  '.github',
  '.vscode',
  path.join('imagenes', 'icons'), // Favicons deben seguir como PNG
];

// Extensiones a convertir
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png'];

// Archivos donde se deben actualizar las referencias
const REF_EXTS = ['.html', '.css', '.js', '.json'];
const SKIP_REF_FILES = [
  'package.json',
  'package-lock.json',
  'convert-to-webp.js',
];

// ── Utilidades ──────────────────────────────────────────

function shouldSkipDir(dirPath) {
  const rel = path.relative(ROOT, dirPath);
  return SKIP_DIRS.some(skip => rel === skip || rel.startsWith(skip + path.sep));
}

function walkDir(dir, fileList = []) {
  if (shouldSkipDir(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// ── Paso 1: Encontrar todas las imágenes a convertir ───

function findImages() {
  const allFiles = walkDir(ROOT);
  return allFiles.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return IMAGE_EXTS.includes(ext);
  });
}

// ── Paso 2: Convertir imágenes a WebP ──────────────────

async function convertImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

  try {
    const inputBuffer = fs.readFileSync(inputPath);
    const inputSize = inputBuffer.length;

    let sharpInstance = sharp(inputBuffer);

    // Calidad según tipo
    if (ext === '.png') {
      // PNG puede tener transparencia, usar calidad alta sin pérdida
      sharpInstance = sharpInstance.webp({ quality: 85, lossless: false });
    } else {
      // JPG/JPEG: calidad 80 es buen balance
      sharpInstance = sharpInstance.webp({ quality: 80 });
    }

    const outputBuffer = await sharpInstance.toBuffer();
    const outputSize = outputBuffer.length;

    // Solo guardar WebP si es más pequeño (o aceptar cualquier tamaño para uniformidad)
    fs.writeFileSync(outputPath, outputBuffer);

    return {
      input: inputPath,
      output: outputPath,
      inputSize,
      outputSize,
      saved: inputSize - outputSize,
      success: true,
    };
  } catch (err) {
    console.error(`  ✗ Error convirtiendo ${inputPath}: ${err.message}`);
    return { input: inputPath, success: false, error: err.message };
  }
}

// ── Paso 3: Actualizar referencias en archivos ─────────

function findRefFiles() {
  const allFiles = walkDir(ROOT);
  return allFiles.filter(f => {
    const ext = path.extname(f).toLowerCase();
    const basename = path.basename(f);
    return REF_EXTS.includes(ext) && !SKIP_REF_FILES.includes(basename);
  });
}

function updateReferences(refFiles, convertedMap) {
  let totalUpdated = 0;

  for (const filePath of refFiles) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Reemplazar todas las extensiones de imagen en las rutas
    // Esto cubre: src="...", url('...'), href="...", foto: "..."
    const newContent = content.replace(
      /(\b|['"/])([^'"\s)}>]+)\.(jpg|jpeg|png)(\b|['"\s)}>])/gi,
      (match, prefix, name, ext, suffix) => {
        // No reemplazar URLs externas (YouTube, CDN, etc.)
        if (name.includes('://') || name.includes('ytimg.com')) {
          return match;
        }
        // No reemplazar en la carpeta icons (favicons)
        if (name.includes('/icons/') || name.includes('\\icons\\')) {
          return match;
        }
        modified = true;
        return `${prefix}${name}.webp${suffix}`;
      }
    );

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      totalUpdated++;
      console.log(`  ✓ Actualizado: ${path.relative(ROOT, filePath)}`);
    }
  }

  return totalUpdated;
}

// ── Paso 4: Eliminar archivos originales ────────────────

function deleteOriginals(results) {
  let deleted = 0;
  for (const r of results) {
    if (r.success && fs.existsSync(r.input)) {
      fs.unlinkSync(r.input);
      deleted++;
    }
  }
  return deleted;
}

// ── Formateo ────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ── Main ────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   Conversión de imágenes a WebP - HDSA          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // 1. Encontrar imágenes
  const images = findImages();
  console.log(`📷 Imágenes encontradas: ${images.length}\n`);

  if (images.length === 0) {
    console.log('No hay imágenes para convertir.');
    return;
  }

  // 2. Convertir
  console.log('🔄 Convirtiendo imágenes...\n');
  const results = [];
  for (const img of images) {
    const result = await convertImage(img);
    if (result.success) {
      const pct = ((result.saved / result.inputSize) * 100).toFixed(1);
      console.log(
        `  ✓ ${path.relative(ROOT, img)} → ${formatBytes(result.inputSize)} → ${formatBytes(result.outputSize)} (${pct}% reducción)`
      );
    }
    results.push(result);
  }

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  // 3. Actualizar referencias en HTML, CSS, JS
  console.log('\n📝 Actualizando referencias en archivos...\n');
  const refFiles = findRefFiles();
  const updatedCount = updateReferences(refFiles, successful);

  // 4. Eliminar originales
  console.log('\n🗑️  Eliminando archivos originales...');
  const deletedCount = deleteOriginals(successful);
  console.log(`  ${deletedCount} archivos originales eliminados.\n`);

  // 5. Reporte final
  const totalInputSize = successful.reduce((sum, r) => sum + r.inputSize, 0);
  const totalOutputSize = successful.reduce((sum, r) => sum + r.outputSize, 0);
  const totalSaved = totalInputSize - totalOutputSize;
  const pctSaved = totalInputSize > 0 ? ((totalSaved / totalInputSize) * 100).toFixed(1) : 0;

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║                REPORTE FINAL                    ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Imágenes convertidas:  ${successful.length.toString().padStart(4)}                    ║`);
  console.log(`║  Errores:               ${failed.length.toString().padStart(4)}                    ║`);
  console.log(`║  Archivos actualizados: ${updatedCount.toString().padStart(4)}                    ║`);
  console.log(`║  Tamaño original:       ${formatBytes(totalInputSize).padStart(12)}            ║`);
  console.log(`║  Tamaño WebP:           ${formatBytes(totalOutputSize).padStart(12)}            ║`);
  console.log(`║  Espacio ahorrado:      ${formatBytes(totalSaved).padStart(12)} (${pctSaved}%)    ║`);
  console.log('╚══════════════════════════════════════════════════╝');

  if (failed.length > 0) {
    console.log('\n⚠️  Imágenes con error:');
    for (const f of failed) {
      console.log(`  - ${path.relative(ROOT, f.input)}: ${f.error}`);
    }
  }
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
