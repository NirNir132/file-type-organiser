
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    // Fallback error handling if the root element is somehow not found even after DOMContentLoaded
    console.error("Fatal Error: Could not find root element to mount to. The #root div is missing from index.html or not available.");
    document.body.innerHTML = '<div style="font-family: sans-serif; text-align: center; padding: 2rem; color: red;"><h1>Application Error</h1><p>Could not initialize the application. The root HTML element is missing.</p></div>';
    return;
  }

  // Diagnostic checks for ReactDOM
  if (typeof ReactDOM === 'undefined') {
    console.error("Fatal Error: ReactDOM is not loaded. Check script imports and network console for errors loading React DOM.");
    rootElement.innerHTML = '<div style="font-family: sans-serif; text-align: center; padding: 2rem; color: red;"><h1>Application Error</h1><p>Critical React library (ReactDOM) failed to load. Please check your internet connection or browser console for more details.</p></div>';
    return;
  }

  if (typeof ReactDOM.createRoot !== 'function') {
    console.error("Fatal Error: ReactDOM.createRoot is not a function. The loaded version of ReactDOM might be incorrect or corrupted.");
    rootElement.innerHTML = '<div style="font-family: sans-serif; text-align: center; padding: 2rem; color: red;"><h1>Application Error</h1><p>Critical React library function (ReactDOM.createRoot) is missing or invalid. Please check browser console.</p></div>';
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});