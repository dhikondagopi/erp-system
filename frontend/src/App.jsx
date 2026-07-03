
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import queryClient from './services/queryClient';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

/**
 * Root Application Component
 *
 * BrowserRouter is initialized in main.jsx.
 * This component only provides global providers.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

