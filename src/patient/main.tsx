import React from 'react';
import ReactDOM from 'react-dom/client';
import { PatientApp } from './PatientApp';
import { HeadsUpNotification } from '../components/HeadsUpNotification';
import '../index.css';

import { registerSW } from 'virtual:pwa-register';
import { APP_VERSION } from '../config/version';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW(true);
      },
      onRegisteredSW(_swUrl, r) {
        if (r) {
          r.update();
        }
      },
      onRegisterError(error) {
        console.warn('Falha no registro do Service Worker do Paciente:', error);
      },
    });

    const storedVersion = localStorage.getItem('bertuol_patient_pwa_version');
    if (storedVersion && storedVersion !== APP_VERSION) {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    }
    localStorage.setItem('bertuol_patient_pwa_version', APP_VERSION);
  } catch (err) {
    console.warn('Fallback SW registration:', err);
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn(e));
  }
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
