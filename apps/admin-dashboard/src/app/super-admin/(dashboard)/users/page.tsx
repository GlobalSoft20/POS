'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import saApi from '@/lib/sa-api';
import { LogOut, UserX, UserCheck, Search, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-400',
  MANAGER: 'bg-purple-500/20 text-purple-400',
  CASHIER: 'bg-blue-500/20 text-blue-400',
  WAITER: 'bg-green-500/20 text-green-400',
  KITCHEN_STAFF: 'bg-yellow-500/20 text-yellow-400',
};

export default function SAUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'online'>('all');

  const { data: users = [] } = useQuery({ queryKey: ['sa-users'], queryFn: () => saApi.get('/super-admin/users') });
  const { data: online = [] } = useQuery({ queryKey: ['sa-online'], queryFn: () => saApi.get('/super-admin/users/online'), refetchInterval: 15000 });

  const forceLogout = useMutation({
    mutationFn: (id: string) => saApi.put(`/super-admin/users/${id}/force-logout`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-online'] }); toast.success('User force logged out!'); },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: any) => saApi.put(`/super-admin/users/${id}/toggle-active`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-users'] }); toast.success('User status updated!'); },
  });

  const displayUsers = (tab === 'online' ? online : users) as any[];
  const filtered = displayUsers.filter((u: any) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Total: <span className="text-white font-medium">{(users as any[]).length}</span></span>
          <span className="text-gray-600">|</span>
          <span className="flex items-center gap-1 text-green-400"><Wifi size={12} /> {(online as any[]).length} online</span>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 text-sm" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex bg-[#1A1A2E] border border-purple-500/20 rounded-lg p-1">
          {(['all', 'online'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize', tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white')}>
              {t === 'online' ? `🟢 Online (${(online as any[]).length})` : `All (${(users as any[]).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-purple-500/20 text-gray-400 text-left">
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Business</th>
              <th className="p-4">Last Login</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {filtered.map((u: any) => {
              const isOnline = (online as any[]).some((o: any) => o.id === u.id);
              return (
                <tr key={u.id} className="hover:bg-purple-500/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold text-white">{u.name?.[0]?.toUpperCase()}</div>
                        {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1A1A2E]" />}
                      </div>
                      <div>
                        <p className="font-medium text-white">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><span className={cn('badge px-2 py-0.5 text-xs', roleColors[u.role] || 'bg-gray-500/20 text-gray-400')}>{u.role}</span></td>
                  <td className="p-4 text-gray-400 text-xs">{u.businessId || '—'}</td>
                  <td className="p-4 text-gray-400 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                  <td className="p-4">
                    <span className={cn('badge px-2 py-0.5 text-xs', u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {isOnline && (
                        <button onClick={() => forceLogout.mutate(u.id)} title="Force Logout" className="w-7 h-7 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors">
                          <LogOut size={12} />
                        </button>
                      )}
                      <button onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })} title={u.isActive ? 'Deactivate' : 'Activate'}
                        className={cn('w-7 h-7 rounded flex items-center justify-center transition-colors', u.isActive ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400' : 'bg-green-500/20 hover:bg-green-500/30 text-green-400')}>
                        {u.isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-gray-500 text-center py-12">No users found</p>}
      </div>
    </div>
  );
}
