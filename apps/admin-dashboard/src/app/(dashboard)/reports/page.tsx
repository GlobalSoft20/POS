'use client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, ShoppingBag, Package, Bed } from 'lucide-react';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ReportsPage() {
  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/reports/dashboard') });
  const { data: sales } = useQuery({ queryKey: ['sales-report'], queryFn: () => api.get('/reports/sales') });
  const { data: topProducts = [] } = useQuery({ queryKey: ['top-products'], queryFn: () => api.get('/reports/top-products') });
  const { data: payments = [] } = useQuery({ queryKey: ['payment-breakdown'], queryFn: () => api.get('/reports/payments') });

  const d = dashboard as any;
  const s = sales as any;

  const kpis = d ? [
    { label: "Today's Revenue", value: formatCurrency(d.todayRevenue), icon: TrendingUp, color: 'text-primary-500' },
    { label: "Today's Orders", value: d.todayOrders, icon: ShoppingBag, color: 'text-green-400' },
    { label: 'Active Orders', value: d.activeOrders, icon: Package, color: 'text-yellow-400' },
    { label: 'Room Occupancy', value: `${d.occupancyRate}%`, icon: Bed, color: 'text-blue-400' },
  ] : [];

  // Group orders by date for chart
  const chartData = s?.orders?.reduce((acc: any[], o: any) => {
    const date = new Date(o.paidAt).toLocaleDateString('en-RW', { month: 'short', day: 'numeric' });
    const existing = acc.find((a) => a.date === date);
    if (existing) existing.revenue += o.total;
    else acc.push({ date, revenue: o.total });
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">{label}</p>
              <Icon size={18} className={color} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-bold mb-4">Revenue Trend (Last 30 Days)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#2A2A3E', border: '1px solid #3A3A5C', borderRadius: 8 }} formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-16">No sales data yet</p>}
        </div>

        {/* Payment Breakdown */}
        <div className="card">
          <h2 className="font-bold mb-4">Payment Methods</h2>
          {(payments as any[]).length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={payments as any[]} dataKey="_sum.amount" nameKey="method" cx="50%" cy="50%" outerRadius={60}>
                    {(payments as any[]).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#2A2A3E', border: '1px solid #3A3A5C' }} formatter={(v: any) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {(payments as any[]).map((p: any, i: number) => (
                  <div key={p.method} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-400">{p.method.replace('_', ' ')}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(p._sum.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-gray-500 text-center py-8">No data</p>}
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <h2 className="font-bold mb-4">Top Selling Products</h2>
        <div className="space-y-3">
          {(topProducts as any[]).map((item: any, i: number) => (
            <div key={item.product?.id} className="flex items-center gap-3">
              <span className="text-gray-500 text-sm w-5">{i + 1}</span>
              <span className="text-lg">{item.product?.category?.icon || '📦'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{item.product?.name}</p>
                <p className="text-xs text-gray-500">{item.product?.category?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary-500">{item.totalSold} sold</p>
                <p className="text-xs text-gray-500">{item.orderCount} orders</p>
              </div>
            </div>
          ))}
          {(topProducts as any[]).length === 0 && <p className="text-gray-500 text-center py-8">No sales data yet</p>}
        </div>
      </div>

      {/* Summary */}
      {s && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue', value: formatCurrency(s.totalRevenue) },
            { label: 'Total VAT', value: formatCurrency(s.totalVat) },
            { label: 'Gross Profit', value: formatCurrency(s.grossProfit) },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <p className="text-gray-400 text-sm">{label}</p>
              <p className="text-xl font-bold text-primary-500 mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
