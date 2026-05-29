'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, X, LogIn, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReservationsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ roomId: '', checkIn: '', checkOut: '', adults: '1', children: '0', totalAmount: '', notes: '', guest: { name: '', phone: '', email: '', idNumber: '', nationality: '' } });

  const { data: reservations = [] } = useQuery({ queryKey: ['reservations'], queryFn: () => api.get('/reservations') });
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => api.get('/rooms') });

  const create = useMutation({
    mutationFn: (data: any) => api.post('/reservations', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reservations'] }); qc.invalidateQueries({ queryKey: ['rooms'] }); setModal(false); toast.success('Reservation created!'); },
    onError: () => toast.error('Failed'),
  });

  const checkIn = useMutation({
    mutationFn: (id: string) => api.put(`/reservations/${id}/checkin`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reservations'] }); qc.invalidateQueries({ queryKey: ['rooms'] }); toast.success('Checked in!'); },
  });

  const checkOut = useMutation({
    mutationFn: (id: string) => api.put(`/reservations/${id}/checkout`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reservations'] }); qc.invalidateQueries({ queryKey: ['rooms'] }); toast.success('Checked out!'); },
  });

  const availableRooms = (rooms as any[]).filter((r: any) => r.status === 'AVAILABLE');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reservations</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Reservation</button>
      </div>

      <div className="space-y-3">
        {(reservations as any[]).map((res: any) => (
          <div key={res.id} className="card flex items-center gap-4">
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400">Guest</p>
                <p className="font-medium text-white">{res.guest?.name}</p>
                <p className="text-xs text-gray-500">{res.guest?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Room</p>
                <p className="font-medium text-white">Room {res.room?.number}</p>
                <p className="text-xs text-gray-500">{res.room?.category?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Check In / Out</p>
                <p className="text-sm text-white">{new Date(res.checkIn).toLocaleDateString()}</p>
                <p className="text-sm text-gray-400">{new Date(res.checkOut).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <p className={`text-sm font-medium ${res.actualCheckOut ? 'text-gray-400' : res.actualCheckIn ? 'text-green-400' : 'text-blue-400'}`}>
                  {res.actualCheckOut ? 'Checked Out' : res.actualCheckIn ? 'Checked In' : 'Reserved'}
                </p>
                <p className="text-xs text-gray-500">{res.adults} adults, {res.children} children</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!res.actualCheckIn && !res.actualCheckOut && (
                <button onClick={() => checkIn.mutate(res.id)} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1"><LogIn size={14} /> Check In</button>
              )}
              {res.actualCheckIn && !res.actualCheckOut && (
                <button onClick={() => checkOut.mutate(res.id)} className="btn-ghost py-1.5 px-3 text-sm border border-[#3A3A5C] flex items-center gap-1"><LogOut size={14} /> Check Out</button>
              )}
            </div>
          </div>
        ))}
        {(reservations as any[]).length === 0 && <p className="text-gray-500 text-center py-12">No reservations yet</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">New Reservation</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate({ ...form, adults: +form.adults, children: +form.children, totalAmount: +form.totalAmount }); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-400">Guest Name *</label><input className="input mt-1" value={form.guest.name} onChange={(e) => setForm({ ...form, guest: { ...form.guest, name: e.target.value } })} required /></div>
                <div><label className="text-xs text-gray-400">Phone</label><input className="input mt-1" value={form.guest.phone} onChange={(e) => setForm({ ...form, guest: { ...form.guest, phone: e.target.value } })} /></div>
                <div><label className="text-xs text-gray-400">ID Number</label><input className="input mt-1" value={form.guest.idNumber} onChange={(e) => setForm({ ...form, guest: { ...form.guest, idNumber: e.target.value } })} /></div>
                <div><label className="text-xs text-gray-400">Nationality</label><input className="input mt-1" value={form.guest.nationality} onChange={(e) => setForm({ ...form, guest: { ...form.guest, nationality: e.target.value } })} /></div>
              </div>
              <div><label className="text-xs text-gray-400">Room *</label>
                <select className="input mt-1" value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} required>
                  <option value="">Select available room</option>
                  {availableRooms.map((r: any) => <option key={r.id} value={r.id}>Room {r.number} — {r.category?.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-400">Check In *</label><input className="input mt-1" type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} required /></div>
                <div><label className="text-xs text-gray-400">Check Out *</label><input className="input mt-1" type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} required /></div>
                <div><label className="text-xs text-gray-400">Adults</label><input className="input mt-1" type="number" value={form.adults} onChange={(e) => setForm({ ...form, adults: e.target.value })} min={1} /></div>
                <div><label className="text-xs text-gray-400">Children</label><input className="input mt-1" type="number" value={form.children} onChange={(e) => setForm({ ...form, children: e.target.value })} min={0} /></div>
              </div>
              <div><label className="text-xs text-gray-400">Total Amount (RWF) *</label><input className="input mt-1" type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} required /></div>
              <div><label className="text-xs text-gray-400">Notes</label><textarea className="input mt-1" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <button type="submit" disabled={create.isPending} className="btn-primary w-full py-2.5">{create.isPending ? 'Saving...' : 'Create Reservation'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
