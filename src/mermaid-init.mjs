import mermaid from './mermaid/mermaid.esm.min.mjs';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#000000',
    primaryColor: '#1a1a1a',
    primaryTextColor: '#c4c4c4',
    primaryBorderColor: '#333',
    lineColor: '#c4c4c4',
    secondaryColor: '#1a1a1a',
    tertiaryColor: '#111',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: '14px',
  },
  xyChart: {
    xAxis: { labelPadding: 25, titlePadding: 10 },
    yAxis: { labelPadding: 10, titlePadding: 40 },
  },
  securityLevel: 'strict',
  logLevel: 'error',
});

async function renderMermaid() {
  await mermaid.run({ querySelector: 'pre.mermaid' });
}

document.addEventListener('bloom-render-mermaid', renderMermaid);
renderMermaid();
