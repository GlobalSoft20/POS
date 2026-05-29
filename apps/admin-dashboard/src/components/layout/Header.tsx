'use client';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { LogOut, Bell } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/auth'); };

  return (
    <header className="h-14 bg-[#2A2A3E] border-b border-[#3A3A5C] flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
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
