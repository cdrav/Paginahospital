// scripts/preparar-publicacion.js — Copia a _site/ solo lo que debe publicarse en hdsa.gov.co.
// Lo usa .github/workflows/deploy.yml (después de npm run build:search). Uso local: node scripts/preparar-publicacion.js
//
// Para dejar de publicar algo, agréguelo a EXCLUIR (ruta desde la raíz del repositorio).

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const DESTINO = path.join(RAIZ, '_site');

// Carpetas y archivos que NO se publican (rutas exactas desde la raíz, con "/")
const EXCLUIR = new Set([
  // Control de versiones, editor y despliegue
  '.git', '.github', '.vscode', '.gitignore', '.gitattributes', '_site',
  // Dependencias, herramientas y código interno
  'node_modules', 'scripts', 'apps-script', 'netlify', 'firebase',
  'package.json', 'package-lock.json', 'test-node.js', 'test-output.txt', 'limpiar-cache.js', 'server-local.js',
  // Configuración de otros hostings y registros
  'netlify.toml', '_redirects', 'cors.json', 'conversion-log.txt', '.netlify',
  'data/LEEME-noticias.md',
  // Word con versión PDF publicada o borradores sin enlace en el sitio
  'documentos/HORARIOS-DE-ATENCION-HDSA.docx',
  'documentos/Libro de marca - HDSA - version 1 - revisado y aprobado.docx',
  'documentos/PLAN DE DESARROLLO INSTITUCIONAL.docx',
  'documentos/derechos-y-deberes-de-los-pacientes/Carta del trato digno - Pag web.docx',
  'documentos/Seccion noticias HDSA/Certificado de discapacidad/Certificado de discapcidad.docx',
  'documentos/Seccion noticias HDSA/Colombina dotacion/Colombina dotacion hospital.docx',
  'documentos/Seccion noticias HDSA/Colombina dotacion/Enlaces para video de noticias.docx',
  'documentos/Seccion noticias HDSA/Encuentro del club de diabeticos e hipertensos/Texto.docx',
  'documentos/Seccion noticias HDSA/Enlaces para video de noticias.docx'
]);

// Archivos que nunca se publican, estén donde estén
const EXCLUIR_NOMBRE = [
  /^~\$/,                 // temporales de Office
  /^\.env(\..*)?$/,       // variables de entorno
  /\.(key|pem|crt|p12|pfx)$/i,
  /^(service-account|clave-citas-online)\.json$/i,
  /^Thumbs\.db$/i, /^\.DS_Store$/
];

let copiados = 0;
let bytes = 0;
const omitidos = [];

function copiar(relativa) {
  const origen = path.join(RAIZ, relativa);
  for (const entrada of fs.readdirSync(origen, { withFileTypes: true })) {
    const rel = relativa ? relativa + '/' + entrada.name : entrada.name;
    if (EXCLUIR.has(rel) || EXCLUIR_NOMBRE.some(re => re.test(entrada.name))) { omitidos.push(rel); continue; }
    if (entrada.isSymbolicLink()) { omitidos.push(rel + ' (enlace simbólico)'); continue; }
    if (entrada.isDirectory()) {
      fs.mkdirSync(path.join(DESTINO, rel), { recursive: true });
      copiar(rel);
    } else if (entrada.isFile()) {
      fs.copyFileSync(path.join(RAIZ, rel), path.join(DESTINO, rel));
      copiados++;
      bytes += fs.statSync(path.join(RAIZ, rel)).size;
    }
  }
}

fs.rmSync(DESTINO, { recursive: true, force: true });
fs.mkdirSync(DESTINO);
copiar('');

console.log(`Publicación preparada en _site/: ${copiados} archivos (${(bytes / 1048576).toFixed(1)} MB).`);
console.log(`Omitidos (${omitidos.length}):\n  ` + omitidos.join('\n  '));

// ---------------------------------------------------------------------------
// Ajustes a las páginas publicadas (solo en _site/, el repositorio no cambia)
//  1. Header y footer dentro del HTML: la página no depende de JavaScript para
//     mostrar el menú y no "salta" al cargarlo. js/layout.js detecta el atributo
//     data-parcial-incluido y no los vuelve a descargar.
//  2. Versión automática de CSS y JS (?v=<huella del contenido>): cuando un
//     archivo cambia, los navegadores descargan la versión nueva; si no cambia,
//     siguen usando la de su caché.
// ---------------------------------------------------------------------------
const crypto = require('crypto');

function listar(dir, ext, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listar(p, ext, out);
    else if (ext.test(e.name)) out.push(p);
  }
  return out;
}

