import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RootErrorBoundary capturou erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
          <h2 style={{ color: '#1A1A1A', fontSize: '20px', fontWeight: 'bold' }}>Bertuol Odontologia</h2>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
            Ocorreu uma instabilidade momentânea ao carregar a interface.
          </p>
          <div style={{ marginTop: '16px', padding: '12px', background: '#F8F9FA', borderRadius: '12px', fontSize: '12px', color: '#c026d3', textAlign: 'left', overflowX: 'auto' }}>
            {this.state.error?.message || 'Erro inesperado'}
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              backgroundColor: '#FF981A',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Safely register PWA Service Worker without crashing if iframe restricts it
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
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
        console.warn('Falha no registro do Service Worker:', error);
      },
    });

    // If URL contains bust, v, or clear_cache, purge caches to guarantee newest code
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clear_cache') === '1' || urlParams.get('v') || urlParams.get('bust')) {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    }
  }
} catch (e) {
  console.warn('Service worker registro ignorado no ambiente atual:', e);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>,
  );
}

