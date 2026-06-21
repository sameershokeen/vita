'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Modal, Button, Input, Select, PageHeader, Empty, Spinner } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { habitsApi } from '@/lib/api';
import { today, CATEGORY_COLORS, CATEGORY_ICON } from '@/lib/utils';
import { Plus, Flame, CheckCircle2, Circle, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { HabitHeatmap, HabitWeekDots } from '@/components/habits/HabitHeatmap';

const CATEGORIES = ['Health','Fitness','Learning','Mindfulness','Productivity','Finance','Social','Other'];

type HabitForm = { name: string; description: string; category: string; frequency: string };

export default function HabitsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<any | null>(null);
  const [form, setForm] = useState<HabitForm>({ name:'', description:'', category:'Health', frequency:'daily' });

  const { data, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsApi.list().then(r => r.data),
  });
  const habits: any[] = data?.habits ?? [];

  const createMutation = useMutation({
    mutationFn: (d: object) => habitsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      setOpen(false);
      setForm({ name:'', description:'', category:'Health', frequency:'daily' });
      toast.success('Habit created');
    },
    onError: () => toast.error('Failed to create habit'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => habitsApi.toggle(id, today()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => habitsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      if (selectedHabit) setSelectedHabit(null);
      toast.success('Habit archived');
    },
  });

  const doneTodayCount = habits.filter(h => h.completedToday).length;
  const topStreak = Math.max(0, ...habits.map(h => h.streak ?? 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, 'frequency.type': form.frequency });
  };

  const f = (k: keyof HabitForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  if (isLoading) return <AppShell><div className="flex items-center justify-center h-64"><Spinner size={28} /></div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title="Habits"
        sub="Build consistency one day at a time"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-amber">{topStreak} day best streak</span>
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}><Plus size={14} /> New habit</Button>
          </div>
        }
      />

      <div className="grid-stats mb-4">
        <div className="bg-primary text-white rounded-lg p-4">
          <span className="text-xs text-white/75">Today</span>
          <p className="text-2xl font-medium mt-1">{doneTodayCount}<span className="text-sm text-white/70">/{habits.length}</span></p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Total habits</span>
          <p className="text-2xl font-medium mt-1 text-ink">{habits.length}</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Completion</span>
          <p className="text-2xl font-medium mt-1 text-ink">{habits.length ? Math.round(doneTodayCount/habits.length*100) : 0}%</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Best streak</span>
          <p className="text-2xl font-medium mt-1 text-ink">{topStreak}</p>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="card-lg">
          <Empty icon={<Icon name="CheckCircle2" size={26} />} title="No habits yet"
            description="Start building your daily routines — small habits compound into big results."
            action={<Button variant="primary" onClick={() => setOpen(true)}><Plus size={14} /> Add your first habit</Button>} />
        </div>
      ) : (
        <>
          <div className="grid-2col mb-4">
            <div className="card-lg">
              <div className="section-title">
                Daily habits
                <span className="badge badge-primary">{doneTodayCount}/{habits.length} done</span>
              </div>
              <div className="space-y-0.5">
                {habits.map((h: any) => (
                  <div key={h._id}
                    onClick={() => setSelectedHabit(h._id === selectedHabit?._id ? null : h)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${selectedHabit?._id === h._id ? 'bg-canvas' : 'hover:bg-canvas'}`}>
                    <button onClick={e => { e.stopPropagation(); toggleMutation.mutate(h._id); }} className="flex-shrink-0">
                      {h.completedToday
                        ? <CheckCircle2 size={20} className="text-primary fill-primary/10" />
                        : <Circle size={20} className="text-line" />}
                    </button>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: (CATEGORY_COLORS[h.category] ?? '#1d5b3f') + '18' }}>
                      <Icon name={CATEGORY_ICON[h.category] ?? 'CheckCircle2'} size={15}
                        style={{ color: CATEGORY_COLORS[h.category] ?? '#1d5b3f' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${h.completedToday ? 'line-through text-faint' : 'text-ink'}`}>{h.name}</p>
                      <p className="text-xs text-faint">{h.category} · {h.frequency?.type ?? 'daily'}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="flex items-center gap-1 text-xs text-amber"><Flame size={11} />{h.streak}</span>
                      <button onClick={e => { e.stopPropagation(); archiveMutation.mutate(h._id); }}
                        className="text-faint hover:text-danger transition-colors p-1">
                        <Archive size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-lg">
              {selectedHabit ? (
                <>
                  <div className="section-title">
                    {selectedHabit.name}
                    <button onClick={() => setSelectedHabit(null)} className="text-xs text-faint hover:text-ink">close</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-canvas rounded-lg p-3"><span className="text-xs text-faint">Streak</span><p className="text-xl font-medium text-ink mt-1">{selectedHabit.streak}</p></div>
                    <div className="bg-canvas rounded-lg p-3"><span className="text-xs text-faint">Today</span><p className="text-xl font-medium text-ink mt-1">{selectedHabit.completedToday ? 'Done' : 'Pending'}</p></div>
                    <div className="bg-canvas rounded-lg p-3"><span className="text-xs text-faint">Category</span><p className="text-sm font-medium text-ink mt-1">{selectedHabit.category}</p></div>
                    <div className="bg-canvas rounded-lg p-3"><span className="text-xs text-faint">Frequency</span><p className="text-sm font-medium text-ink mt-1">{selectedHabit.frequency?.type ?? 'daily'}</p></div>
                  </div>
                  <p className="text-xs font-medium text-muted mb-2">This week</p>
                  <HabitWeekDots completions={selectedHabit.completions ?? []} color={CATEGORY_COLORS[selectedHabit.category] ?? '#1d5b3f'} />
                </>
              ) : (
                <>
                  <div className="section-title">Category breakdown</div>
                  {CATEGORIES.filter(c => habits.some(h => h.category === c)).map(cat => {
                    const catHabits = habits.filter(h => h.category === cat);
                    const done = catHabits.filter(h => h.completedToday).length;
                    const pct = Math.round(done / catHabits.length * 100);
                    return (
                      <div key={cat} className="mb-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="flex items-center gap-1.5 text-ink">
                            <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />{cat}
                          </span>
                          <span className="text-faint">{done}/{catHabits.length}</span>
                        </div>
                        <div className="progress-track">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-5 pt-4 border-t border-line">
                    <p className="text-xs font-medium text-muted mb-3">This week</p>
                    {habits.slice(0, 6).map((h: any) => (
                      <div key={h._id} className="flex items-center gap-3 mb-2.5">
                        <span className="text-xs text-faint w-28 truncate">{h.name}</span>
                        <HabitWeekDots completions={h.completions ?? []} color={CATEGORY_COLORS[h.category] ?? '#1d5b3f'} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card-lg">
            <div className="section-title">
              {selectedHabit ? `${selectedHabit.name} — activity` : 'All habits — activity'}
              <span className="badge badge-primary">26 weeks</span>
            </div>
            <HabitHeatmap
              completions={selectedHabit ? (selectedHabit.completions ?? []) : habits.flatMap(h => h.completions ?? [])}
              weeks={26}
              color={selectedHabit ? (CATEGORY_COLORS[selectedHabit.category] ?? '#1d5b3f') : '#1d5b3f'}
              showMonths tooltip
            />
          </div>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New habit">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Habit name" placeholder="e.g. Morning meditation" value={form.name} onChange={f('name')} required />
          <Input label="Description (optional)" placeholder="Why this habit matters..." value={form.description} onChange={f('description')} />
          <Select label="Category" value={form.category} onChange={f('category')}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Select>
          <Select label="Frequency" value={form.frequency} onChange={f('frequency')}>
            <option value="daily">Every day</option>
            <option value="weekdays">Weekdays only</option>
            <option value="weekends">Weekends only</option>
          </Select>
          <Button type="submit" variant="primary" className="w-full justify-center" loading={createMutation.isPending}>
            <Plus size={14} /> Create habit
          </Button>
        </form>
      </Modal>
    </AppShell>
  );
}
