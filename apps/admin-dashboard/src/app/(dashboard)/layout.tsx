'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import OfflineBanner from '@/components/ui/OfflineBanner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, role, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) { router.replace('/auth'); return; }
    if (role === 'SUPER_ADMIN') router.replace('/super-admin');
  }, [_hasHydrated, token, role, router]);

  // Wait for hydration
  if (!_hasHydrated) return null;
  // Redirect cases — render nothing while navigating
  if (!token || role === 'SUPER_ADMIN') return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <OfflineBanner />
    </div>
  );
}
