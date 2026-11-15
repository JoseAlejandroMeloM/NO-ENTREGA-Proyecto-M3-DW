import { createBrowserRouter } from 'react-router-dom';
import Landing from '../pages/Landing';
import NotFound from '../pages/NotFound';

// Screens and routes follow docs/spec/06-screens.md. Protected routes come with feature/auth.
export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '*', element: <NotFound /> },
]);
