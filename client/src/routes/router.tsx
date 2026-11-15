import { createBrowserRouter } from 'react-router-dom';
import Login from '../pages/auth/Login';
import RegisterDistributor from '../pages/auth/RegisterDistributor';
import RegisterStore from '../pages/auth/RegisterStore';
import Forbidden from '../pages/Forbidden';
import Home from '../pages/Home';
import Landing from '../pages/Landing';
import NotFound from '../pages/NotFound';
import { DISTRIBUTOR_ROLES, STORE_ROLES } from '../types/auth';
import ProtectedRoute from './ProtectedRoute';

// Screens and routes follow docs/spec/06-screens.md.
export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register/store', element: <RegisterStore /> },
  { path: '/register/distributor', element: <RegisterDistributor /> },
  {
    path: '/app',
    element: (
      <ProtectedRoute roles={STORE_ROLES}>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dist',
    element: (
      <ProtectedRoute roles={DISTRIBUTOR_ROLES}>
        <Home />
      </ProtectedRoute>
    ),
  },
  { path: '/forbidden', element: <Forbidden /> },
  { path: '*', element: <NotFound /> },
]);
