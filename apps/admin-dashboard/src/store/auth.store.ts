import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User { id: string; name: string; email: string; role: string; }
interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const data: any = await api.post('/auth/login', { email, password });
        localStorage.setItem('shms_token', data.token);
        set({ user: data.user, token: data.token });
      },
      logout: () => {
        localStorage.removeItem('shms_token');
        set({ user: null, token: null });
      },
    }),
    { name: 'shms-auth', partialize: (s) => ({ user: s.user, token: s.token }) },
  ),
);
