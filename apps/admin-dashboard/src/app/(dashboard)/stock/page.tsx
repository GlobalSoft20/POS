'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, X } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function StockPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: '', type: 'IN', reason: '' });

  const { data: stock = [] } = useQuery({ queryKey: ['stock'], queryFn: () => api.get('/stock') });
  const { data: movements = [] } = useQuery({ queryKey: ['stock-movements'], queryFn: () => api.get('/stock/movements') });

  const adjust = useMutation({
    mutationFn: (data: any) => api.post('/stock/adjust', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock'] }); qc.invalidateQueries({ queryKey: ['stock-movements'] }); setModal(false); setForm({ productId: '', quantity: '', type: 'IN', reason: '' }); toast.success('Stock adjusted!'); },
    onError: () => toast.error('Failed'),
  });

  const lowStock = (stock as any[]).filter((s: any) => s.quantity <= s.minQuantity);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Management</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Adjust Stock</button>
      </div>

      {lowStock.length > 0 && (
        <div className="card border-red-500/50 bg-red-500/10">
          <div className="flex items-center gap-2 text-red-400 mb-2"><AlertTriangle size={16} /><span className="font-medium">Low Stock Alert ({lowStock.length} items)</span></div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((s: any) => (
              <span key={s.id} className="badge bg-red-500/20 text-red-400 px-2 py-1">{s.product?.name}: {s.quantity} {s.unit}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <h2 className="font-bold mb-3">Current Stock</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#3A3A5C] text-gray-400 text-left">
              <th className="pb-2 pr-4">Product</th><th className="pb-2 pr-4">Qty</th><th className="pb-2 pr-4">Min</th><th className="pb-2">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-[#3A3A5C]">
              {(stock as any[]).map((s: any) => (
                <tr key={s.id} className="text-gray-300">
                  <td className="py-2 pr-4">
                    <p className="font-medium text-white">{s.product?.name}</p>
                    <p className="text-xs text-gray-500">{s.product?.category?.name}</p>
                  </td>
                  <td className="py-2 pr-4 font-bold">{s.quantity} <span className="text-gray-500 font-normal">{s.unit}</span></td>
                  <td className="py-2 pr-4 text-gray-500">{s.minQuantity}</td>
                  <td className="py-2">
                    <span className={`badge px-2 py-0.5 ${s.quantity <= s.minQuantity ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {s.quantity <= s.minQuantity ? 'Low' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-hidden">
          <h2 className="font-bold mb-3">Recent Movements</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(movements as any[]).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-[#3A3A5C] last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{m.stock?.product?.name}</p>
                  <p className="text-xs text-gray-500">{m.reason || m.type} • {new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`font-bold text-sm ${m.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                  {m.type === 'IN' ? '+' : '-'}{m.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Adjust Stock</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); adjust.mutate({ ...form, quantity: +form.quantity }); }} className="space-y-3">
              <div><label className="text-xs text-gray-400">Product</label>
                <select className="input mt-1" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                  <option value="">Select product</option>
                  {(stock as any[]).map((s: any) => <option key={s.productId} value={s.productId}>{s.product?.name} (Current: {s.quantity})</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-400">Type</label>
                <select className="input mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="IN">Stock In</option>
                  <option value="OUT">Stock Out</option>
                  <option value="ADJUSTMENT">Adjustment (Set)</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="WASTAGE">Wastage</option>
                </select>
              </div>
              <div><label className="text-xs text-gray-400">Quantity</label><input className="input mt-1" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required min={0} /></div>
              <div><label className="text-xs text-gray-400">Reason</label><input className="input mt-1" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              <button type="submit" disabled={adjust.isPending} className="btn-primary w-full py-2.5">{adjust.isPending ? 'Saving...' : 'Save'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
