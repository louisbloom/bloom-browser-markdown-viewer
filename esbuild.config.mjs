import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

mkdirSync('dist/icons', { recursive: true });

// 1. Bundle JavaScript
await esbuild.build({
  entryPoints: ['src/content.js'],
  bundle: true,
  minify: true,
  outfile: 'dist/content.bundle.js',
  format: 'iife',
  target: ['firefox91'],
});

// 2. Assemble and minify CSS
const markdownCSS = readFileSync('src/styles/markdown.css', 'utf8');
const highlightCSS = readFileSync('src/styles/highlight.css', 'utf8');
const combinedCSS = [markdownCSS, highlightCSS].join('\n');

const result = await esbuild.transform(combinedCSS, {
  loader: 'css',
  minify: true,
});
writeFileSync('dist/content.bundle.css', result.code);

// 3. Copy static assets
cpSync('src/manifest.json', 'dist/manifest.json');
cpSync('src/icons', 'dist/icons', { recursive: true });

// 4. Copy mermaid vendor files (pre-built ESM, minified)
mkdirSync('dist/vendor/mermaid/chunks/mermaid.esm.min', { recursive: true });
cpSync('src/mermaid-init.mjs', 'dist/vendor/mermaid-init.mjs');
cpSync(
  'node_modules/mermaid/dist/mermaid.esm.min.mjs',
  'dist/vendor/mermaid/mermaid.esm.min.mjs'
);
cpSync(
  'node_modules/mermaid/dist/chunks/mermaid.esm.min',
  'dist/vendor/mermaid/chunks/mermaid.esm.min',
  { recursive: true }
);

console.log('Build complete.');
