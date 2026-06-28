import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler for debugging white screen
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `
      <div style="background: #050505; color: #8b0000; padding: 20px; font-family: monospace; border: 1px solid #333; margin: 20px;">
        <h1 style="text-transform: uppercase; font-size: 18px;">Critical System Error</h1>
        <p style="font-size: 12px; color: #666;">The void rejected the initialization sequence.</p>
        <pre style="font-size: 10px; white-space: pre-wrap; word-break: break-all; border-top: 1px solid #333; padding-top: 10px;">${message}\nat ${source}:${lineno}:${colno}</pre>
      </div>
    `;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
