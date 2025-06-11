import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js'; 

const container = document.getElementById('root');
if (!container) {
    console.error("Failed to find root element with ID 'root'. Please check index.html.");
    document.body.innerHTML = '<div style="color: red; text-align: center; margin-top: 50px; font-family: sans-serif;">Error: Root element not found! Please ensure your `index.html` has `<div id="root"></div>`.</div>';
} else {
    const root = createRoot(container);
    root.render(
        <App />
    );
}
window.addEventListener('DOMContentLoaded', () => {
});