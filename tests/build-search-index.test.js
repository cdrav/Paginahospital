const cheerio = require('cheerio');
const { extractContent } = require('../scripts/build-search-index');

describe('extractContent', () => {
  test('extracts text from a simple element', () => {
    const $ = cheerio.load('<main><p>Hello world</p></main>');
    expect(extractContent($, 'main')).toBe('Hello world');
  });

  test('removes script tags from content', () => {
    const html = '<main><p>Visible text</p><script>var x = 1;</script></main>';
    const $ = cheerio.load(html);
    expect(extractContent($, 'main')).toBe('Visible text');
  });

  test('removes style tags from content', () => {
    const html = '<main><p>Styled text</p><style>.x { color: red; }</style></main>';
    const $ = cheerio.load(html);
    expect(extractContent($, 'main')).toBe('Styled text');
  });

  test('removes nav elements from content', () => {
    const html = '<main><nav>Menu</nav><p>Page content</p></main>';
    const $ = cheerio.load(html);
    expect(extractContent($, 'main')).toBe('Page content');
  });

  test('removes footer elements from content', () => {
    const html = '<main><p>Main content</p><footer>Footer info</footer></main>';
    const $ = cheerio.load(html);
    expect(extractContent($, 'main')).toBe('Main content');
  });

  test('removes elements with .no-search class', () => {
    const html = '<main><p>Searchable</p><div class="no-search">Hidden</div></main>';
    const $ = cheerio.load(html);
    expect(extractContent($, 'main')).toBe('Searchable');
  });

  test('removes .accessibility-buttons-container', () => {
    const html = '<main><p>Content</p><div class="accessibility-buttons-container">Buttons</div></main>';
    const $ = cheerio.load(html);
    expect(extractContent($, 'main')).toBe('Content');
  });

  test('normalizes multiple whitespace to single space', () => {
    const html = '<main><p>Word1</p>   <p>Word2</p>  <p>Word3</p></main>';
    const $ = cheerio.load(html);
    const result = extractContent($, 'main');
    expect(result).not.toMatch(/\s{2,}/);
    expect(result).toContain('Word1');
    expect(result).toContain('Word2');
    expect(result).toContain('Word3');
  });

  test('returns empty string when selector matches nothing', () => {
    const $ = cheerio.load('<body><p>text</p></body>');
    expect(extractContent($, 'main')).toBe('');
  });

  test('returns trimmed text', () => {
    const html = '<main>  spaced text  </main>';
    const $ = cheerio.load(html);
    expect(extractContent($, 'main')).toBe('spaced text');
  });

  test('handles nested structure with mixed excluded elements', () => {
    const html = `
      <main>
        <nav>Menu item</nav>
        <div class="content">
          <h1>Title</h1>
          <p>Paragraph text</p>
          <script>console.log("hi")</script>
          <div class="no-search">Hidden content</div>
        </div>
        <footer>Copyright</footer>
      </main>
    `;
    const $ = cheerio.load(html);
    const result = extractContent($, 'main');
    expect(result).toContain('Title');
    expect(result).toContain('Paragraph text');
    expect(result).not.toContain('Menu item');
    expect(result).not.toContain('Copyright');
    expect(result).not.toContain('console.log');
    expect(result).not.toContain('Hidden content');
  });
});
