'use client';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { isOnline } = useOnlineStatus();

  const handleLogout = () => { logout(); router.push('/auth'); };

  return (
    <header className="h-14 bg-[#2A2A3E] border-b border-[#3A3A5C] flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        {/* Online/Offline indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isOnline ? 'Online' : 'Offline'}
        </div>
        <button className="btn-ghost p-2"><Bell size={18} /></button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost p-2 text-gray-400 hover:text-red-400">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
