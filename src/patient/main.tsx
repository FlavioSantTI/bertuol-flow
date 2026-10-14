import React from 'react';
import ReactDOM from 'react-dom/client';
import { PatientApp } from './PatientApp';
import { HeadsUpNotification } from '../components/HeadsUpNotification';
import '../index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration fallback:', err);
    });
  });
}

const rootElement = document.getElementById('patient-root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <PatientApp />
      <HeadsUpNotification />
    </React.StrictMode>
  );
}
