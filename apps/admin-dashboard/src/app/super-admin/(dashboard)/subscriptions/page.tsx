'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import saApi from '@/lib/sa-api';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const planColors: Record<string, string> = {
  FREE: 'bg-gray-500/20 text-gray-400',
  STARTER: 'bg-blue-500/20 text-blue-400',
  PROFESSIONAL: 'bg-purple-500/20 text-purple-400',
  ENTERPRISE: 'bg-yellow-500/20 text-yellow-400',
};
const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  TRIAL: 'bg-blue-500/20 text-blue-400',
  EXPIRED: 'bg-red-500/20 text-red-400',
  CANCELLED: 'bg-gray-500/20 text-gray-400',
};

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [payModal, setPayModal] = useState<any>(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'MTN_MOMO', reference: '' });

  const { data: subs = [] } = useQuery({ queryKey: ['sa-subscriptions'], queryFn: () => saApi.get('/super-admin/subscriptions') });

  const updateSub = useMutation({
    mutationFn: ({ businessId, data }: any) => saApi.put(`/super-admin/subscriptions/${businessId}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-subscriptions'] }); toast.success('Updated!'); },
  });

  const recordPayment = useMutation({
    mutationFn: ({ id, data }: any) => saApi.post(`/super-admin/subscriptions/${id}/payment`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-subscriptions'] }); setPayModal(null); toast.success('Payment recorded!'); },
  });

  const plans = [
    { plan: 'FREE', price: 0 },
    { plan: 'STARTER', price: 29000 },
    { plan: 'PROFESSIONAL', price: 79000 },
    { plan: 'ENTERPRISE', price: 199000 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        <div className="flex gap-4 text-sm">
          {plans.map((p) => (
            <div key={p.plan} className="text-center">
              <p className={cn('badge px-2 py-0.5 text-xs', planColors[p.plan])}>{p.plan}</p>
              <p className="text-gray-400 text-xs mt-0.5">{p.price ? formatCurrency(p.price) + '/mo' : 'Free'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {(subs as any[]).map((sub: any) => (
          <div key={sub.id} className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Business</p>
                  <p className="font-medium text-white">{sub.business?.name}</p>
                  <p className="text-xs text-gray-500">{sub.business?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Plan</p>
                  <span className={cn('badge px-2 py-0.5 text-xs', planColors[sub.plan])}>{sub.plan}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span className={cn('badge px-2 py-0.5 text-xs', statusColors[sub.status])}>{sub.status}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="text-white font-medium">{formatCurrency(sub.amount)}/mo</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Expires</p>
                  <p className="text-white">{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <select className="input text-xs py-1" value={sub.plan}
                  onChange={(e) => updateSub.mutate({ businessId: sub.businessId, data: { plan: e.target.value, status: sub.status } })}>
                  {['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select className="input text-xs py-1" value={sub.status}
                  onChange={(e) => updateSub.mutate({ businessId: sub.businessId, data: { plan: sub.plan, status: e.target.value } })}>
                  {['TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => setPayModal(sub)} className="flex items-center justify-center gap-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 py-1.5 rounded-lg transition-colors">
                  <Plus size={12} /> Record Payment
                </button>
              </div>
            </div>
            {sub.payments?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-500/10">
                <p className="text-xs text-gray-400 mb-2">Recent Payments</p>
                <div className="flex gap-3 flex-wrap">
                  {sub.payments.map((p: any) => (
                    <div key={p.id} className="text-xs bg-[#0F0F1A] px-2 py-1 rounded">
                      <span className="text-green-400 font-medium">{formatCurrency(p.amount)}</span>
                      <span className="text-gray-500 ml-1">{p.method} • {new Date(p.paidAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {(subs as any[]).length === 0 && <p className="text-gray-500 text-center py-12">No subscriptions yet</p>}
      </div>

      {payModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-white mb-1">Record Payment</h2>
            <p className="text-sm text-gray-400 mb-4">{payModal.business?.name}</p>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-400">Amount (RWF)</label><input className="input mt-1" type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
              <div><label className="text-xs text-gray-400">Method</label>
                <select className="input mt-1" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
                  {['MTN_MOMO', 'AIRTEL_MONEY', 'CASH', 'BANK_TRANSFER'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-400">Reference</label><input className="input mt-1" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPayModal(null)} className="flex-1 py-2 rounded-lg border border-purple-500/20 text-gray-400 text-sm">Cancel</button>
              <button onClick={() => recordPayment.mutate({ id: payModal.id, data: { amount: +payForm.amount, method: payForm.method, reference: payForm.reference } })}
                disabled={!payForm.amount || recordPayment.isPending} className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50">
                Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
