import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  try { return format(parseISO(dateStr), fmt); } catch { return dateStr; }
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/* ── Vita palette: category → hex (used for progress bars, dots, heatmap) ── */
export const CATEGORY_COLORS: Record<string, string> = {
  Health: '#1d5b3f',
  Fitness: '#5dcaa5',
  Learning: '#185fa5',
  Mindfulness: '#993556',
  Productivity: '#6b4f2a',
  Finance: '#ba7517',
  Social: '#d85a30',
  Other: '#9a9a92',
};

/* ── Category → lucide icon name (string key, resolved in components) ── */
export const CATEGORY_ICON: Record<string, string> = {
  Health: 'Droplet',
  Fitness: 'Activity',
  Learning: 'BookOpen',
  Mindfulness: 'Wind',
  Productivity: 'Zap',
  Finance: 'PiggyBank',
  Social: 'Users',
  Other: 'CheckCircle2',
};

export const EXPENSE_ICON: Record<string, string> = {
  Food: 'UtensilsCrossed',
  Transport: 'Car',
  Shopping: 'ShoppingBag',
  Health: 'HeartPulse',
  Entertainment: 'Tv',
  Education: 'GraduationCap',
  Rent: 'Home',
  Utilities: 'Zap',
  Income: 'Wallet',
  Investment: 'TrendingUp',
  Other: 'CircleDollarSign',
};

export const MOOD_SCORES: Record<string, number> = {
  great: 5, good: 4, okay: 3, low: 2, bad: 1,
};

export const MOODS = [
  { key: 'great', label: 'Great', icon: 'Sun' },
  { key: 'good',  label: 'Good',  icon: 'Smile' },
  { key: 'okay',  label: 'Okay',  icon: 'Meh' },
  { key: 'low',   label: 'Low',   icon: 'CloudRain' },
  { key: 'bad',   label: 'Bad',   icon: 'Frown' },
];

export function moodIcon(key: string): string {
  return MOODS.find(m => m.key === key)?.icon ?? 'Smile';
}
