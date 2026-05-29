'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import saApi from '@/lib/sa-api';
import { formatDate } from '@/lib/utils';
import { Bell, CheckCheck, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ActivityPage() {
  const qc = useQueryClient();
  const { data: activity = [] } = useQuery({ queryKey: ['sa-activity'], queryFn: () => saApi.get('/super-admin/activity?limit=100'), refetchInterval: 30000 });
  const { data: alerts = [] } = useQuery({ queryKey: ['sa-alerts'], queryFn: () => saApi.get('/super-admin/alerts') });

  const markRead = useMutation({
    mutationFn: (id: string) => saApi.put(`/super-admin/alerts/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-alerts'] }),
  });

  const markAllRead = async () => {
    const unread = (alerts as any[]).filter((a: any) => !a.isRead);
    await Promise.all(unread.map((a: any) => markRead.mutateAsync(a.id)));
    toast.success('All alerts marked as read');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Activity & Monitoring</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Bell size={16} className="text-orange-400" /> System Alerts
              {(alerts as any[]).filter((a: any) => !a.isRead).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{(alerts as any[]).filter((a: any) => !a.isRead).length}</span>
              )}
            </h2>
            {(alerts as any[]).some((a: any) => !a.isRead) && (
              <button onClick={markAllRead} className="text-xs text-purple-400 hover:underline flex items-center gap-1">
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(alerts as any[]).map((alert: any) => (
              <div key={alert.id} onClick={() => !alert.isRead && markRead.mutate(alert.id)}
                className={cn('flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors', alert.isRead ? 'bg-[#0F0F1A] opacity-60' : 'bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15')}>
                <AlertTriangle size={14} className={alert.isRead ? 'text-gray-500' : 'text-orange-400'} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', alert.isRead ? 'text-gray-400' : 'text-white')}>{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(alert.createdAt)}</p>
                </div>
                {!alert.isRead && <div className="w-2 h-2 bg-orange-400 rounded-full shrink-0 mt-1" />}
              </div>
            ))}
            {(alerts as any[]).length === 0 && <p className="text-gray-500 text-center py-8">No alerts</p>}
          </div>
        </div>

        {/* Login Activity */}
        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4">
          <h2 className="font-bold text-white flex items-center gap-2 mb-4">
            <LogIn size={16} className="text-blue-400" /> Login Activity
            <span className="ml-auto text-xs text-gray-500">Auto-refreshes every 30s</span>
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(activity as any[]).map((log: any) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-purple-500/10 last:border-0">
                <div className="flex items-center gap-2">
                  {log.action === 'LOGIN' ? <LogIn size={12} className="text-green-400 shrink-0" /> : <LogOut size={12} className="text-red-400 shrink-0" />}
                  <div>
                    <p className="text-sm text-white">{log.user?.name}</p>
                    <p className="text-xs text-gray-500">{log.business?.name || 'No business'} • {log.ipAddress || 'Unknown IP'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn('text-xs font-medium', log.action === 'LOGIN' ? 'text-green-400' : 'text-red-400')}>{log.action}</p>
                  <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                </div>
              </div>
            ))}
            {(activity as any[]).length === 0 && <p className="text-gray-500 text-center py-8">No activity yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
