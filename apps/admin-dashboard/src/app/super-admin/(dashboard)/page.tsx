'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import saApi from '@/lib/sa-api';
import { formatCurrency } from '@/lib/utils';
import { Building2, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, Wifi, CreditCard, Activity, ShieldCheck, DollarSign } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const qc = useQueryClient();
  const { data: stats, isLoading } = useQuery({ queryKey: ['sa-dashboard'], queryFn: () => saApi.get('/super-admin/dashboard'), refetchInterval: 30000 });
  const { data: pending = [] } = useQuery({ queryKey: ['sa-businesses', 'PENDING'], queryFn: () => saApi.get('/super-admin/businesses?status=PENDING') });
  const { data: onlineData } = useQuery({ queryKey: ['sa-online'], queryFn: () => saApi.get('/super-admin/users/online'), refetchInterval: 15000 });
  const { data: alerts = [] } = useQuery({ queryKey: ['sa-alerts'], queryFn: () => saApi.get('/super-admin/alerts') });

  const approve = useMutation({
    mutationFn: (id: string) => saApi.put(`/super-admin/businesses/${id}/approve`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-businesses'] }); qc.invalidateQueries({ queryKey: ['sa-dashboard'] }); toast.success('Business approved!'); },
  });

  const s = stats as any;
  const online = (onlineData as any)?.users || [];
  const byRole = (onlineData as any)?.byRole || {};

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard...</div>;

  const kpis = s ? [
    { label: 'Total Businesses', value: s.businesses.total, sub: `${s.businesses.active} active`, icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Online Users', value: s.users.online, sub: `${s.users.total} total active`, icon: Wifi, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Monthly Revenue', value: formatCurrency(s.monthlyRevenue || 0), sub: `${formatCurrency(s.revenue)} all time`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Pending Approval', value: s.businesses.pending, sub: `${s.businesses.suspended} suspended`, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Daily Transactions', value: s.dailyTransactions || 0, sub: 'Today', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Unread Alerts', value: s.unreadAlerts, sub: 'Notifications', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Expired Subs', value: s.businesses.expired || 0, sub: 'Need renewal', icon: CreditCard, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Active Businesses', value: s.businesses.active, sub: `${s.businesses.rejected || 0} rejected`, icon: CheckCircle, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time control center — auto-refreshes every 30s</p>
        </div>
        <div className="flex gap-2">
          <Link href="/super-admin/businesses?status=PENDING" className="px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors">
            {s?.businesses?.pending || 0} Pending
          </Link>
          <Link href="/super-admin/activity" className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
            {s?.unreadAlerts || 0} Alerts
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">{label}</p>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={15} className={color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Online Users by Role */}
      <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
        <h2 className="font-bold text-white flex items-center gap-2 mb-4">
          <Activity size={16} className="text-green-400" /> Live User Activity
          <span className="ml-auto text-xs text-gray-500">Updates every 15s</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Online Businesses', value: s?.businesses?.active || 0, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Online Users', value: online.length, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Active Cashiers', value: byRole['CASHIER'] || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Active Managers', value: byRole['MANAGER'] || 0, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Active Waiters', value: byRole['WAITER'] || 0, color: 'text-pink-400', bg: 'bg-pink-500/10' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2"><Clock size={16} className="text-yellow-400" /> Pending Approvals</h2>
            <Link href="/super-admin/businesses" className="text-xs text-purple-400 hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {(pending as any[]).slice(0, 5).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-[#0F0F1A] rounded-lg border border-yellow-500/10">
                <div>
                  <p className="font-medium text-white text-sm">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.email} • {b.country}</p>
                  <p className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approve.mutate(b.id)} className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-2 py-1.5 rounded-lg transition-colors">
                    Approve
                  </button>
                  <Link href={`/super-admin/businesses/${b.id}`} className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-2 py-1.5 rounded-lg transition-colors">
                    Review
                  </Link>
                </div>
              </div>
            ))}
            {(pending as any[]).length === 0 && <p className="text-gray-500 text-sm text-center py-6">No pending approvals ✅</p>}
          </div>
        </div>

        {/* Online Now */}
        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
          <h2 className="font-bold text-white flex items-center gap-2 mb-4">
            <Wifi size={16} className="text-green-400" /> Online Now
            <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">{online.length}</span>
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {online.map((u: any) => (
              <div key={u.id} className="flex items-center gap-2 p-2 bg-[#0F0F1A] rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.role}</p>
                </div>
              </div>
            ))}
            {online.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No users online</p>}
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400" /> System Alerts
            {(alerts as any[]).filter((a: any) => !a.isRead).length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{(alerts as any[]).filter((a: any) => !a.isRead).length}</span>
            )}
          </h2>
          <Link href="/super-admin/activity" className="text-xs text-purple-400 hover:underline">View all →</Link>
        </div>
        <div className="space-y-2">
          {(alerts as any[]).filter((a: any) => !a.isRead).slice(0, 5).map((alert: any) => (
            <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border-l-2 ${alert.type === 'SUCCESS' ? 'border-green-400 bg-green-500/5' : alert.type === 'WARNING' ? 'border-orange-400 bg-orange-500/5' : 'border-blue-400 bg-blue-500/5'}`}>
              <AlertTriangle size={14} className={alert.type === 'SUCCESS' ? 'text-green-400' : alert.type === 'WARNING' ? 'text-orange-400' : 'text-blue-400'} />
              <div>
                <p className="text-sm text-white">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(alert.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {(alerts as any[]).filter((a: any) => !a.isRead).length === 0 && (
            <div className="flex items-center gap-2 text-green-400 text-sm py-4 justify-center">
              <CheckCircle size={16} /> All clear — no unread alerts
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
        <h2 className="font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Approve Business', href: '/super-admin/businesses?status=PENDING', color: 'bg-green-500/20 text-green-400 hover:bg-green-500/30', icon: CheckCircle },
            { label: 'Manage Businesses', href: '/super-admin/businesses', color: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30', icon: Building2 },
            { label: 'Subscriptions', href: '/super-admin/subscriptions', color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30', icon: CreditCard },
            { label: 'Live Users', href: '/super-admin/users', color: 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30', icon: Users },
            { label: 'Audit Logs', href: '/super-admin/activity', color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30', icon: Activity },
          ].map(({ label, href, color, icon: Icon }) => (
            <Link key={label} href={href} className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${color}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
