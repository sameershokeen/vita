'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, Repeat2, Target, TrendingUp, Clock, Wallet, BookOpen,
  Settings, LogOut, X, Menu, Leaf,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { label: 'Habits',    href: '/habits',    icon: Repeat2 },
  { label: 'Goals',     href: '/goals',     icon: Target },
  { label: 'Progress',  href: '/progress',  icon: TrendingUp },
  { label: 'Time',      href: '/time',      icon: Clock },
  { label: 'Expenses',  href: '/expenses',  icon: Wallet },
  { label: 'Journal',   href: '/journal',   icon: BookOpen },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <aside className="w-[220px] min-w-[220px] bg-surface rounded-xl m-3 mr-0 flex flex-col h-[calc(100vh-24px)]">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border-2 border-primary flex items-center justify-center">
            <Leaf size={14} className="text-primary" />
          </div>
          <span className="text-base font-medium text-ink">tracker </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-faint hover:text-ink md:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-0 pt-2">
        <p className="px-5 py-1.5 text-[11px] uppercase tracking-wide text-faint">Menu</p>
        {nav.map(item => (
          <NavLink key={item.href} {...item}
            active={pathname.startsWith(item.href)}
            onClick={onClose} />
        ))}

        
      </nav>

      <div className="p-3">
        <div className="bg-ink text-white rounded-lg p-3.5">
          <p className="text-xs leading-relaxed mb-2.5">Build your first<br/>habit streak today</p>
          <Link href="/habits" className="block bg-primary rounded-md py-1.5 text-center text-xs font-medium">
            Get started
          </Link>
        </div>

        <div className="flex items-center gap-2.5 px-2 py-3 mt-2">
          <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-sand-text text-xs font-medium flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-ink truncate">{user?.name}</p>
            <p className="text-xs text-faint truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-faint hover:text-danger transition-colors p-1" title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ label, href, icon: Icon, active, onClick }: {
  label: string; href: string; icon: any; active: boolean; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={cn('nav-item', active && 'active')}>
      <Icon size={17} />{label}
    </Link>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="md:hidden fixed top-3 left-3 z-50 bg-surface rounded-lg p-2 text-muted hover:text-ink shadow-md">
      <Menu size={18} />
    </button>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <div className="hidden md:flex">
        <SidebarContent />
      </div>

      <MobileMenuButton onClick={() => setMobileOpen(true)} />

      {mobileOpen && (
        <>
          <div className="sidebar-overlay md:hidden" onClick={() => setMobileOpen(false)} />
          <div className={cn('sidebar-mobile md:hidden', mobileOpen && 'open')}>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
