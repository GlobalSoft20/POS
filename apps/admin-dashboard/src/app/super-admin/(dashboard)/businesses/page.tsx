'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import saApi from '@/lib/sa-api';
import { CheckCircle, XCircle, PauseCircle, PlayCircle, ShieldCheck, Eye, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
  REJECTED: 'bg-gray-500/20 text-gray-400',
};

export default function BusinessesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [reasonModal, setReasonModal] = useState<{ id: string; action: 'reject' | 'suspend' } | null>(null);
  const [reason, setReason] = useState('');

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['sa-businesses', filter],
    queryFn: () => saApi.get(`/super-admin/businesses${filter ? `?status=${filter}` : ''}`),
  });

  const approve = useMutation({
    mutationFn: (id: string) => saApi.put(`/super-admin/businesses/${id}/approve`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-businesses'] }); qc.invalidateQueries({ queryKey: ['sa-dashboard'] }); toast.success('Business approved!'); },
  });

  const activate = useMutation({
    mutationFn: (id: string) => saApi.put(`/super-admin/businesses/${id}/activate`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-businesses'] }); toast.success('Business activated!'); },
  });

  const verify = useMutation({
    mutationFn: (id: string) => saApi.put(`/super-admin/businesses/${id}/verify`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-businesses'] }); toast.success('Business verified!'); },
  });

  const doAction = useMutation({
    mutationFn: ({ id, action, reason }: any) => saApi.put(`/super-admin/businesses/${id}/${action}`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-businesses'] }); qc.invalidateQueries({ queryKey: ['sa-dashboard'] }); setReasonModal(null); setReason(''); toast.success('Done!'); },
  });

  const filtered = (businesses as any[]).filter((b: any) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Business Accounts</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          Total: <span className="text-white font-medium">{(businesses as any[]).length}</span>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 text-sm" placeholder="Search businesses..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {['', 'PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-colors border', filter === s ? 'bg-purple-600 border-purple-600 text-white' : 'border-purple-500/20 text-gray-400 hover:text-white bg-[#1A1A2E]')}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-gray-400">Loading...</p>}
        {filtered.map((b: any) => (
          <div key={b.id} className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white">{b.name}</p>
                    {b.isVerified && <ShieldCheck size={14} className="text-blue-400" />}
                  </div>
                  <p className="text-xs text-gray-400">{b.email}</p>
                  <p className="text-xs text-gray-500">{b.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Owner</p>
                  <p className="text-sm text-white">{b.owner?.name}</p>
                  <p className="text-xs text-gray-500">{b.owner?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Subscription</p>
                  <p className="text-sm text-white">{b.subscription?.plan || 'None'}</p>
                  <p className="text-xs text-gray-500">{b.subscription?.status || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Registered</p>
                  <p className="text-sm text-white">{new Date(b.createdAt).toLocaleDateString()}</p>
                  <span className={cn('badge px-2 py-0.5 text-xs mt-1 inline-block', statusColors[b.status])}>{b.status}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Link href={`/super-admin/businesses/${b.id}`} className="flex items-center gap-1 text-xs bg-[#0F0F1A] hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 px-2 py-1.5 rounded-lg transition-colors border border-purple-500/10">
                  <Eye size={12} /> View
                </Link>
                {b.status === 'PENDING' && (
                  <button onClick={() => approve.mutate(b.id)} className="flex items-center gap-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-2 py-1.5 rounded-lg transition-colors">
                    <CheckCircle size={12} /> Approve
                  </button>
                )}
                {b.status === 'PENDING' && (
                  <button onClick={() => setReasonModal({ id: b.id, action: 'reject' })} className="flex items-center gap-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1.5 rounded-lg transition-colors">
                    <XCircle size={12} /> Reject
                  </button>
                )}
                {b.status === 'ACTIVE' && (
                  <button onClick={() => setReasonModal({ id: b.id, action: 'suspend' })} className="flex items-center gap-1 text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-2 py-1.5 rounded-lg transition-colors">
                    <PauseCircle size={12} /> Suspend
                  </button>
                )}
                {b.status === 'SUSPENDED' && (
                  <button onClick={() => activate.mutate(b.id)} className="flex items-center gap-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-2 py-1.5 rounded-lg transition-colors">
                    <PlayCircle size={12} /> Activate
                  </button>
                )}
                {!b.isVerified && b.status === 'ACTIVE' && (
                  <button onClick={() => verify.mutate(b.id)} className="flex items-center gap-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 py-1.5 rounded-lg transition-colors">
                    <ShieldCheck size={12} /> Verify
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !isLoading && <p className="text-gray-500 text-center py-12">No businesses found</p>}
      </div>

      {reasonModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-white mb-3 capitalize">{reasonModal.action} Business</h2>
            <textarea className="input mb-4" rows={3} placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setReasonModal(null)} className="flex-1 py-2 rounded-lg border border-purple-500/20 text-gray-400 hover:text-white text-sm">Cancel</button>
              <button onClick={() => doAction.mutate({ id: reasonModal.id, action: reasonModal.action, reason })} disabled={!reason || doAction.isPending}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
