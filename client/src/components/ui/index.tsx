'use client';

import { cn } from '@/lib/utils';
import { X, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-medium text-ink">{title}</h2>
          <button onClick={onClose} className="text-faint hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs text-muted font-medium">{label}</label>}
      <input {...props} className={cn('form-input', props.className)} />
    </div>
  );
}

export function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs text-muted font-medium">{label}</label>}
      <textarea {...props} className={cn('form-input resize-none', props.className)} />
    </div>
  );
}

export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs text-muted font-medium">{label}</label>}
      <select {...props} className={cn('form-input', props.className)}>
        {children}
      </select>
    </div>
  );
}

export function Button({
  variant = 'default', size = 'md', loading, children, className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'ghost' | 'danger' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}) {
  return (
    <button
      disabled={loading || props.disabled}
      {...props}
      className={cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'ghost' && 'bg-transparent hover:bg-canvas',
        variant === 'danger' && 'bg-danger-soft text-danger hover:bg-danger/15',
        variant === 'dark' && 'bg-ink text-white hover:bg-black',
        size === 'sm' && 'btn-sm',
        size === 'lg' && 'px-5 py-3 text-base',
        className,
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export function ProgressBar({ value, color = '#1d5b3f' }: { value: number; color?: string }) {
  return (
    <div className="progress-track">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-primary" />;
}

export function Empty({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <div className="w-14 h-14 rounded-full bg-canvas flex items-center justify-center text-faint text-2xl">{icon}</div>
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="text-sm text-muted max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, accent = false, icon }: {
  label: string; value: React.ReactNode; sub?: string; accent?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-lg p-4 flex flex-col gap-1', accent ? 'bg-primary text-white' : 'bg-surface text-ink')}>
      <div className="flex items-center justify-between">
        <span className={cn('text-xs', accent ? 'text-white/75' : 'text-muted')}>{label}</span>
        {icon && <span className={accent ? 'text-white/60' : 'text-faint'}>{icon}</span>}
      </div>
      <span className="text-2xl font-medium leading-none">{value}</span>
      {sub && <span className={cn('text-xs', accent ? 'text-white/70' : 'text-faint')}>{sub}</span>}
    </div>
  );
}

export function PageHeader({ title, sub, action }: {
  title: string; sub?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl md:text-2xl font-medium text-ink tracking-tight">{title}</h1>
        {sub && <p className="text-sm text-muted mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function RingProgress({ pct, size = 34, stroke = 4, color = '#1d5b3f', trackColor = '#e9e7df' }: {
  pct: number; size?: number; stroke?: number; color?: string; trackColor?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
}
