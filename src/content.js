import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js/lib/common';

/**
 * Check if the page is Firefox's plain-text rendering of a file.
 * Firefox renders text/plain as: <html><body><pre>...raw content...</pre></body></html>
 * Returns the raw text content, or null if this isn't a raw text page.
 */
export function isRawTextPage(doc) {
  const body = doc.body;
  if (!body) return null;

  // Must have exactly one child element, and it must be a <pre>
  const children = body.children;
  if (children.length !== 1) return null;

  const pre = children[0];
  if (pre.tagName !== 'PRE') return null;

  const text = pre.textContent;
  if (!text || !text.trim()) return null;

  return text;
}

/**
 * Configure marked with GFM and highlight.js, then parse markdown to HTML.
 */
export function parseMarkdown(text) {
  const instance = new Marked(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
    }),
    { gfm: true, breaks: false }
  );

  return instance.parse(text);
}

/**
 * Replace the page DOM with rendered markdown HTML.
 */
export function renderPage(doc, html) {
  doc.head.innerHTML = '';
  doc.body.innerHTML = '';
  doc.body.className = '';

  // Set page title from first <h1>, or fall back to filename from URL
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);
  if (titleMatch) {
    doc.title = titleMatch[1].replace(/<[^>]+>/g, '');
  } else {
    const path = doc.location?.pathname || '';
    const filename = decodeURIComponent(path.split('/').pop() || 'Markdown');
    doc.title = filename;
  }

  // Viewport meta for responsive rendering
  const meta = doc.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1';
  doc.head.appendChild(meta);

  // Markdown content wrapper
  const wrapper = doc.createElement('article');
  wrapper.className = 'markdown-body';
  wrapper.innerHTML = html;
  doc.body.appendChild(wrapper);
}

/**
 * Entry point: detect raw text markdown, parse it, and render.
 */
export function main(doc) {
  const rawText = isRawTextPage(doc);
  if (!rawText) return false;

  const html = parseMarkdown(rawText);
  renderPage(doc, html);
  return true;
}

// Auto-run when loaded as a content script (not during tests)
main(document);
