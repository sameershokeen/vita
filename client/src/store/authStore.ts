import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: { currency: string; theme: string; budgetLimits?: Record<string, number> };
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<boolean>;
  setUser: (user: User) => void;
}

function syncToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('lifetrack_token', token);
  else localStorage.removeItem('lifetrack_token');
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      hasHydrated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        const res = await authApi.login({ email, password });
        syncToken(res.data.token);
        set({ user: res.data.user, token: res.data.token, isLoading: false });
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        const res = await authApi.register({ name, email, password });
        syncToken(res.data.token);
        set({ user: res.data.user, token: res.data.token, isLoading: false });
      },

      logout: () => {
        syncToken(null);
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        const token = get().token ?? (typeof window !== 'undefined' ? localStorage.getItem('lifetrack_token') : null);
        if (!token) return false;
        try {
          const res = await authApi.me();
          syncToken(token);
          set({ user: res.data.user, token });
          return true;
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 401) get().logout();
          return false;
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'lifetrack-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => () => {
        const lsToken = typeof window !== 'undefined' ? localStorage.getItem('lifetrack_token') : null;
        const state = useAuthStore.getState();
        const token = state.token ?? lsToken;
        syncToken(token);
        useAuthStore.setState({
          hasHydrated: true,
          ...(token && !state.token ? { token } : {}),
        });
      },
    }
  )
);

if (typeof window !== 'undefined') {
  useAuthStore.persist.onFinishHydration(() => {
    const state = useAuthStore.getState();
    if (!state.hasHydrated) {
      const lsToken = localStorage.getItem('lifetrack_token');
      const token = state.token ?? lsToken;
      syncToken(token);
      useAuthStore.setState({
        hasHydrated: true,
        ...(token && !state.token ? { token } : {}),
      });
    }
  });

  // Safety net: never block the UI if hydration stalls
  setTimeout(() => {
    if (!useAuthStore.getState().hasHydrated) {
      useAuthStore.setState({ hasHydrated: true });
    }
  }, 500);
}
