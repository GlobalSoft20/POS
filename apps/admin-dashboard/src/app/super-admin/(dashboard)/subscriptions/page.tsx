'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import saApi from '@/lib/sa-api';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Plus, Calendar, Gift, TrendingUp, AlertTriangle } from 'lucide-react';
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
  const [extendModal, setExtendModal] = useState<any>(null);
  const [trialModal, setTrialModal] = useState<any>(null);
  const [days, setDays] = useState('30');
  const [payForm, setPayForm] = useState({ amount: '', method: 'MTN_MOMO', reference: '' });

  const { data: subs = [] } = useQuery({ queryKey: ['sa-subscriptions'], queryFn: () => saApi.get('/super-admin/subscriptions') });

  const updateSub = useMutation({
    mutationFn: ({ businessId, data }: any) => saApi.put(`/super-admin/subscriptions/${businessId}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-subscriptions'] }); toast.success('Updated!'); },
  });

  const extendSub = useMutation({
    mutationFn: ({ businessId, days }: any) => saApi.put(`/super-admin/subscriptions/${businessId}/extend`, { days: +days }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-subscriptions'] }); setExtendModal(null); toast.success('Subscription extended!'); },
  });

  const grantTrial = useMutation({
    mutationFn: ({ businessId, days }: any) => saApi.put(`/super-admin/subscriptions/${businessId}/trial`, { days: +days }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-subscriptions'] }); setTrialModal(null); toast.success('Free trial granted!'); },
  });

  const recordPayment = useMutation({
    mutationFn: ({ id, data }: any) => saApi.post(`/super-admin/subscriptions/${id}/payment`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-subscriptions'] }); setPayModal(null); toast.success('Payment recorded!'); },
  });

  const expired = (subs as any[]).filter((s: any) => s.status === 'EXPIRED');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        {expired.length > 0 && (
          <div className="flex items-center gap-2 text-sm bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg">
            <AlertTriangle size={14} /> {expired.length} expired
          </div>
        )}
      </div>

      <div className="space-y-3">
        {(subs as any[]).map((sub: any) => (
          <div key={sub.id} className={cn('bg-[#1A1A2E] border rounded-xl p-4', sub.status === 'EXPIRED' ? 'border-red-500/30' : 'border-purple-500/20')}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Business</p>
                  <p className="font-medium text-white">{sub.business?.name}</p>
                  <p className="text-xs text-gray-500">{sub.business?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Plan</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', planColors[sub.plan])}>{sub.plan}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColors[sub.status])}>{sub.status}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="text-white font-medium">{formatCurrency(sub.amount)}/mo</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Expires</p>
                  <p className={cn('text-sm', sub.status === 'EXPIRED' ? 'text-red-400' : 'text-white')}>
                    {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'Never'}
                  </p>
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
                <button onClick={() => { setExtendModal(sub); setDays('30'); }} className="flex items-center justify-center gap-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-1.5 rounded-lg">
                  <Calendar size={11} /> Extend
                </button>
                <button onClick={() => { setTrialModal(sub); setDays('14'); }} className="flex items-center justify-center gap-1 text-xs bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 py-1.5 rounded-lg">
                  <Gift size={11} /> Free Trial
                </button>
                <button onClick={() => setPayModal(sub)} className="flex items-center justify-center gap-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 py-1.5 rounded-lg">
                  <Plus size={11} /> Payment
                </button>
              </div>
            </div>

            {sub.payments?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-500/10">
                <p className="text-xs text-gray-400 mb-2">Recent Payments</p>
                <div className="flex gap-2 flex-wrap">
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

      {/* Extend Modal */}
      {extendModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-white mb-1 flex items-center gap-2"><Calendar size={16} /> Extend Subscription</h2>
            <p className="text-sm text-gray-400 mb-4">{extendModal.business?.name}</p>
            <div><label className="text-xs text-gray-400">Days to extend</label>
              <input className="input mt-1 w-full" type="number" value={days} onChange={(e) => setDays(e.target.value)} /></div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setExtendModal(null)} className="flex-1 py-2 rounded-lg border border-purple-500/20 text-gray-400 text-sm">Cancel</button>
              <button onClick={() => extendSub.mutate({ businessId: extendModal.businessId, days })} disabled={extendSub.isPending}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">Extend</button>
            </div>
          </div>
        </div>
      )}

      {/* Trial Modal */}
      {trialModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-white mb-1 flex items-center gap-2"><Gift size={16} /> Grant Free Trial</h2>
            <p className="text-sm text-gray-400 mb-4">{trialModal.business?.name}</p>
            <div><label className="text-xs text-gray-400">Trial days</label>
              <input className="input mt-1 w-full" type="number" value={days} onChange={(e) => setDays(e.target.value)} /></div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setTrialModal(null)} className="flex-1 py-2 rounded-lg border border-purple-500/20 text-gray-400 text-sm">Cancel</button>
              <button onClick={() => grantTrial.mutate({ businessId: trialModal.businessId, days })} disabled={grantTrial.isPending}
                className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium disabled:opacity-50">Grant Trial</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-white mb-1">Record Payment</h2>
            <p className="text-sm text-gray-400 mb-4">{payModal.business?.name}</p>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-400">Amount (RWF)</label><input className="input mt-1 w-full" type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
              <div><label className="text-xs text-gray-400">Method</label>
                <select className="input mt-1 w-full" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
                  {['MTN_MOMO', 'AIRTEL_MONEY', 'CASH', 'BANK_TRANSFER'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-400">Reference</label><input className="input mt-1 w-full" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPayModal(null)} className="flex-1 py-2 rounded-lg border border-purple-500/20 text-gray-400 text-sm">Cancel</button>
              <button onClick={() => recordPayment.mutate({ id: payModal.id, data: { amount: +payForm.amount, method: payForm.method, reference: payForm.reference } })}
                disabled={!payForm.amount || recordPayment.isPending} className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50">Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
