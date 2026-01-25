import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './renderer/App.tsx';
import { ErrorBoundary } from './renderer/components/ErrorBoundary.tsx';
import './index.css';

console.log('[Sambad] React app starting...');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

console.log('[Sambad] React app rendered');
