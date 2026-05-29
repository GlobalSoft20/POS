'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import saApi from '@/lib/sa-api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, PauseCircle, ShieldCheck, ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
  REJECTED: 'bg-gray-500/20 text-gray-400',
};

export default function BusinessDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const { data: business, isLoading } = useQuery({
    queryKey: ['sa-business', params.id],
    queryFn: () => saApi.get(`/super-admin/businesses/${params.id}`),
  });

  const approve = useMutation({
    mutationFn: () => saApi.put(`/super-admin/businesses/${params.id}/approve`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-business', params.id] }); toast.success('Approved!'); },
  });

  const suspend = useMutation({
    mutationFn: () => saApi.put(`/super-admin/businesses/${params.id}/suspend`, { reason: 'Suspended by Super Admin' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-business', params.id] }); toast.success('Suspended!'); },
  });

  const verify = useMutation({
    mutationFn: () => saApi.put(`/super-admin/businesses/${params.id}/verify`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-business', params.id] }); toast.success('Verified!'); },
  });

  const forceLogout = useMutation({
    mutationFn: (userId: string) => saApi.put(`/super-admin/users/${userId}/force-logout`, {}),
    onSuccess: () => toast.success('User logged out!'),
  });

  const updateSub = useMutation({
    mutationFn: (data: any) => saApi.put(`/super-admin/subscriptions/${params.id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-business', params.id] }); toast.success('Subscription updated!'); },
  });

  const b = business as any;
  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (!b) return <div className="text-gray-400">Business not found</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/super-admin/businesses" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{b.name}</h1>
            {b.isVerified && <ShieldCheck size={18} className="text-blue-400" />}
            <span className={cn('badge px-2 py-0.5 text-xs', statusColors[b.status])}>{b.status}</span>
          </div>
          <p className="text-gray-400 text-sm">{b.email} • {b.country}</p>
        </div>
        <div className="ml-auto flex gap-2">
          {b.status === 'PENDING' && <button onClick={() => approve.mutate()} className="flex items-center gap-1 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg"><CheckCircle size={14} /> Approve</button>}
          {b.status === 'ACTIVE' && <button onClick={() => suspend.mutate()} className="flex items-center gap-1 text-sm bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg"><PauseCircle size={14} /> Suspend</button>}
          {!b.isVerified && <button onClick={() => verify.mutate()} className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg"><ShieldCheck size={14} /> Verify</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Business Info */}
        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
          <h2 className="font-bold text-white mb-3">Business Info</h2>
          <div className="space-y-2 text-sm">
            {[['Phone', b.phone], ['TIN', b.tin], ['Address', b.address], ['Country', b.country], ['Registered', new Date(b.createdAt).toLocaleDateString()]].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-400">{k}</span>
                <span className="text-white">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Owner */}
        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
          <h2 className="font-bold text-white mb-3">Owner</h2>
          <div className="space-y-2 text-sm">
            {[['Name', b.owner?.name], ['Email', b.owner?.email], ['Role', b.owner?.role], ['Status', b.owner?.isActive ? 'Active' : 'Inactive'], ['Last Login', b.owner?.lastLoginAt ? new Date(b.owner.lastLoginAt).toLocaleString() : 'Never']].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-400">{k}</span>
                <span className="text-white text-right">{v || '—'}</span>
              </div>
            ))}
          </div>
          <button onClick={() => forceLogout.mutate(b.owner?.id)} className="mt-3 w-full flex items-center justify-center gap-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 py-1.5 rounded-lg transition-colors">
            <LogOut size={12} /> Force Logout Owner
          </button>
        </div>

        {/* Subscription */}
        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
          <h2 className="font-bold text-white mb-3">Subscription</h2>
          {b.subscription ? (
            <div className="space-y-2 text-sm">
              {[['Plan', b.subscription.plan], ['Status', b.subscription.status], ['Amount', formatCurrency(b.subscription.amount)], ['Expires', b.subscription.endDate ? new Date(b.subscription.endDate).toLocaleDateString() : 'Never']].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="text-white">{v}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-sm">No subscription</p>}
          <div className="mt-3 space-y-2">
            <select className="input text-xs py-1" defaultValue={b.subscription?.plan || 'FREE'}
              onChange={(e) => updateSub.mutate({ plan: e.target.value, status: b.subscription?.status || 'ACTIVE' })}>
              {['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Login Activity */}
      <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
        <h2 className="font-bold text-white mb-3">Recent Login Activity</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {b.loginLogs?.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between py-2 border-b border-purple-500/10 last:border-0 text-sm">
              <div>
                <p className="text-white">{log.user?.name}</p>
                <p className="text-xs text-gray-500">{log.ipAddress || 'Unknown IP'} • {log.userAgent?.substring(0, 40) || '—'}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium ${log.action === 'LOGIN' ? 'text-green-400' : 'text-red-400'}`}>{log.action}</p>
                <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
              </div>
            </div>
          ))}
          {!b.loginLogs?.length && <p className="text-gray-500 text-sm text-center py-4">No login activity</p>}
        </div>
      </div>
    </div>
  );
}
