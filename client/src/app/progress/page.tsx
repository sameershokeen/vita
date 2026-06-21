'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader, Spinner, StatCard } from '@/components/ui';
import { progressApi, habitsApi, expensesApi, journalApi, goalsApi } from '@/lib/api';
import { formatCurrency, currentMonth, CATEGORY_COLORS } from '@/lib/utils';
import { HabitHeatmap } from '@/components/habits/HabitHeatmap';

type ChartType = 'line' | 'bar' | 'radar' | 'doughnut';

function ChartCanvas({ type, data, options }: { type: ChartType; data: any; options?: any }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inst = useRef<any>(null);

  useEffect(() => {
    if (!ref.current || !data) return;
    let Chart: any;
    try { Chart = require('chart.js/auto'); } catch { return; }

    inst.current?.destroy();
    inst.current = new Chart(ref.current, { type, data, options });
    return () => inst.current?.destroy();
  }, [type, data, options]);

  return <canvas ref={ref} />;
}

const GRID_COLOR = '#e9e7df';
const TICK_COLOR = '#9a9a92';
const TICK_FONT = { size: 11 };

const baseScales = {
  x: { grid: { display: false }, ticks: { color: TICK_COLOR, font: TICK_FONT } },
  y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: TICK_FONT } },
};

export default function ProgressPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['progress-overview'],
    queryFn: () => progressApi.overview().then(r => r.data),
  });
  const { data: monthlyData } = useQuery({
    queryKey: ['progress-monthly'],
    queryFn: () => progressApi.habitsMonthly(6).then(r => r.data),
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
  const { data: moodData } = useQuery({
    queryKey: ['journal-mood'],
    queryFn: () => journalApi.mood(30).then(r => r.data),
  });

  const monthly = monthlyData?.monthly ?? [];
  const habits = habitsData?.habits ?? [];
  const goals = goalsData?.goals ?? [];
  const moodHistory = moodData?.moodHistory ?? [];

  const lineData = {
    labels: monthly.map((m: any) => {
      const [, mon] = m.month.split('-');
      return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mon) - 1];
    }),
    datasets: [
      {
        label: 'Completions',
        data: monthly.map((m: any) => m.completions),
        borderColor: '#1d5b3f',
        backgroundColor: '#1d5b3f12',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: '#1d5b3f',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: baseScales,
  };

  const catCounts: Record<string, number> = {};
  habits.forEach((h: any) => { catCounts[h.category] = (catCounts[h.category] || 0) + 1; });
  const catLabels = Object.keys(catCounts);
  const doughnutData = {
    labels: catLabels,
    datasets: [{
      data: Object.values(catCounts),
      backgroundColor: catLabels.map(c => CATEGORY_COLORS[c] ?? '#9a9a92'),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { color: TICK_COLOR, font: TICK_FONT, padding: 10, boxWidth: 10, boxHeight: 10 },
      },
    },
  };

  const goalsBarData = {
    labels: goals.map((g: any) => g.title.length > 18 ? g.title.slice(0, 18) + '…' : g.title),
    datasets: [{
      label: 'Progress',
      data: goals.map((g: any) => g.progress),
      backgroundColor: ['#1d5b3f99','#185fa599','#ba751799','#99355699','#d85a3099'],
      borderColor: ['#1d5b3f','#185fa5','#ba7517','#993556','#d85a30'],
      borderWidth: 1.5,
      borderRadius: 5,
    }],
  };
  const goalsBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ...baseScales.x, min: 0, max: 100, grid: { color: GRID_COLOR }, ticks: { ...baseScales.x.ticks, callback: (v: number) => v + '%' } },
      y: { grid: { display: false }, ticks: { color: TICK_COLOR, font: TICK_FONT } },
    },
  };

  const moodLineData = {
    labels: moodHistory.slice(-14).map((m: any) => {
      const [, mon, day] = m.date.split('-');
      return `${parseInt(mon)}/${parseInt(day)}`;
    }),
    datasets: [{
      label: 'Mood',
      data: moodHistory.slice(-14).map((m: any) => m.score),
      borderColor: '#993556',
      backgroundColor: '#99355610',
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: '#993556',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    }],
  };
  const moodOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: baseScales.x,
      y: { ...baseScales.y, min: 1, max: 5, ticks: { ...baseScales.y.ticks, stepSize: 1 } },
    },
  };

  const habitsDoneRate = habits.length > 0
    ? Math.round(habits.filter((h: any) => h.completedToday).length / habits.length * 100)
    : 0;
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((s: number, g: any) => s + g.progress, 0) / goals.length)
    : 0;
  const journalScore = Math.min(100, (overview?.journal?.streak ?? 0) * 5);
  const financeScore = (expSummary?.savingsRate ?? 0);
  const streakScore = Math.min(100, (overview?.habits?.bestStreak ?? 0) * 4);
  const consistencyScore = monthly.length > 0
    ? Math.round(monthly.reduce((s: any, m: any) => s + (m.habits > 0 ? m.completions / (m.habits * 30) * 100 : 0), 0) / monthly.length)
    : 0;

  const radarData = {
    labels: ['Habits', 'Goals', 'Journaling', 'Finance', 'Streaks', 'Consistency'],
    datasets: [{
      label: 'You',
      data: [habitsDoneRate, avgGoalProgress, journalScore, financeScore, streakScore, consistencyScore],
      borderColor: '#1d5b3f',
      backgroundColor: '#1d5b3f20',
      pointBackgroundColor: '#1d5b3f',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }],
  };
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        min: 0, max: 100,
        grid: { color: GRID_COLOR },
        ticks: { display: false },
        pointLabels: { color: TICK_COLOR, font: { size: 11 } },
        angleLines: { color: GRID_COLOR },
      },
    },
  };

  const expCatLabels = Object.keys(expSummary?.byCategory ?? {});
  const expBarData = {
    labels: expCatLabels,
    datasets: [{
      label: 'Spent',
      data: expCatLabels.map(c => (expSummary?.byCategory as any)?.[c] ?? 0),
      backgroundColor: '#d85a3099',
      borderColor: '#d85a30',
      borderWidth: 1.5,
      borderRadius: 5,
    }],
  };
  const expBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: baseScales.x,
      y: { ...baseScales.y, ticks: { ...baseScales.y.ticks, callback: (v: number) => '₹' + v.toLocaleString() } },
    },
  };

  const allCompletions = habits.flatMap((h: any) => h.completions ?? []);

  if (isLoading) return (
    <AppShell><div className="flex items-center justify-center h-64"><Spinner size={28} /></div></AppShell>
  );

  return (
    <AppShell>
      <PageHeader title="Progress" sub="Visualize your growth over time" />

      <div className="grid-stats mb-4">
        <div className="bg-primary text-white rounded-lg p-4">
          <span className="text-xs text-white/75">Habits</span>
          <p className="text-2xl font-medium mt-1">{habits.length}</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Best streak</span>
          <p className="text-2xl font-medium mt-1 text-ink">{overview?.habits?.bestStreak ?? 0}</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Goals avg</span>
          <p className="text-2xl font-medium mt-1 text-ink">{avgGoalProgress}%</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Journal streak</span>
          <p className="text-2xl font-medium mt-1 text-ink">{overview?.journal?.streak ?? 0}</p>
        </div>
      </div>

      <div className="card-lg mb-4">
        <div className="section-title">
          Overall activity heatmap
          <span className="badge badge-primary">all habits · 26 weeks</span>
        </div>
        {allCompletions.length > 0
          ? <HabitHeatmap completions={allCompletions} weeks={26} color="#1d5b3f" showMonths tooltip />
          : <p className="text-sm text-faint text-center py-6">Start tracking habits to see your heatmap</p>
        }
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="card-lg md:col-span-2">
          <p className="section-title">Habit completions — last 6 months</p>
          <div style={{ height: 220 }}>
            {monthly.length > 0
              ? <ChartCanvas type="line" data={lineData} options={lineOptions} />
              : <p className="text-sm text-faint flex items-center justify-center h-full">No data yet</p>}
          </div>
        </div>
        <div className="card-lg">
          <p className="section-title">Consistency radar</p>
          <div style={{ height: 220 }}>
            <ChartCanvas type="radar" data={radarData} options={radarOptions} />
          </div>
        </div>
      </div>

      <div className="grid-2col mb-4">
        <div className="card-lg">
          <p className="section-title">Goal progress</p>
          <div style={{ height: goals.length > 0 ? Math.max(180, goals.length * 44) : 180 }}>
            {goals.length > 0
              ? <ChartCanvas type="bar" data={goalsBarData} options={goalsBarOptions} />
              : <p className="text-sm text-faint flex items-center justify-center h-full">No active goals</p>}
          </div>
        </div>
        <div className="card-lg">
          <p className="section-title">Habits by category</p>
          <div style={{ height: 200 }}>
            {habits.length > 0
              ? <ChartCanvas type="doughnut" data={doughnutData} options={doughnutOptions} />
              : <p className="text-sm text-faint flex items-center justify-center h-full">No habits yet</p>}
          </div>
        </div>
      </div>

      <div className="grid-2col">
        <div className="card-lg">
          <p className="section-title">Mood — last 14 journal entries</p>
          <div style={{ height: 200 }}>
            {moodHistory.length > 0
              ? <ChartCanvas type="line" data={moodLineData} options={moodOptions} />
              : <p className="text-sm text-faint flex items-center justify-center h-full">Start journaling to track mood</p>}
          </div>
        </div>
        <div className="card-lg">
          <p className="section-title">Spending by category — this month</p>
          <div style={{ height: 200 }}>
            {expCatLabels.length > 0
              ? <ChartCanvas type="bar" data={expBarData} options={expBarOptions} />
              : <p className="text-sm text-faint flex items-center justify-center h-full">No expense data this month</p>}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-line">
            <div className="text-center">
              <p className="text-xs text-faint mb-0.5">Income</p>
              <p className="text-sm font-medium text-primary">{formatCurrency(expSummary?.totalIncome ?? 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-faint mb-0.5">Spent</p>
              <p className="text-sm font-medium text-danger">{formatCurrency(expSummary?.totalExpenses ?? 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-faint mb-0.5">Savings</p>
              <p className="text-sm font-medium text-info">{expSummary?.savingsRate ?? 0}%</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
