'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, Users, CreditCard, TrendingUp, Activity, Settings, LogOut, Shield, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuperAdminStore } from '@/store/super-admin.store';
import { useQuery } from '@tanstack/react-query';
import saApi from '@/lib/sa-api';

const nav = [
  { href: '/super-admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/super-admin/businesses', label: 'Businesses', icon: Building2 },
  { href: '/super-admin/users', label: 'Users', icon: Users },
  { href: '/super-admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/super-admin/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/super-admin/activity', label: 'Activity', icon: Activity },
  { href: '/super-admin/settings', label: 'Settings', icon: Settings },
];

export default function SALayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { superAdmin, logout } = useSuperAdminStore();

  const { data: stats } = useQuery({ queryKey: ['sa-dashboard'], queryFn: () => saApi.get('/super-admin/dashboard'), retry: false });
  const s = stats as any;

  const handleLogout = () => { logout(); router.push('/super-admin/auth'); };

  if (pathname === '/super-admin/auth') return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F0F1A]">
      {/* Sidebar */}
      <aside className="w-16 lg:w-60 bg-[#1A1A2E] border-r border-purple-500/20 flex flex-col">
        <div className="p-4 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Shield size={16} className="text-white" />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-bold text-white">Super Admin</p>
              <p className="text-xs text-purple-400">Control Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href) && href !== '/super-admin';
            const isActive = exact ? pathname === href : active;
            return (
              <Link key={href} href={href} className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
                isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-purple-500/10 hover:text-white'
              )}>
                <Icon size={18} className="shrink-0" />
                <span className="hidden lg:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-purple-500/20">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full text-sm">
            <LogOut size={18} className="shrink-0" />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-[#1A1A2E] border-b border-purple-500/20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {s && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400">Businesses: <span className="text-white font-medium">{s.businesses?.total}</span></span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">Online: <span className="text-green-400 font-medium">{s.users?.online}</span></span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">Pending: <span className="text-yellow-400 font-medium">{s.businesses?.pending}</span></span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {s?.unreadAlerts > 0 && (
              <Link href="/super-admin/activity" className="relative">
                <Bell size={18} className="text-gray-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">{s.unreadAlerts}</span>
              </Link>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                {superAdmin?.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-white">{superAdmin?.name}</p>
                <p className="text-xs text-purple-400">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
