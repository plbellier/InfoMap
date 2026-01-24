import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

console.log("MATRIX MAIN SCRIPT: Eval Start");

async function init() {
  console.log("MATRIX MAIN SCRIPT: Init Start");
  try {
    const { default: App } = await import('./App.tsx');
    console.log("MATRIX MAIN SCRIPT: App Import Success");
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err) {
    console.error("MATRIX MAIN SCRIPT: CRITICAL ERROR DURING BOOT:", err);
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="color: #f87171; padding: 20px; font-family: monospace; background: #111; border: 1px solid #f87171; border-radius: 8px;">
          <h1 style="margin-top: 0;">CRITICAL BOOT FAILURE</h1>
          <p>${err instanceof Error ? err.message : String(err)}</p>
          <pre style="white-space: pre-wrap; font-size: 12px;">${err instanceof Error ? err.stack : ''}</pre>
        </div>
      `;
    }
  }
}

init();
