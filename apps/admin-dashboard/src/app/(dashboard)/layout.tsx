import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import OfflineBanner from '@/components/ui/OfflineBanner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
