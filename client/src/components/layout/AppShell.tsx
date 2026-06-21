'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, token, hasHydrated, fetchMe } = useAuthStore();
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;

    (async () => {
      const activeToken = token ?? localStorage.getItem('lifetrack_token');
      if (!activeToken) {
        router.replace('/login');
        return;
      }

      if (user) {
        if (!cancelled) setAuthReady(true);
        return;
      }

      const ok = await fetchMe();
      if (cancelled) return;

      if (!ok) {
        router.replace('/login');
        return;
      }

      setAuthReady(true);
    })();

    return () => { cancelled = true; };
  }, [hasHydrated, token, user, fetchMe, router]);

  if (!hasHydrated || !authReady || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 px-4 pb-6 md:pt-6 md:px-6 md:pr-6">
        {children}
      </main>
    </div>
  );
}
