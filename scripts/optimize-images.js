/**
 * Optimización incremental de imágenes a WebP
 * 
 * USO:
 *   npm run images              → Convierte NUEVAS imágenes (que no tengan .webp)
 *   npm run images -- --all     → Reconvierte TODAS las imágenes
 *   npm run images -- --dir imagenes/nueva-carpeta  → Solo una carpeta específica
 * 
 * Las imágenes originales se eliminan tras la conversión exitosa.
 * Los archivos en /imagenes/icons/ se excluyen (favicons).
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const CONVERT_ALL = args.includes('--all');
const DIR_FLAG = args.indexOf('--dir');
const SPECIFIC_DIR = DIR_FLAG !== -1 ? path.resolve(ROOT, args[DIR_FLAG + 1]) : null;

const SKIP_DIRS = ['node_modules', '.git', '.github', '.vscode', path.join('imagenes', 'icons')];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png'];
const REF_EXTS = ['.html', '.css', '.js', '.json', '.webmanifest'];
const SKIP_REF_FILES = ['package.json', 'package-lock.json', 'optimize-images.js', 'convert-to-webp.js'];

function shouldSkipDir(dirPath) {
  const rel = path.relative(ROOT, dirPath);
  return SKIP_DIRS.some(skip => rel === skip || rel.startsWith(skip + path.sep));
}

function walkDir(dir, fileList = []) {
  if (shouldSkipDir(dir)) return fileList;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDir(fullPath, fileList);
      else fileList.push(fullPath);
    }
  } catch (e) { /* skip inaccessible dirs */ }
  return fileList;
}

function findNewImages() {
  const searchDir = SPECIFIC_DIR || ROOT;
  const allFiles = walkDir(searchDir);
  return allFiles.filter(f => {
    const ext = path.extname(f).toLowerCase();
    if (!IMAGE_EXTS.includes(ext)) return false;
    if (CONVERT_ALL) return true;
    const webpPath = f.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    return !fs.existsSync(webpPath);
  });
}

async function convertImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  try {
    const inputBuffer = fs.readFileSync(inputPath);
    const quality = ext === '.png' ? 85 : 80;
    const outputBuffer = await sharp(inputBuffer)
      .rotate() // Auto-rotar según EXIF
      .webp({ quality, lossless: false })
      .toBuffer();
    fs.writeFileSync(outputPath, outputBuffer);
    return {
      input: inputPath, output: outputPath,
      inputSize: inputBuffer.length, outputSize: outputBuffer.length,
      saved: inputBuffer.length - outputBuffer.length, success: true
    };
  } catch (err) {
    console.error(`  ✗ Error: ${path.relative(ROOT, inputPath)}: ${err.message}`);
    return { input: inputPath, success: false };
  }
}

function updateReferences(convertedFiles) {
  const oldToNew = new Map();
  for (const f of convertedFiles) {
    const relOld = path.relative(ROOT, f.input).replace(/\\/g, '/');
    const relNew = path.relative(ROOT, f.output).replace(/\\/g, '/');
    const oldName = path.basename(f.input);
    const newName = path.basename(f.output);
    oldToNew.set(oldName, newName);
    oldToNew.set(relOld, relNew);
  }

  if (oldToNew.size === 0) return 0;

  const refFiles = walkDir(ROOT).filter(f => {
    const ext = path.extname(f).toLowerCase();
    const basename = path.basename(f);
    return REF_EXTS.includes(ext) && !SKIP_REF_FILES.includes(basename);
  });

  let updated = 0;
  for (const filePath of refFiles) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    for (const [oldStr, newStr] of oldToNew) {
      if (content.includes(oldStr)) {
        content = content.split(oldStr).join(newStr);
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      updated++;
      console.log(`  ✓ Ref: ${path.relative(ROOT, filePath)}`);
    }
  }
  return updated;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function main() {
  console.log('\n🖼️  Optimización de imágenes a WebP\n');

  const images = findNewImages();
  if (images.length === 0) {
    console.log('✅ No hay imágenes nuevas para convertir.\n');
    return;
  }

  console.log(`📷 ${images.length} imagen(es) por convertir...\n`);

  const results = [];
  for (const img of images) {
    const r = await convertImage(img);
    if (r.success) {
      const pct = ((r.saved / r.inputSize) * 100).toFixed(1);
      console.log(`  ✓ ${path.relative(ROOT, img)} → ${formatBytes(r.outputSize)} (${pct}%)`);
    }
    results.push(r);
  }

  const ok = results.filter(r => r.success);

  console.log('\n📝 Actualizando referencias...');
  const refCount = updateReferences(ok);

  console.log('\n🗑️  Eliminando originales...');
  let deleted = 0;
  for (const r of ok) {
    if (fs.existsSync(r.input)) { fs.unlinkSync(r.input); deleted++; }
  }

  const totalIn = ok.reduce((s, r) => s + r.inputSize, 0);
  const totalOut = ok.reduce((s, r) => s + r.outputSize, 0);
  console.log(`\n✅ Listo: ${ok.length} convertidas, ${refCount} archivos actualizados`);
  console.log(`   Ahorro: ${formatBytes(totalIn - totalOut)} (${totalIn > 0 ? ((1 - totalOut/totalIn) * 100).toFixed(1) : 0}%)\n`);
}

if (require.main === module) {
  main().catch(err => { console.error('Error:', err); process.exit(1); });
}

module.exports = { shouldSkipDir, walkDir, formatBytes, findNewImages, convertImage, updateReferences };
