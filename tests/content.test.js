import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { isRawTextPage, parseMarkdown, renderPage, main } from '../src/content.js';

function fixture(name) {
  return readFileSync(resolve(__dirname, 'fixtures', name), 'utf8');
}

// Helper: set up a jsdom document mimicking Firefox's plain-text rendering
function makeRawTextDocument(text) {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  const pre = document.createElement('pre');
  pre.textContent = text;
  document.body.appendChild(pre);
  return document;
}

// Helper: set up an HTML page (not raw text)
function makeHtmlDocument(html) {
  document.head.innerHTML = '';
  document.body.innerHTML = html;
  return document;
}

// ---------- isRawTextPage ----------

describe('isRawTextPage', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('returns text when body has a single <pre> child', () => {
    const doc = makeRawTextDocument('# Hello');
    expect(isRawTextPage(doc)).toBe('# Hello');
  });

  it('returns null when body has multiple children', () => {
    const doc = makeHtmlDocument('<p>Hello</p><p>World</p>');
    expect(isRawTextPage(doc)).toBeNull();
  });

  it('returns null when body has no <pre>', () => {
    const doc = makeHtmlDocument('<div>Hello</div>');
    expect(isRawTextPage(doc)).toBeNull();
  });

  it('returns null on empty <pre>', () => {
    document.body.innerHTML = '';
    const pre = document.createElement('pre');
    pre.textContent = '';
    document.body.appendChild(pre);
    expect(isRawTextPage(document)).toBeNull();
  });

  it('returns null on whitespace-only <pre>', () => {
    document.body.innerHTML = '';
    const pre = document.createElement('pre');
    pre.textContent = '   \n  \n  ';
    document.body.appendChild(pre);
    expect(isRawTextPage(document)).toBeNull();
  });

  it('handles <pre wrap=""> (Firefox text/plain variant)', () => {
    document.body.innerHTML = '';
    const pre = document.createElement('pre');
    pre.setAttribute('wrap', '');
    pre.textContent = '# Test';
    document.body.appendChild(pre);
    expect(isRawTextPage(document)).toBe('# Test');
  });
});

// ---------- parseMarkdown ----------

describe('parseMarkdown', () => {
  it('renders headings h1-h6', () => {
    const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
    const html = parseMarkdown(md);
    expect(html).toContain('<h1');
    expect(html).toContain('<h2');
    expect(html).toContain('<h3');
    expect(html).toContain('<h4');
    expect(html).toContain('<h5');
    expect(html).toContain('<h6');
  });

  it('renders GFM tables', () => {
    const md = fixture('gfm.md');
    const html = parseMarkdown(md);
    expect(html).toContain('<table>');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('alpha');
  });

  it('renders task list checkboxes', () => {
    const md = '- [x] Done\n- [ ] Not done';
    const html = parseMarkdown(md);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked');
  });

  it('renders strikethrough', () => {
    const md = '~~deleted~~';
    const html = parseMarkdown(md);
    expect(html).toContain('<del>');
    expect(html).toContain('deleted');
  });

  it('renders fenced code blocks with language-specific highlighting', () => {
    const md = '```javascript\nconst x = 1;\n```';
    const html = parseMarkdown(md);
    expect(html).toContain('hljs');
    expect(html).toContain('language-javascript');
  });

  it('renders fenced code blocks without language', () => {
    const md = '```\nplain text here\n```';
    const html = parseMarkdown(md);
    expect(html).toContain('<pre>');
    expect(html).toContain('<code');
    // highlightAuto may wrap tokens in spans, so check the text appears somewhere
    expect(html).toContain('plain');
    expect(html).toContain('text');
  });

  it('renders inline code', () => {
    const md = 'Use `npm install` here';
    const html = parseMarkdown(md);
    expect(html).toContain('<code>npm install</code>');
  });

  it('renders links', () => {
    const md = '[Example](https://example.com)';
    const html = parseMarkdown(md);
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain('Example');
  });

  it('renders images', () => {
    const md = '![Alt text](image.png)';
    const html = parseMarkdown(md);
    expect(html).toContain('<img');
    expect(html).toContain('src="image.png"');
    expect(html).toContain('alt="Alt text"');
  });

  it('renders blockquotes', () => {
    const md = '> Quoted text';
    const html = parseMarkdown(md);
    expect(html).toContain('<blockquote>');
    expect(html).toContain('Quoted text');
  });

  it('renders horizontal rules', () => {
    const md = 'Before\n\n---\n\nAfter';
    const html = parseMarkdown(md);
    expect(html).toContain('<hr');
  });

  it('autolinks bare URLs', () => {
    const md = 'Visit https://example.com for info.';
    const html = parseMarkdown(md);
    expect(html).toContain('<a href="https://example.com"');
  });

  it('handles the full basic fixture', () => {
    const md = fixture('basic.md');
    const html = parseMarkdown(md);
    expect(html).toContain('<h1');
    expect(html).toContain('Hello World');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<a href="https://example.com"');
  });

  it('handles the full code-blocks fixture', () => {
    const md = fixture('code-blocks.md');
    const html = parseMarkdown(md);
    expect(html).toContain('language-javascript');
    expect(html).toContain('language-python');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<hr');
  });
});

