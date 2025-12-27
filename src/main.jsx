import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Suprimir erro conhecido do HMR com portals
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('removeChild') ||
     args[0].includes('The node to be removed is not a child'))
  ) {
    console.warn('⚠️ Erro do HMR suprimido:', args[0]);
    return; // Ignorar silenciosamente
  }
  originalError.apply(console, args);
};

// Também suprimir erros não capturados do React
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('removeChild') ||
    event.message?.includes('The node to be removed is not a child')
  ) {
    console.warn('⚠️ Erro de unmount suprimido');
    event.preventDefault();
    event.stopPropagation();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}



