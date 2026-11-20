import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import { currentLang, currentTheme, setLang, setTheme } from './i18n/preferences';
import { router } from './routes/router';

// Before the first render, so the page never flashes the other theme or language.
setTheme(currentTheme());
setLang(currentLang());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
