'use client';
import { useQuery } from '@tanstack/react-query';
import saApi from '@/lib/sa-api';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];
const planColors: Record<string, string> = {
  FREE: 'bg-gray-500/20 text-gray-400',
  STARTER: 'bg-blue-500/20 text-blue-400',
  PROFESSIONAL: 'bg-purple-500/20 text-purple-400',
  ENTERPRISE: 'bg-yellow-500/20 text-yellow-400',
};

export default function RevenuePage() {
  const { data: revenue } = useQuery({ queryKey: ['sa-revenue'], queryFn: () => saApi.get('/super-admin/revenue') });
  const r = revenue as any;

  const kpis = r ? [
    { label: 'Total Revenue', value: formatCurrency(r.totalRevenue), color: 'text-green-400' },
    { label: 'Total Payments', value: r.totalPayments, color: 'text-blue-400' },
    { label: 'Active Businesses', value: r.activeBusinesses, color: 'text-purple-400' },
    { label: 'Total Businesses', value: r.totalBusinesses, color: 'text-yellow-400' },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Platform Revenue</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, color }) => (
          <div key={label} className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
          <h2 className="font-bold text-white mb-4">Revenue by Plan</h2>
          {r?.byPlan?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={r.byPlan} dataKey="_sum.amount" nameKey="plan" cx="50%" cy="50%" outerRadius={65}>
                    {r.byPlan.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(139,92,246,0.2)' }} formatter={(v: any) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {r.byPlan.map((p: any, i: number) => (
                  <div key={p.plan} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className={`badge px-2 py-0.5 text-xs ${planColors[p.plan]}`}>{p.plan}</span>
                      <span className="text-gray-500">{p._count} businesses</span>
                    </div>
                    <span className="font-medium text-white">{formatCurrency(p._sum.amount || 0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-gray-500 text-center py-12">No revenue data yet</p>}
        </div>

        {/* Recent Payments */}
        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
          <h2 className="font-bold text-white mb-4">Recent Payments</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {r?.recentPayments?.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-purple-500/10 last:border-0">
                <div>
                  <p className="text-sm text-white">{p.subscription?.business?.name}</p>
                  <p className="text-xs text-gray-500">{p.method} • {new Date(p.paidAt).toLocaleDateString()}</p>
                </div>
                <p className="text-green-400 font-bold text-sm">{formatCurrency(p.amount)}</p>
              </div>
            ))}
            {!r?.recentPayments?.length && <p className="text-gray-500 text-center py-8">No payments yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
