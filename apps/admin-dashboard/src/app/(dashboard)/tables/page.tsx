'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { usePOSStore } from '@/store/pos.store';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  FREE: 'border-green-500 bg-green-500/10 text-green-400',
  OCCUPIED: 'border-orange-500 bg-orange-500/10 text-orange-400',
  RESERVED: 'border-blue-500 bg-blue-500/10 text-blue-400',
};

export default function TablesPage() {
  const qc = useQueryClient();
  const { setTable } = usePOSStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ number: '', name: '', capacity: '4', section: 'Indoor' });

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const { data: tables = [], isLoading } = useQuery({ queryKey: ['tables'], queryFn: () => api.get('/tables') });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/tables', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); setModal(false); setForm({ number: '', name: '', capacity: '4', section: 'Indoor' }); toast.success('Table added!'); },
    onError: () => toast.error('Failed to add table'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) => api.put(`/tables/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });

  const handleTableClick = (table: any) => {
    if (table.status === 'FREE') { setTable(table.id); router.push('/pos'); }
  };

  if (isLoading) return <div className="text-gray-400">Loading tables...</div>;

  const grouped = (tables as any[]).reduce((acc: any, t: any) => {
    const section = t.section || 'Main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Table Management</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-sm">
            {Object.entries(statusColors).map(([s, cls]) => (
              <span key={s} className={cn('badge px-3 py-1', cls)}>{s}</span>
            ))}
          </div>
          {canManage && (
            <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Table
            </button>
          )}
        </div>
      </div>

      {Object.entries(grouped).map(([section, sectionTables]: any) => (
        <div key={section}>
          <h2 className="text-sm font-medium text-gray-400 mb-3">{section}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sectionTables.map((table: any) => (
              <div key={table.id} onClick={() => handleTableClick(table)}
                className={cn('card border-2 cursor-pointer transition-all hover:scale-105 active:scale-95', statusColors[table.status])}>
                <div className="text-center">
                  <p className="text-2xl font-bold">{table.number}</p>
                  {table.name && <p className="text-xs text-gray-400">{table.name}</p>}
                  <p className="text-xs mt-1 font-medium">{table.status}</p>
                  <p className="text-xs text-gray-500">👥 {table.capacity}</p>
                  {table.orders?.length > 0 && (
                    <p className="text-xs text-orange-400 mt-1">{table.orders.length} active order(s)</p>
                  )}
                </div>
                <div className="flex gap-1 mt-3 justify-center">
                  {['FREE', 'OCCUPIED', 'RESERVED'].map((s) => (
                    <button key={s} onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: table.id, status: s }); }}
                      className={cn('text-xs px-2 py-0.5 rounded transition-colors', table.status === s ? 'bg-white/20' : 'hover:bg-white/10')}>
                      {s[0]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Table</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate({ ...form, capacity: +form.capacity }); }} className="space-y-3">
              <div><label className="text-xs text-gray-400">Table Number *</label><input className="input mt-1" placeholder="e.g. T11" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required /></div>
              <div><label className="text-xs text-gray-400">Name</label><input className="input mt-1" placeholder="e.g. VIP Table" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="text-xs text-gray-400">Capacity</label><input className="input mt-1" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
              <div><label className="text-xs text-gray-400">Section</label>
                <select className="input mt-1" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                  <option>Indoor</option>
                  <option>Outdoor</option>
                  <option>VIP</option>
                  <option>Terrace</option>
                  <option>Bar</option>
                </select>
              </div>
              <button type="submit" disabled={create.isPending} className="btn-primary w-full py-2.5">{create.isPending ? 'Adding...' : 'Add Table'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
