'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings') });
  const { data: printers = [] } = useQuery({ queryKey: ['printers'], queryFn: () => api.get('/printers') });
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', tin: '', currency: 'RWF', vatRate: '18', receiptFooter: '' });
  const [printerModal, setPrinterModal] = useState(false);
  const [printerForm, setPrinterForm] = useState({ name: '', type: 'RECEIPT', ipAddress: '', port: '9100', isDefault: false });

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      setForm({ name: s.name || '', address: s.address || '', phone: s.phone || '', email: s.email || '', tin: s.tin || '', currency: s.currency || 'RWF', vatRate: String(s.vatRate || 18), receiptFooter: s.receiptFooter || '' });
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: (data: any) => api.put('/settings', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Settings saved!'); },
  });

  const addPrinter = useMutation({
    mutationFn: (data: any) => api.post('/printers', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['printers'] }); setPrinterModal(false); toast.success('Printer added!'); },
  });

  const removePrinter = useMutation({
    mutationFn: (id: string) => api.delete(`/printers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['printers'] }),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Business Settings */}
      <div className="card">
        <h2 className="font-bold mb-4">Business Information</h2>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate({ ...form, vatRate: +form.vatRate }); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400">Business Name *</label><input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="text-xs text-gray-400">Phone</label><input className="input mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="text-xs text-gray-400">Email</label><input className="input mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-xs text-gray-400">TIN Number</label><input className="input mt-1" value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} /></div>
            <div><label className="text-xs text-gray-400">Currency</label>
              <select className="input mt-1" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="RWF">RWF - Rwandan Franc</option>
                <option value="USD">USD - US Dollar</option>
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="UGX">UGX - Ugandan Shilling</option>
              </select>
            </div>
            <div><label className="text-xs text-gray-400">VAT Rate (%)</label><input className="input mt-1" type="number" value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: e.target.value })} /></div>
          </div>
          <div><label className="text-xs text-gray-400">Address</label><input className="input mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="text-xs text-gray-400">Receipt Footer Message</label><textarea className="input mt-1" rows={2} value={form.receiptFooter} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} /></div>
          <button type="submit" disabled={save.isPending} className="btn-primary px-6 py-2">{save.isPending ? 'Saving...' : 'Save Settings'}</button>
        </form>
      </div>

      {/* Printers */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Printers</h2>
          <button onClick={() => setPrinterModal(true)} className="btn-primary flex items-center gap-2 py-1.5 text-sm"><Plus size={14} /> Add Printer</button>
        </div>
        <div className="space-y-2">
          {(printers as any[]).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-[#1E1E2E] rounded-lg">
              <div>
                <p className="font-medium text-white">{p.name}</p>
                <p className="text-xs text-gray-400">{p.type} • {p.ipAddress ? `${p.ipAddress}:${p.port}` : p.usbPath || 'USB'}</p>
              </div>
              <div className="flex items-center gap-2">
                {p.isDefault && <span className="badge bg-primary-500/20 text-primary-500 px-2 py-0.5 text-xs">Default</span>}
                <button onClick={() => removePrinter.mutate(p.id)} className="text-gray-500 hover:text-red-400"><X size={16} /></button>
              </div>
            </div>
          ))}
          {(printers as any[]).length === 0 && <p className="text-gray-500 text-sm text-center py-4">No printers configured</p>}
        </div>
      </div>

      {printerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Printer</h2>
              <button onClick={() => setPrinterModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addPrinter.mutate({ ...printerForm, port: +printerForm.port }); }} className="space-y-3">
              <div><label className="text-xs text-gray-400">Name *</label><input className="input mt-1" value={printerForm.name} onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })} required /></div>
              <div><label className="text-xs text-gray-400">Type</label>
                <select className="input mt-1" value={printerForm.type} onChange={(e) => setPrinterForm({ ...printerForm, type: e.target.value })}>
                  <option value="RECEIPT">Receipt</option>
                  <option value="KITCHEN">Kitchen</option>
                  <option value="BAR">Bar</option>
                </select>
              </div>
              <div><label className="text-xs text-gray-400">IP Address</label><input className="input mt-1" placeholder="192.168.1.100" value={printerForm.ipAddress} onChange={(e) => setPrinterForm({ ...printerForm, ipAddress: e.target.value })} /></div>
              <div><label className="text-xs text-gray-400">Port</label><input className="input mt-1" type="number" value={printerForm.port} onChange={(e) => setPrinterForm({ ...printerForm, port: e.target.value })} /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={printerForm.isDefault} onChange={(e) => setPrinterForm({ ...printerForm, isDefault: e.target.checked })} />
                <label htmlFor="isDefault" className="text-sm text-gray-300">Set as default</label>
              </div>
              <button type="submit" disabled={addPrinter.isPending} className="btn-primary w-full py-2.5">{addPrinter.isPending ? 'Adding...' : 'Add Printer'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
