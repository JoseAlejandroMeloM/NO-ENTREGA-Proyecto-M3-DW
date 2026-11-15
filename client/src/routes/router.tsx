import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Login from '../pages/auth/Login';
import RegisterDistributor from '../pages/auth/RegisterDistributor';
import RegisterStore from '../pages/auth/RegisterStore';
import Forbidden from '../pages/Forbidden';
import Home from '../pages/Home';
import Landing from '../pages/Landing';
import NotFound from '../pages/NotFound';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import NewSalePage from '../pages/sales/NewSalePage';
import SalesHistoryPage from '../pages/sales/SalesHistoryPage';
import ProductFormPage from '../pages/products/ProductFormPage';
import ProductsPage from '../pages/products/ProductsPage';
import OrgProfilePage from '../pages/profile/OrgProfilePage';
import TeamPage from '../pages/team/TeamPage';
import { DISTRIBUTOR_ROLES, STORE_ROLES } from '../types/auth';
import ProtectedRoute from './ProtectedRoute';

// Screens and routes follow docs/spec/06-screens.md. Role checks here are UX only; the API enforces them.
export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register/store', element: <RegisterStore /> },
  { path: '/register/distributor', element: <RegisterDistributor /> },
  {
    path: '/app',
    element: (
      <ProtectedRoute roles={STORE_ROLES}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'sales', element: <SalesHistoryPage /> },
      {
        path: 'sales/new',
        element: <ProtectedRoute roles={['store_owner', 'store_cashier']}><NewSalePage /></ProtectedRoute>,
      },
      { path: 'products', element: <ProductsPage /> },
      {
        path: 'products/new',
        element: <ProtectedRoute roles={['store_owner', 'store_inventory']}><ProductFormPage /></ProtectedRoute>,
      },
      { path: 'products/:id', element: <ProductFormPage /> },
      { path: 'team', element: <ProtectedRoute roles={['store_owner']}><TeamPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute roles={['store_owner']}><OrgProfilePage type="store" /></ProtectedRoute> },
    ],
  },
  {
    path: '/dist',
    element: (
      <ProtectedRoute roles={DISTRIBUTOR_ROLES}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'team', element: <ProtectedRoute roles={['distributor_owner']}><TeamPage /></ProtectedRoute> },
      {
        path: 'profile',
        element: <ProtectedRoute roles={['distributor_owner']}><OrgProfilePage type="distributor" /></ProtectedRoute>,
      },
    ],
  },
  {
    // S25 is shared by every role, so it lives outside /app and /dist but keeps the same shell.
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <NotificationsPage /> }],
  },
  { path: '/forbidden', element: <Forbidden /> },
  { path: '*', element: <NotFound /> },
]);
