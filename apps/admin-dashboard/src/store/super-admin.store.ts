import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const saApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api' });

interface SuperAdminState {
  superAdmin: any | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useSuperAdminStore = create<SuperAdminState>()(
  persist(
    (set) => ({
      superAdmin: null,
      token: null,
      login: async (email, password) => {
        const { data } = await saApi.post('/super-admin/auth/login', { email, password });
        localStorage.setItem('shms_sa_token', data.token);
        set({ superAdmin: data.superAdmin, token: data.token });
      },
      logout: () => {
        localStorage.removeItem('shms_sa_token');
        set({ superAdmin: null, token: null });
      },
    }),
    { name: 'shms-super-admin', partialize: (s) => ({ superAdmin: s.superAdmin, token: s.token }) },
  ),
);
