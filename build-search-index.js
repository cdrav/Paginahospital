const fs = require('fs/promises');
const path = require('path');
const cheerio = require('cheerio');
const { glob } = require('glob');

const PROJECT_ROOT = path.join(__dirname, '..');
const HTML_FILES_PATTERN = '**/*.html';
// Excluimos directorios que no contienen páginas públicas
const EXCLUDE_PATTERNS = ['node_modules/**', 'partials/**'];
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
    contentEl.find('script, style, nav, footer, aside, .no-search, .accessibility-buttons-container').remove();
    // Obtener texto y normalizar múltiples espacios a uno solo
    return contentEl.text().replace(/\s\s+/g, ' ').trim();
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

        await fs.writeFile(OUTPUT_PATH, JSON.stringify(searchData, null, 2));
        console.log(`✅ Índice de búsqueda creado exitosamente en: ${OUTPUT_PATH}`);
        console.log(`   Se indexaron ${searchData.length} páginas.`);

    } catch (error) {
        console.error('❌ Error al construir el índice de búsqueda:', error);
        process.exit(1);
    }
}

buildSearchIndex();