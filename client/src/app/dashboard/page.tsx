'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader, ProgressBar, Spinner, RingProgress, Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { progressApi, habitsApi, goalsApi, expensesApi, journalApi, timeApi } from '@/lib/api';
import { formatCurrency, formatDate, today, currentMonth, CATEGORY_ICON } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle2, Circle, ArrowUpRight, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['progress-overview'],
    queryFn: () => progressApi.overview().then(r => r.data),
  });
  const { data: habitsData } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsApi.list().then(r => r.data),
  });
  const { data: goalsData } = useQuery({
    queryKey: ['goals', 'active'],
    queryFn: () => goalsApi.list({ status: 'active' }).then(r => r.data),
  });
  const { data: expSummary } = useQuery({
    queryKey: ['expense-summary', currentMonth()],
    queryFn: () => expensesApi.summary(currentMonth()).then(r => r.data),
  });
  const { data: blocksData } = useQuery({
    queryKey: ['time', today()],
    queryFn: () => timeApi.getDay(today()).then(r => r.data),
  });
  const { data: streakData } = useQuery({
    queryKey: ['journal-streak'],
    queryFn: () => journalApi.streak().then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => habitsApi.toggle(id, today()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['progress-overview'] });
    },
  });

  const habits: any[] = habitsData?.habits ?? [];
  const goals: any[]  = goalsData?.goals ?? [];
  const blocks: any[] = blocksData?.blocks ?? [];
  const doneTodayCount = habits.filter(h => h.completedToday).length;

  // Last 7 days consistency rings (% of habits done each day)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const dayLabels = ['S','M','T','W','T','F','S'];
  const ringPcts = last7.map(date => {
    if (habits.length === 0) return 0;
    const done = habits.filter(h => (h.completions ?? []).some((c: any) => c.date === date && c.completed)).length;
    return Math.round((done / habits.length) * 100);
  });

  const spentPct = expSummary?.totalIncome > 0
    ? Math.min(100, Math.round((expSummary.totalExpenses / expSummary.totalIncome) * 100))
    : (expSummary?.totalExpenses > 0 ? 100 : 0);
  const ringC = 2 * Math.PI * 70;
  const ringDash = (spentPct / 100) * ringC;

  if (isLoading) return (
    <AppShell><div className="flex items-center justify-center h-64"><Spinner size={28} /></div></AppShell>
  );

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        sub="Track habits, goals, and growth with ease"
        action={
          <div className="flex gap-2">
            <Link href="/habits"><Button variant="primary" size="sm"><Plus size={14} /> New habit</Button></Link>
            <Button size="sm">Import data</Button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid-stats mb-4">
        <div className="bg-primary text-white rounded-lg p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-white/75">Active habits</span>
            <ArrowUpRight size={14} className="text-white/60" />
          </div>
          <p className="text-2xl font-medium mt-1.5 mb-0.5">{habits.length}</p>
          <p className="text-xs text-white/70">tracked daily</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted">Completed today</span>
            <ArrowUpRight size={14} className="text-faint" />
          </div>
          <p className="text-2xl font-medium mt-1.5 mb-0.5 text-ink">{doneTodayCount}</p>
          <p className="text-xs text-faint">of {habits.length} habits</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted">Active goals</span>
            <ArrowUpRight size={14} className="text-faint" />
          </div>
          <p className="text-2xl font-medium mt-1.5 mb-0.5 text-ink">{goals.length}</p>
          <p className="text-xs text-faint">avg {overview?.goals?.avgProgress ?? 0}% progress</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted">Longest streak</span>
            <span className="text-xs text-faint">days</span>
          </div>
          <p className="text-2xl font-medium mt-1.5 mb-0.5 text-ink">{overview?.habits?.bestStreak ?? 0}</p>
          <p className="text-xs text-faint">keep it going</p>
        </div>
      </div>

      {/* Row: rings + reminder + goals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="card-lg md:col-span-1">
          <div className="section-title">
            Weekly consistency
            <ArrowUpRight size={14} className="text-faint" />
          </div>
          <div className="flex justify-between">
            {dayLabels.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <RingProgress pct={ringPcts[i]} size={32} stroke={4}
                  color={ringPcts[i] > 70 ? '#1d5b3f' : ringPcts[i] > 40 ? '#5dcaa5' : '#e9e7df'} />
                <span className="text-xs text-faint">{d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-lg flex flex-col">
          <p className="section-title">Today's habits</p>
          <div className="flex-1 space-y-1">
            {habits.length === 0 ? (
              <p className="text-sm text-faint py-2">No habits yet</p>
            ) : habits.slice(0, 3).map((h: any) => (
              <div key={h._id} className="flex items-center gap-2.5 py-1.5">
                <button onClick={() => toggleMutation.mutate(h._id)} className="flex-shrink-0">
                  {h.completedToday
                    ? <CheckCircle2 size={18} className="text-primary fill-primary/10" />
                    : <Circle size={18} className="text-line" />}
                </button>
                <span className={`text-sm truncate ${h.completedToday ? 'text-faint line-through' : 'text-ink'}`}>{h.name}</span>
              </div>
            ))}
          </div>
          <Link href="/habits" className="btn btn-primary justify-center mt-3 text-xs">
            View all habits
          </Link>
        </div>

        <div className="card-lg">
          <p className="section-title">Goals</p>
          <div className="space-y-3">
            {goals.length === 0 ? (
              <p className="text-sm text-faint py-2">No active goals</p>
            ) : goals.slice(0, 3).map((g: any) => (
              <div key={g._id}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-ink truncate mr-2">{g.title}</span>
                  <span className="text-faint flex-shrink-0">{g.progress}%</span>
                </div>
                <ProgressBar value={g.progress} color="#1d5b3f" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: journal + spending + schedule */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-lg">
          <div className="section-title">
            Journal streak
            <Link href="/journal" className="text-xs bg-chip rounded px-2.5 py-1 text-ink">+ new entry</Link>
          </div>
          <p className="text-2xl font-medium text-ink mb-0.5">{streakData?.streak ?? 0} days</p>
          <p className="text-xs text-faint">current streak</p>
        </div>

        <div className="card-lg">
          <p className="section-title">Monthly spending</p>
          <div className="flex flex-col items-center py-2">
            <svg width="160" height="90" viewBox="0 0 160 90">
              <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#e9e7df" strokeWidth="12" strokeLinecap="round" />
              <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#1d5b3f" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${ringDash} ${ringC}`} />
            </svg>
            <p className="text-2xl font-medium text-ink -mt-2">{spentPct}%</p>
            <p className="text-xs text-faint">of income spent</p>
          </div>
          <div className="flex justify-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Spent</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-line" />Remaining</span>
          </div>
        </div>

        <div className="card-lg">
          <p className="section-title">Today's schedule</p>
          {blocks.length === 0 ? (
            <p className="text-sm text-faint py-2">No blocks scheduled</p>
          ) : (
            <div className="space-y-2">
              {blocks.slice(0, 4).map((b: any) => (
                <div key={b._id} className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-faint w-11 flex-shrink-0">{b.startTime}</span>
                  <span className="text-ink truncate flex-1">{b.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