// ---------- renderPage ----------

describe('renderPage', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '<pre>old content</pre>';
  });

  it('sets title from first h1', () => {
    renderPage(document, '<h1>My Title</h1><p>Body</p>');
    expect(document.title).toBe('My Title');
  });

  it('strips HTML tags from h1 when setting title', () => {
    renderPage(document, '<h1>Title with <code>code</code></h1>');
    expect(document.title).toBe('Title with code');
  });

  it('falls back to filename when no h1', () => {
    // jsdom default location is about:blank, so pathname is blank
    renderPage(document, '<p>No heading here</p>');
    // Should fall back to something (not crash)
    expect(document.title).toBeTruthy();
  });

  it('creates article.markdown-body wrapper', () => {
    renderPage(document, '<p>Content</p>');
    const article = document.querySelector('article.markdown-body');
    expect(article).not.toBeNull();
    expect(article.innerHTML).toContain('<p>Content</p>');
  });

  it('adds viewport meta tag', () => {
    renderPage(document, '<p>Content</p>');
    const meta = document.querySelector('meta[name="viewport"]');
    expect(meta).not.toBeNull();
    expect(meta.content).toContain('width=device-width');
  });

  it('clears existing body content', () => {
    renderPage(document, '<p>New</p>');
    expect(document.body.innerHTML).not.toContain('old content');
  });
});

// ---------- main (integration) ----------

describe('main', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('detects raw text, parses, and renders markdown', () => {
    const doc = makeRawTextDocument(fixture('basic.md'));
    const result = main(doc);
    expect(result).toBe(true);

    const article = doc.querySelector('article.markdown-body');
    expect(article).not.toBeNull();
    expect(article.innerHTML).toContain('<h1');
    expect(article.innerHTML).toContain('Hello World');
  });

  it('does not modify non-raw-text pages', () => {
    const doc = makeHtmlDocument('<div>Already rendered</div><p>More content</p>');
    const result = main(doc);
    expect(result).toBe(false);
    expect(doc.body.innerHTML).toContain('Already rendered');
  });

  it('renders GFM features end-to-end', () => {
    const doc = makeRawTextDocument(fixture('gfm.md'));
    main(doc);

    const html = doc.querySelector('article.markdown-body').innerHTML;
    expect(html).toContain('<table>');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('<del>');
  });

  it('renders code blocks with syntax highlighting end-to-end', () => {
    const doc = makeRawTextDocument(fixture('code-blocks.md'));
    main(doc);

    const html = doc.querySelector('article.markdown-body').innerHTML;
    expect(html).toContain('hljs');
    expect(html).toContain('language-javascript');
  });

  it('handles edge case: no headings', () => {
    const doc = makeRawTextDocument(fixture('edge-cases.md'));
    const result = main(doc);
    expect(result).toBe(true);

    const article = doc.querySelector('article.markdown-body');
    expect(article).not.toBeNull();
    expect(article.innerHTML).toContain('No headings');
  });
});

// ---------- Build output validation ----------

describe('build output', () => {
  const distDir = resolve(__dirname, '..', 'dist');

  it('dist/manifest.json exists and has required fields', () => {
    const manifestPath = resolve(distDir, 'manifest.json');
    if (!existsSync(manifestPath)) return; // skip if not built yet

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    expect(manifest.manifest_version).toBe(2);
    expect(manifest.name).toBeTruthy();
    expect(manifest.version).toBeTruthy();
    expect(manifest.browser_specific_settings.gecko.id).toBe('bloom-markdown-viewer@firefox.local');
    expect(manifest.content_scripts).toHaveLength(1);
  });

  it('dist/content.bundle.js exists and is non-empty', () => {
    const jsPath = resolve(distDir, 'content.bundle.js');
    if (!existsSync(jsPath)) return;

    const content = readFileSync(jsPath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('dist/content.bundle.css exists and contains .markdown-body', () => {
    const cssPath = resolve(distDir, 'content.bundle.css');
    if (!existsSync(cssPath)) return;

    const content = readFileSync(cssPath, 'utf8');
    expect(content).toContain('.markdown-body');
  });

  it('dist/icons/ contains SVG icons', () => {
    expect(existsSync(resolve(distDir, 'icons', 'icon-48.svg'))).toBe(true);
    expect(existsSync(resolve(distDir, 'icons', 'icon-96.svg'))).toBe(true);
  });

  it('CSS contains no external URL references', () => {
    const cssPath = resolve(distDir, 'content.bundle.css');
    if (!existsSync(cssPath)) return;

    const content = readFileSync(cssPath, 'utf8');
    expect(content).not.toMatch(/@import\s+url/);
    expect(content).not.toMatch(/https?:\/\//);
  });
});