const huellas = new Map(); // ruta absoluta en _site -> huella
for (const f of listar(DESTINO, /\.(css|js)$/i)) {
  huellas.set(path.resolve(f), crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex').slice(0, 10));
}

function versionar(html, archivoHtml) {
  return html.replace(/(<(?:script|link)\b[^>]*?\s(?:src|href)=")([^"?#]+\.(?:css|js))(?:\?[^"#]*)?(")/gi, (m, a, url, z) => {
    if (/^(?:[a-z]+:)?\/\//i.test(url)) return m; // externos (CDN)
    const destino = url.startsWith('/')
      ? path.join(DESTINO, url)
      : path.join(path.dirname(archivoHtml), url);
    const h = huellas.get(path.resolve(destino));
    return h ? `${a}${url}?v=${h}${z}` : m;
  });
}

const parcial = nombre => {
  const p = path.join(DESTINO, 'partials', nombre);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
};
const PARCIALES = { 'header-placeholder': parcial('header.html'), 'footer-placeholder': parcial('footer.html') };

// ---------------------------------------------------------------------------
//  3. Metadatos para compartir (Open Graph / Twitter) y <link rel="canonical">:
//     al pegar un enlace en WhatsApp, Facebook, etc. sale título, descripción
//     e imagen. Se toman del <title> y <meta name="description"> de cada página.
//  4. sitemap.xml con las páginas públicas (robots.txt ya lo anuncia).
//  Las páginas con <meta name="robots" content="noindex"> y las de PRIVADAS
//  no llevan estos metadatos ni van en el sitemap.
// ---------------------------------------------------------------------------
const SITIO = 'https://hdsa.gov.co/';
const NOMBRE_SITIO = 'Hospital Departamental San Antonio';
const IMAGEN_COMPARTIR = { url: SITIO + 'imagenes/compartir-hdsa.jpg', ancho: 1200, alto: 630, alt: 'Vista aérea del Hospital Departamental San Antonio en Roldanillo, Valle del Cauca' };
const PRIVADAS = new Set(['login-institucional.html', 'manual-gestion-citas.html']);
const FUERA_DEL_SITEMAP = new Set(['buscar.html']); // tienen metadatos, pero no aportan al buscador
const urlsSitemap = [];
let conMetadatos = 0;

const atributo = s => s.replace(/\s+/g, ' ').trim().replace(/"/g, '&quot;');

function metadatos(html, archivoHtml) {
  const rel = path.relative(DESTINO, archivoHtml).split(path.sep).join('/');
  if (PRIVADAS.has(rel) || /<meta\s+name=["']robots["'][^>]*noindex/i.test(html)) return html;
  const url = rel === 'index.html' ? SITIO : SITIO + encodeURI(rel);
  if (!FUERA_DEL_SITEMAP.has(rel)) urlsSitemap.push(url);
  if (/property=["']og:/i.test(html)) return html;

  const titulo = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  const descripcion = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || [])[1];
  if (!titulo) return html;
  const t = atributo(titulo), d = descripcion ? atributo(descripcion) : '';
  const etiquetas = [
    /rel=["']canonical["']/i.test(html) ? '' : `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${NOMBRE_SITIO}">`,
    `<meta property="og:locale" content="es_CO">`,
    `<meta property="og:title" content="${t}">`,
    d && `<meta property="og:description" content="${d}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${IMAGEN_COMPARTIR.url}">`,
    `<meta property="og:image:width" content="${IMAGEN_COMPARTIR.ancho}">`,
    `<meta property="og:image:height" content="${IMAGEN_COMPARTIR.alto}">`,
    `<meta property="og:image:alt" content="${IMAGEN_COMPARTIR.alt}">`,
    `<meta name="twitter:card" content="summary_large_image">`
  ].filter(Boolean).join('\n    ');
  conMetadatos++;
  return html.replace(/<\/head>/i, `    ${etiquetas}\n</head>`);
}

let paginas = 0, incluidos = 0, versionados = 0;
for (const f of listar(DESTINO, /\.html$/i)) {
  if (f.includes(path.sep + 'partials' + path.sep)) continue;
  let html = fs.readFileSync(f, 'utf8');
  const original = html;
  for (const [id, contenido] of Object.entries(PARCIALES)) {
    if (!contenido) continue;
    // Solo contenedores vacíos: <div id="header-placeholder"></div> / <footer id="footer-placeholder" ...></footer>
    const re = new RegExp(`<(div|footer|header)(\\b[^>]*\\bid="${id}"[^>]*)>\\s*</\\1>`);
    html = html.replace(re, (m, tag, attrs) => { incluidos++; return `<${tag}${attrs} data-parcial-incluido>\n${contenido}\n</${tag}>`; });
  }
  const antes = html;
  html = versionar(html, f);
  if (html !== antes) versionados++;
  html = metadatos(html, f);
  if (html !== original) { fs.writeFileSync(f, html); paginas++; }
}
console.log(`Páginas ajustadas: ${paginas} (parciales insertados: ${incluidos}; con versión automática de CSS/JS: ${versionados}; con metadatos para compartir: ${conMetadatos}).`);

urlsSitemap.sort((a, b) => (a === SITIO ? -1 : b === SITIO ? 1 : a.localeCompare(b)));
fs.writeFileSync(path.join(DESTINO, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urlsSitemap.map(u => `  <url><loc>${u}</loc></url>`).join('\n') + '\n</urlset>\n');
console.log(`sitemap.xml: ${urlsSitemap.length} páginas.`);
