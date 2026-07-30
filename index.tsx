import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// En localhost desregistramos cualquier Service Worker para evitar cache viejo
if (location.hostname === 'localhost' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

