import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Global error handler para prevenir crash por erros de removeChild
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('removeChild') ||
    event.message?.includes('The node to be removed is not a child')
  ) {
    console.warn('⚠️ [Global] Erro de removeChild capturado e prevenido:', event.message);
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
});

// Também capturar erros não tratados de promises
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('removeChild') ||
    event.reason?.message?.includes('The node to be removed is not a child')
  ) {
    console.warn('⚠️ [Global] Promise rejection de removeChild capturada e prevenida');
    event.preventDefault();
    return true;
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



