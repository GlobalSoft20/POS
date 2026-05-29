'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import saApi from '@/lib/sa-api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SASettingsPage() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ['sa-settings'], queryFn: () => saApi.get('/super-admin/settings') });
  const [form, setForm] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    trialDays: 14,
    starterPrice: 29000,
    professionalPrice: 79000,
    enterprisePrice: 199000,
    supportEmail: 'support@shms.rw',
  });

  useEffect(() => {
    if (settings) setForm(settings as any);
  }, [settings]);

  const save = useMutation({
    mutationFn: (data: any) => saApi.put('/super-admin/settings', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-settings'] }); toast.success('Settings saved!'); },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Platform Settings</h1>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-6">
        {/* Platform Controls */}
        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Platform Controls</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#0F0F1A] rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Maintenance Mode</p>
                <p className="text-xs text-gray-400">Disable access for all businesses</p>
              </div>
              <button type="button" onClick={() => setForm({ ...form, maintenanceMode: !form.maintenanceMode })}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.maintenanceMode ? 'bg-red-500' : 'bg-gray-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${form.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0F0F1A] rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Allow New Registrations</p>
                <p className="text-xs text-gray-400">Allow new businesses to register</p>
              </div>
              <button type="button" onClick={() => setForm({ ...form, allowRegistration: !form.allowRegistration })}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.allowRegistration ? 'bg-green-500' : 'bg-gray-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${form.allowRegistration ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="p-3 bg-[#0F0F1A] rounded-lg">
              <p className="text-sm font-medium text-white mb-1">Trial Period (days)</p>
              <input className="input" type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: +e.target.value })} />
            </div>
            <div className="p-3 bg-[#0F0F1A] rounded-lg">
              <p className="text-sm font-medium text-white mb-1">Support Email</p>
              <input className="input" type="email" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Subscription Pricing (RWF/month)</h2>
          <div className="space-y-3">
            {[
              { key: 'starterPrice', label: 'Starter Plan', color: 'text-blue-400' },
              { key: 'professionalPrice', label: 'Professional Plan', color: 'text-purple-400' },
              { key: 'enterprisePrice', label: 'Enterprise Plan', color: 'text-yellow-400' },
            ].map(({ key, label, color }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-[#0F0F1A] rounded-lg">
                <div>
                  <p className={`text-sm font-medium ${color}`}>{label}</p>
                  <p className="text-xs text-gray-400">{formatCurrency((form as any)[key])}/month</p>
                </div>
                <input className="input w-36 text-right" type="number" value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: +e.target.value })} />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={save.isPending} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all">
          {save.isPending ? 'Saving...' : 'Save Platform Settings'}
        </button>
      </form>
    </div>
  );
}
