'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  AVAILABLE: 'border-green-500 bg-green-500/10 text-green-400',
  OCCUPIED: 'border-orange-500 bg-orange-500/10 text-orange-400',
  RESERVED: 'border-blue-500 bg-blue-500/10 text-blue-400',
  MAINTENANCE: 'border-red-500 bg-red-500/10 text-red-400',
  CLEANING: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
};

export default function RoomsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ number: '', categoryId: '', floor: '', description: '' });

  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => api.get('/rooms') });
  const { data: categories = [] } = useQuery({ queryKey: ['room-categories'], queryFn: () => api.get('/rooms/categories') });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/rooms', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); setModal(false); toast.success('Room added!'); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) => api.put(`/rooms/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const stats = {
    available: (rooms as any[]).filter((r: any) => r.status === 'AVAILABLE').length,
    occupied: (rooms as any[]).filter((r: any) => r.status === 'OCCUPIED').length,
    reserved: (rooms as any[]).filter((r: any) => r.status === 'RESERVED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Room</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available', value: stats.available, color: 'text-green-400' },
          { label: 'Occupied', value: stats.occupied, color: 'text-orange-400' },
          { label: 'Reserved', value: stats.reserved, color: 'text-blue-400' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {(rooms as any[]).map((room: any) => (
          <div key={room.id} className={cn('card border-2 transition-all', statusColors[room.status])}>
            <div className="text-center mb-3">
              <p className="text-2xl font-bold">{room.number}</p>
              <p className="text-xs text-gray-400">{room.category?.name}</p>
              {room.floor && <p className="text-xs text-gray-500">Floor {room.floor}</p>}
              <span className={cn('badge mt-1 px-2 py-0.5 text-xs', statusColors[room.status])}>{room.status}</span>
            </div>
            {room.reservations?.[0] && (
              <p className="text-xs text-center text-gray-400 mb-2">{room.reservations[0].guest?.name}</p>
            )}
            <select className="input text-xs py-1" value={room.status} onChange={(e) => updateStatus.mutate({ id: room.id, status: e.target.value })}>
              {['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'CLEANING'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Room</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate({ ...form, floor: form.floor ? +form.floor : undefined }); }} className="space-y-3">
              <div><label className="text-xs text-gray-400">Room Number *</label><input className="input mt-1" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required /></div>
              <div><label className="text-xs text-gray-400">Category *</label>
                <select className="input mt-1" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                  <option value="">Select category</option>
                  {(categories as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.basePrice} RWF</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-400">Floor</label><input className="input mt-1" type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></div>
              <div><label className="text-xs text-gray-400">Description</label><input className="input mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <button type="submit" disabled={create.isPending} className="btn-primary w-full py-2.5">{create.isPending ? 'Saving...' : 'Add Room'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
