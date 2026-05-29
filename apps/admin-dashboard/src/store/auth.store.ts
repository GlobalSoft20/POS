import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const http = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api' });

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

interface AuthUser { id: string; name: string; email: string; role: string; }
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (email: string, password: string) => Promise<string>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      login: async (email, password) => {
        const { data } = await http.post('/auth/login', { email, password });
        // Set cookie so middleware can read role on every request
        setCookie('shms_token', data.token, 7);
        localStorage.setItem('shms_token', data.token);
        if (data.role === 'SUPER_ADMIN') localStorage.setItem('shms_sa_token', data.token);
        set({ user: data.user, token: data.token, role: data.role });
        return data.role as string;
      },
      logout: () => {
        deleteCookie('shms_token');
        localStorage.removeItem('shms_token');
        localStorage.removeItem('shms_sa_token');
        set({ user: null, token: null, role: null });
      },
    }),
    {
      name: 'shms-auth-v3',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, token: s.token, role: s.role }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Re-sync cookie from localStorage on page load
        if (state?.token) setCookie('shms_token', state.token, 7);
      },
    },
  ),
);
