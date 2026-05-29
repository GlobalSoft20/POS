import { useState, useEffect } from 'react';
import { syncPendingQueue } from '@/lib/sync';
import toast from 'react-hot-toast';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      toast.loading('Syncing offline data...', { id: 'sync' });
      const { synced, failed } = await syncPendingQueue();
      if (synced > 0) toast.success(`Synced ${synced} offline action(s)`, { id: 'sync' });
      else toast.dismiss('sync');
      if (failed > 0) toast.error(`${failed} action(s) failed to sync`);
      setPendingCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline — changes will sync when reconnected', { duration: 4000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, pendingCount };
}
