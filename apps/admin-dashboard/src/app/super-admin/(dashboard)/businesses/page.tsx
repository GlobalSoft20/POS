'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import saApi from '@/lib/sa-api';
import { CheckCircle, XCircle, PauseCircle, PlayCircle, ShieldCheck, Eye, Search, Lock, Unlock, LogOut, MessageSquare } from 'lucide-react';
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
  const [modal, setModal] = useState<{ id: string; action: string; label: string } | null>(null);
  const [reason, setReason] = useState('');

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['sa-businesses', filter],
    queryFn: () => saApi.get(`/super-admin/businesses${filter ? `?status=${filter}` : ''}`),
  });

  const mutate = (action: string, id: string, body: any = {}) =>
    saApi.put(`/super-admin/businesses/${id}/${action}`, body);

  const doMutation = useMutation({
    mutationFn: ({ id, action, body }: any) => mutate(action, id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-businesses'] });
      qc.invalidateQueries({ queryKey: ['sa-dashboard'] });
      setModal(null); setReason('');
      toast.success('Done!');
    },
    onError: () => toast.error('Action failed'),
  });

  const quickAction = (id: string, action: string) => doMutation.mutate({ id, action, body: {} });

  const filtered = (businesses as any[]).filter((b: any) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.email.toLowerCase().includes(search.toLowerCase())
  );

  const needsReason = (action: string) => ['reject', 'suspend'].includes(action);
  const needsMessage = (action: string) => action === 'request-info';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Business Accounts</h1>
        <span className="text-sm text-gray-400">Total: <span className="text-white font-medium">{(businesses as any[]).length}</span></span>
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
        {isLoading && <p className="text-gray-400 text-center py-8">Loading...</p>}
        {filtered.map((b: any) => (
          <div key={b.id} className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
                  <span className={cn('text-xs px-2 py-0.5 rounded-full mt-1 inline-block', statusColors[b.status])}>{b.status}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 shrink-0 min-w-[90px]">
                <Link href={`/super-admin/businesses/${b.id}`} className="flex items-center gap-1 text-xs bg-[#0F0F1A] hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 px-2 py-1.5 rounded-lg transition-colors border border-purple-500/10">
                  <Eye size={11} /> View
                </Link>
                {b.status === 'PENDING' && <>
                  <button onClick={() => quickAction(b.id, 'approve')} className="flex items-center gap-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-2 py-1.5 rounded-lg">
                    <CheckCircle size={11} /> Approve
                  </button>
                  <button onClick={() => setModal({ id: b.id, action: 'reject', label: 'Reject' })} className="flex items-center gap-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1.5 rounded-lg">
                    <XCircle size={11} /> Reject
                  </button>
                  <button onClick={() => setModal({ id: b.id, action: 'request-info', label: 'Request Info' })} className="flex items-center gap-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 py-1.5 rounded-lg">
                    <MessageSquare size={11} /> Info
                  </button>
                </>}
                {b.status === 'ACTIVE' && <>
                  <button onClick={() => setModal({ id: b.id, action: 'suspend', label: 'Suspend' })} className="flex items-center gap-1 text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-2 py-1.5 rounded-lg">
                    <PauseCircle size={11} /> Suspend
                  </button>
                  <button onClick={() => quickAction(b.id, 'lock')} className="flex items-center gap-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1.5 rounded-lg">
                    <Lock size={11} /> Lock
                  </button>
                  <button onClick={() => quickAction(b.id, 'force-logout-all')} className="flex items-center gap-1 text-xs bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-2 py-1.5 rounded-lg">
                    <LogOut size={11} /> Logout All
                  </button>
                </>}
                {b.status === 'SUSPENDED' && <>
                  <button onClick={() => quickAction(b.id, 'activate')} className="flex items-center gap-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-2 py-1.5 rounded-lg">
                    <PlayCircle size={11} /> Activate
                  </button>
                  <button onClick={() => quickAction(b.id, 'unlock')} className="flex items-center gap-1 text-xs bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 px-2 py-1.5 rounded-lg">
                    <Unlock size={11} /> Unlock
                  </button>
                </>}
                {!b.isVerified && b.status !== 'REJECTED' && (
                  <button onClick={() => quickAction(b.id, 'verify')} className="flex items-center gap-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 py-1.5 rounded-lg">
                    <ShieldCheck size={11} /> Verify
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !isLoading && <p className="text-gray-500 text-center py-12">No businesses found</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-white mb-3">{modal.label}</h2>
            <textarea className="input mb-4 w-full" rows={3}
              placeholder={needsMessage(modal.action) ? 'Message to business...' : 'Reason (required)'}
              value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setReason(''); }} className="flex-1 py-2 rounded-lg border border-purple-500/20 text-gray-400 text-sm">Cancel</button>
              <button
                onClick={() => doMutation.mutate({ id: modal.id, action: modal.action, body: needsMessage(modal.action) ? { message: reason } : { reason } })}
                disabled={!reason || doMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
