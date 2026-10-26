import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './components/ui/ui.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatStoreProvider } from './store/ChatStoreProvider';
import { initTheme } from './theme';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ChatStoreProvider>
        <App />
      </ChatStoreProvider>
    </ErrorBoundary>
  </StrictMode>,
);
