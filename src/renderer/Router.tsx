import { createHashRouter, RouterProvider } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/Home';
import { Contacts } from './pages/Contacts';
import { Groups } from './pages/Groups';
import { Extractor } from './pages/Extractor';
import { Campaigns } from './pages/Campaigns';
import { Reports } from './pages/Reports';

// ...


import { Console } from './pages/Console';
import { Settings } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';
import { DialogProvider } from './contexts/DialogContext';
import { AuthGuard } from './components/AuthGuard';
import { Sentinel } from './sentinel/Sentinel';

const router = createHashRouter([
  {
    path: '/sentinel',
    element: <Sentinel />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'contacts',
        element: <Contacts />,
      },
      {
        path: 'groups',
        element: <Groups />,
      },
      {
        path: 'extractor',
        element: <Extractor />,
      },
      {
        path: 'campaigns',
        element: <Campaigns />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'console',
        element: <Console />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

export function Router() {
  return (
    <DialogProvider>
      <RouterProvider router={router} />
    </DialogProvider>
  );
}
