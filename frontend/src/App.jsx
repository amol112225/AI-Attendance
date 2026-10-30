/**
 * AttendAI Main Application Component
 * Configures the router and master layout wrapper.
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PageShell } from './layouts/PageShell';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageShell>
          <AppRoutes />
        </PageShell>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
