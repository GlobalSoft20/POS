'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const roles = ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'KITCHEN_STAFF'];
const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-400',
  MANAGER: 'bg-purple-500/20 text-purple-400',
  CASHIER: 'bg-blue-500/20 text-blue-400',
  WAITER: 'bg-green-500/20 text-green-400',
  KITCHEN_STAFF: 'bg-yellow-500/20 text-yellow-400',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CASHIER', pin: '' });

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users') });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModal(false); toast.success('User created!'); },
    onError: () => toast.error('Failed'),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users & Roles</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add User</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(users as any[]).map((user: any) => (
          <div key={user.id} className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold text-lg shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
              <span className={`badge mt-1 px-2 py-0.5 text-xs ${roleColors[user.role]}`}>{user.role}</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
              {user.isActive && (
                <button onClick={() => deactivate.mutate(user.id)} className="text-xs text-red-400 hover:underline">Deactivate</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add User</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-3">
              <div><label className="text-xs text-gray-400">Full Name *</label><input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="text-xs text-gray-400">Email *</label><input className="input mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div><label className="text-xs text-gray-400">Password *</label><input className="input mt-1" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
              <div><label className="text-xs text-gray-400">PIN (4 digits)</label><input className="input mt-1" maxLength={4} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} /></div>
              <div><label className="text-xs text-gray-400">Role</label>
                <select className="input mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" disabled={create.isPending} className="btn-primary w-full py-2.5">{create.isPending ? 'Creating...' : 'Create User'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
