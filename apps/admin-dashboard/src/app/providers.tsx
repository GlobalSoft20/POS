'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
  }));

  useEffect(() => {
    ['shms-auth', 'shms-auth-v2', 'shms-auth-v3'].forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed?.state?.role) {
          localStorage.removeItem(key);
          localStorage.removeItem('shms_token');
          localStorage.removeItem('shms_sa_token');
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: '#2A2A3E', color: '#fff', border: '1px solid #3A3A5C' } }}
      />
    </QueryClientProvider>
  );
}
