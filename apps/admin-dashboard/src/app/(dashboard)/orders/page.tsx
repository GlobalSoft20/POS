'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
  READY: 'bg-green-500/20 text-green-400',
  SERVED: 'bg-purple-500/20 text-purple-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
  PAID: 'bg-gray-500/20 text-gray-400',
};

export default function OrdersPage() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => api.get('/orders') });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Status updated'); },
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api.put(`/orders/${id}/cancel`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  if (isLoading) return <div className="text-gray-400">Loading orders...</div>;

  const active = (orders as any[]).filter((o: any) => !['PAID', 'CANCELLED'].includes(o.status));
  const history = (orders as any[]).filter((o: any) => ['PAID', 'CANCELLED'].includes(o.status)).slice(0, 20);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-3">Active Orders ({active.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map((order: any) => (
            <div key={order.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{order.table?.name || 'Takeaway'} • {order.user?.name}</p>
                </div>
                <span className={cn('badge px-2 py-1', statusColors[order.status])}>{order.status}</span>
              </div>
              <div className="space-y-1">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.quantity}x {item.product?.name}</span>
                    <span className="text-gray-400">{formatCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-[#3A3A5C] pt-2">
                <span className="font-bold text-primary-500">{formatCurrency(order.total)}</span>
                <div className="flex gap-1">
                  {order.status === 'PENDING' && (
                    <button onClick={() => updateStatus.mutate({ id: order.id, status: 'IN_PROGRESS' })} className="text-xs btn-primary py-1 px-2">Start</button>
                  )}
                  {order.status === 'IN_PROGRESS' && (
                    <button onClick={() => updateStatus.mutate({ id: order.id, status: 'READY' })} className="text-xs btn-primary py-1 px-2">Ready</button>
                  )}
                  {order.status === 'READY' && (
                    <button onClick={() => updateStatus.mutate({ id: order.id, status: 'SERVED' })} className="text-xs btn-primary py-1 px-2">Served</button>
                  )}
                  <button onClick={() => cancel.mutate(order.id)} className="text-xs btn-ghost py-1 px-2 text-red-400 border border-red-400/30">Cancel</button>
                </div>
              </div>
            </div>
          ))}
          {active.length === 0 && <p className="text-gray-500 col-span-3 text-center py-8">No active orders</p>}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-3">Recent History</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#3A3A5C] text-gray-400 text-left">
              <th className="pb-2 pr-4">Order</th><th className="pb-2 pr-4">Table</th><th className="pb-2 pr-4">Total</th><th className="pb-2 pr-4">Status</th><th className="pb-2">Date</th>
            </tr></thead>
            <tbody className="divide-y divide-[#3A3A5C]">
              {history.map((o: any) => (
                <tr key={o.id} className="text-gray-300">
                  <td className="py-2 pr-4 font-medium">{o.orderNumber}</td>
                  <td className="py-2 pr-4">{o.table?.name || 'Takeaway'}</td>
                  <td className="py-2 pr-4 text-primary-500 font-medium">{formatCurrency(o.total)}</td>
                  <td className="py-2 pr-4"><span className={cn('badge px-2 py-0.5', statusColors[o.status])}>{o.status}</span></td>
                  <td className="py-2 text-gray-500 text-xs">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
