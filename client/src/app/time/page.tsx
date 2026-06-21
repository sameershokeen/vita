'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Modal, Button, Input, Select, PageHeader, Empty, Spinner } from '@/components/ui';
import { timeApi } from '@/lib/api';
import { today, formatMinutes } from '@/lib/utils';
import { Plus, CheckCircle2, Trash2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value:'deep-work', label:'Deep work', dot:'#1d5b3f' },
  { value:'learning',  label:'Learning',  dot:'#185fa5' },
  { value:'meeting',   label:'Meeting',   dot:'#ba7517' },
  { value:'admin',     label:'Admin',     dot:'#d85a30' },
  { value:'exercise',  label:'Exercise',  dot:'#5dcaa5' },
  { value:'break',     label:'Break',     dot:'#993556' },
  { value:'personal',  label:'Personal',  dot:'#9a9a92' },
  { value:'other',     label:'Other',     dot:'#5a5a52' },
];
const catDot = (c: string) => CATEGORIES.find(x => x.value === c)?.dot ?? '#1d5b3f';

type BlockForm = { title: string; startTime: string; duration: number; category: string; notes: string };

export default function TimePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today());
  const [form, setForm] = useState<BlockForm>({ title:'', startTime:'09:00', duration:60, category:'deep-work', notes:'' });

  const { data, isLoading } = useQuery({
    queryKey: ['time', selectedDate],
    queryFn: () => timeApi.getDay(selectedDate).then(r => r.data),
  });
  const { data: statsData } = useQuery({
    queryKey: ['time-stats'],
    queryFn: () => timeApi.stats().then(r => r.data),
  });

  const blocks: any[] = data?.blocks ?? [];
  const totalPlanned  = blocks.reduce((s, b) => s + b.duration, 0);
  const totalDone     = blocks.filter(b => b.completed).reduce((s, b) => s + b.duration, 0);
  const doneCount     = blocks.filter(b => b.completed).length;

  const createMutation = useMutation({
    mutationFn: (d: object) => timeApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time'] });
      qc.invalidateQueries({ queryKey: ['time-stats'] });
      setOpen(false);
      setForm({ title:'', startTime:'09:00', duration:60, category:'deep-work', notes:'' });
      toast.success('Block added');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => timeApi.update(id, { completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time', selectedDate] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => timeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time'] });
      qc.invalidateQueries({ queryKey: ['time-stats'] });
      toast.success('Deleted');
    },
  });

  const f = (k: keyof BlockForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: k === 'duration' ? parseInt(e.target.value) : e.target.value }));

  if (isLoading) return <AppShell><div className="flex items-center justify-center h-64"><Spinner size={28} /></div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title="Time management"
        sub="Plan your day, protect deep work"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="form-input py-2 text-sm w-auto" />
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Add block</Button>
          </div>
        }
      />

      <div className="grid-stats mb-4">
        <div className="bg-primary text-white rounded-lg p-4">
          <span className="text-xs text-white/75">Planned</span>
          <p className="text-2xl font-medium mt-1">{formatMinutes(totalPlanned)}</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Completed</span>
          <p className="text-2xl font-medium mt-1 text-ink">{formatMinutes(totalDone)}</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Blocks</span>
          <p className="text-2xl font-medium mt-1 text-ink">{blocks.length}</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Done</span>
          <p className="text-2xl font-medium mt-1 text-ink">{doneCount}/{blocks.length}</p>
        </div>
      </div>

      <div className="grid-2col">
        <div className="card-lg">
          <div className="section-title">
            Schedule
            <span className="text-xs text-faint">{new Date(selectedDate).toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}</span>
          </div>

          {blocks.length === 0 ? (
            <Empty icon={<Clock size={24} />} title="No blocks yet" description="Time-block your day to stay focused and productive."
              action={<Button variant="primary" size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Add block</Button>} />
          ) : (
            blocks.map((b: any) => (
              <div key={b._id} className={`flex items-center gap-3 py-2.5 mb-1.5 last:mb-0 rounded-lg bg-canvas px-3 group ${b.completed ? 'opacity-50' : ''}`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catDot(b.category) }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-faint w-12 flex-shrink-0">{b.startTime}</span>
                    <span className={`text-sm font-medium truncate ${b.completed ? 'line-through text-faint' : 'text-ink'}`}>{b.title}</span>
                  </div>
                  <p className="text-xs text-faint ml-14">{b.category} · {formatMinutes(b.duration)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleMutation.mutate({ id: b._id, completed: !b.completed })} className="text-faint hover:text-primary p-1"><CheckCircle2 size={15} /></button>
                  <button onClick={() => deleteMutation.mutate(b._id)} className="text-faint hover:text-danger p-1"><Trash2 size={13} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="card-lg">
            <p className="section-title">This month's focus</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-canvas rounded-lg p-3"><span className="text-xs text-faint">Deep work</span><p className="text-lg font-medium text-ink mt-1">{formatMinutes(statsData?.byCategory?.['deep-work'] ?? 0)}</p></div>
              <div className="bg-canvas rounded-lg p-3"><span className="text-xs text-faint">Learning</span><p className="text-lg font-medium text-ink mt-1">{formatMinutes(statsData?.byCategory?.['learning'] ?? 0)}</p></div>
              <div className="bg-canvas rounded-lg p-3"><span className="text-xs text-faint">Meetings</span><p className="text-lg font-medium text-ink mt-1">{formatMinutes(statsData?.byCategory?.['meeting'] ?? 0)}</p></div>
              <div className="bg-canvas rounded-lg p-3"><span className="text-xs text-faint">Exercise</span><p className="text-lg font-medium text-ink mt-1">{formatMinutes(statsData?.byCategory?.['exercise'] ?? 0)}</p></div>
            </div>
          </div>

          <div className="card-lg">
            <p className="section-title">Category breakdown</p>
            {!statsData?.totalMinutes ? (
              <p className="text-sm text-faint text-center py-4">No data this month</p>
            ) : (
              CATEGORIES.map(cat => {
                const mins = statsData?.byCategory?.[cat.value] ?? 0;
                const pct  = Math.round(mins / (statsData.totalMinutes || 1) * 100);
                if (!mins) return null;
                return (
                  <div key={cat.value} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-1.5 text-ink"><span className="w-2 h-2 rounded-full" style={{ background: cat.dot }} />{cat.label}</span>
                      <span className="text-faint">{formatMinutes(mins)} ({pct}%)</span>
                    </div>
                    <div className="progress-track"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cat.dot }} /></div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add time block">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ ...form, date: selectedDate }); }} className="space-y-4">
          <Input label="Task" placeholder="e.g. Deep work session" value={form.title} onChange={f('title')} required />
          <Input label="Start time" type="time" value={form.startTime} onChange={f('startTime')} />
          <Select label="Duration" value={form.duration.toString()} onChange={f('duration')}>
            <option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option>
            <option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option><option value="180">3 hours</option>
          </Select>
          <Select label="Category" value={form.category} onChange={f('category')}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          <Button type="submit" variant="primary" className="w-full justify-center" loading={createMutation.isPending}>
            <Plus size={14} /> Add block
          </Button>
        </form>
      </Modal>
    </AppShell>
  );
}
