'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSuperAdminStore } from '@/store/super-admin.store';
import toast from 'react-hot-toast';
import { Shield } from 'lucide-react';

export default function SuperAdminAuthPage() {
  const [email, setEmail] = useState('superadmin@shms.rw');
  const [password, setPassword] = useState('superadmin123');
  const [loading, setLoading] = useState(false);
  const { login } = useSuperAdminStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push('/super-admin');
    } catch {
      toast.error('Invalid super admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Super Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-1">SHMS Platform Control Center</p>
        </div>
        <div className="bg-[#1A1A2E] border border-purple-500/20 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all" type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : 'Access Control Center'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-600 mt-4">Restricted access — authorized personnel only</p>
      </div>
    </div>
  );
}
