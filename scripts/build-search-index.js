const fs = require('fs/promises');
const path = require('path');
const cheerio = require('cheerio');
const { glob } = require('glob');

const PROJECT_ROOT = path.join(__dirname, '..');
const HTML_FILES_PATTERN = '**/*.html';
// Excluimos directorios que no contienen páginas públicas
const EXCLUDE_PATTERNS = ['node_modules/**', 'partials/**', 'documentos/Portal-institucional/**',
    // Páginas internas del portal (requieren inicio de sesión)
    'portal-*.html', 'login-institucional.html', 'manual-gestion-citas.html'];
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'search-index.json');

/**
 * Extrae el contenido textual relevante de un elemento Cheerio.
 * @param {cheerio.CheerioAPI} $ - La instancia de Cheerio.
 * @param {string} selector - El selector para el contenido principal.
 * @returns {string} - El texto extraído y normalizado.
 */
function extractContent($, selector) {
    const contentEl = $(selector);
    // Eliminar elementos que no aportan a la búsqueda (scripts, menús, etc.)
    contentEl.find('script, style, nav, footer, .no-search, .accessibility-buttons-container').remove();
    // Obtener texto y normalizar múltiples espacios a uno solo
    return contentEl.text().replace(/\s\s+/g, ' ').trim();
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * Cada noticia de data/noticias.json se indexa por separado. La URL lleva el ancla
 * #noticia-<id>, que js/noticias.js usa para abrir la página del listado donde está
 * la noticia y resaltarla.
 */
async function indexarNoticias() {
    let lista;
    try {
        lista = JSON.parse(await fs.readFile(path.join(PROJECT_ROOT, 'data', 'noticias.json'), 'utf-8'));
    } catch (error) {
        console.warn('⚠️  No se pudieron indexar las noticias:', error.message);
        return [];
    }
    return lista.filter(n => n && n.id && n.titulo).map(n => {
        const [a, m, d] = String(n.fecha || '').split('-').map(Number);
        const fecha = a && m && d ? `${d} de ${MESES[m - 1]} de ${a}` : '';
        const detalle = n.detalle && n.detalle.texto ? cheerio.load(n.detalle.texto).text() : '';
        const enlaces = (n.enlaces || []).map(e => e.texto).join('. ');
        const content = [n.resumen, detalle, n.etiqueta, enlaces, fecha && `Publicada el ${fecha}.`]
            .filter(Boolean).join(' ').replace(/\s\s+/g, ' ').trim();
        return {
            url: `noticias.html#noticia-${n.id}`,
            title: `${n.titulo} - Noticias`,
            content,
        };
    });
}

async function buildSearchIndex() {
    console.log('Iniciando la construcción del índice de búsqueda...');

    try {
        const htmlFiles = await glob(HTML_FILES_PATTERN, {
            cwd: PROJECT_ROOT,
            ignore: EXCLUDE_PATTERNS,
            nodir: true,
        });

        console.log(`Se encontraron ${htmlFiles.length} archivos HTML para indexar.`);

        const searchData = [];

        for (const file of htmlFiles) {
            const filePath = path.join(PROJECT_ROOT, file);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const $ = cheerio.load(fileContent);

            const title = $('title').text().trim() || file;
            // Priorizar el contenido dentro de <main>, y usar <body> como fallback
            const content = extractContent($, 'main') || extractContent($, 'body');

            if (content) {
                searchData.push({
                    url: file.replace(/\\/g, '/'), // Normalizar paths para la web
                    title: title,
                    content: content,
                });
            }
        }

        const noticias = await indexarNoticias();
        searchData.push(...noticias);

        await fs.writeFile(OUTPUT_PATH, JSON.stringify(searchData, null, 2));
        console.log(`✅ Índice de búsqueda creado exitosamente en: ${OUTPUT_PATH}`);
        console.log(`   Se indexaron ${searchData.length - noticias.length} páginas y ${noticias.length} noticias.`);

    } catch (error) {
        console.error('❌ Error al construir el índice de búsqueda:', error);
        process.exit(1);
    }
}

buildSearchIndex();

