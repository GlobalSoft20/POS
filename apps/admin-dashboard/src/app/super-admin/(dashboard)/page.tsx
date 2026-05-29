'use client';
import { useQuery } from '@tanstack/react-query';
import saApi from '@/lib/sa-api';
import { formatCurrency } from '@/lib/utils';
import { Building2, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, Wifi } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['sa-dashboard'], queryFn: () => saApi.get('/super-admin/dashboard') });
  const { data: businesses = [] } = useQuery({ queryKey: ['sa-businesses-pending'], queryFn: () => saApi.get('/super-admin/businesses?status=PENDING') });
  const { data: online = [] } = useQuery({ queryKey: ['sa-online'], queryFn: () => saApi.get('/super-admin/users/online'), refetchInterval: 30000 });
  const { data: alerts = [] } = useQuery({ queryKey: ['sa-alerts'], queryFn: () => saApi.get('/super-admin/alerts') });

  const s = stats as any;

  const kpis = s ? [
    { label: 'Total Businesses', value: s.businesses.total, sub: `${s.businesses.active} active`, icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Users', value: s.users.total, sub: `${s.users.online} online now`, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Platform Revenue', value: formatCurrency(s.revenue), sub: 'All time', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Pending Approval', value: s.businesses.pending, sub: `${s.businesses.suspended} suspended`, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ] : [];

  if (isLoading) return <div className="text-gray-400">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time control center for all SHMS businesses</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">{label}</p>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2"><Clock size={16} className="text-yellow-400" /> Pending Approvals</h2>
            <Link href="/super-admin/businesses" className="text-xs text-purple-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(businesses as any[]).slice(0, 5).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-[#0F0F1A] rounded-lg">
                <div>
                  <p className="font-medium text-white text-sm">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.email} • {b.country}</p>
                  <p className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</p>
                </div>
                <Link href={`/super-admin/businesses/${b.id}`} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                  Review
                </Link>
              </div>
            ))}
            {(businesses as any[]).length === 0 && <p className="text-gray-500 text-sm text-center py-6">No pending approvals ✅</p>}
          </div>
        </div>

        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
          <h2 className="font-bold text-white flex items-center gap-2 mb-4">
            <Wifi size={16} className="text-green-400" /> Online Now
            <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">{(online as any[]).length}</span>
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(online as any[]).map((u: any) => (
              <div key={u.id} className="flex items-center gap-2 p-2 bg-[#0F0F1A] rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.role}</p>
                </div>
              </div>
            ))}
            {(online as any[]).length === 0 && <p className="text-gray-500 text-sm text-center py-6">No users online</p>}
          </div>
        </div>
      </div>

      <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
        <h2 className="font-bold text-white flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-orange-400" /> System Alerts
        </h2>
        <div className="space-y-2">
          {(alerts as any[]).filter((a: any) => !a.isRead).slice(0, 5).map((alert: any) => (
            <div key={alert.id} className="flex items-start gap-3 p-3 bg-[#0F0F1A] rounded-lg border-l-2 border-orange-400">
              <AlertTriangle size={14} className="text-orange-400 mt-0.5 shrink-0" />
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
    </div>
  );
}
