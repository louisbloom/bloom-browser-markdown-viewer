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
    fontSize: '12px',
  },
  xyChart: {
    titleFontSize: 14,
    xAxis: { labelFontSize: 12, titleFontSize: 12, labelPadding: 20 },
    yAxis: {
      labelFontSize: 12,
      titleFontSize: 12,
      labelPadding: 10,
      titlePadding: 15,
    },
  },
  securityLevel: 'strict',
  logLevel: 'error',
});

async function renderMermaid() {
  await mermaid.run({ querySelector: 'pre.mermaid' });
}

document.addEventListener('bloom-render-mermaid', renderMermaid);
renderMermaid();
