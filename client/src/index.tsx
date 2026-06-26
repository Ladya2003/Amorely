import React from 'react';
import ReactDOM from 'react-dom/client';
import './localization';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { setupCurrencyAxiosInterceptor } from './utils/currencyEvents';

setupCurrencyAxiosInterceptor();

// MUI Drawer + <video controls> могут вызывать benign ResizeObserver loop в dev.
if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
  const NativeResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class extends NativeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super((entries, observer) => {
        window.requestAnimationFrame(() => {
          callback(entries, observer);
        });
      });
    }
  };
}

const isResizeObserverError = (message?: string) =>
  Boolean(message && /ResizeObserver loop/i.test(message));

window.addEventListener('error', (event) => {
  if (isResizeObserverError(event.message)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
