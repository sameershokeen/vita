'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Modal, Button, Input, Select, Textarea, PageHeader, Empty, ProgressBar, Spinner } from '@/components/ui';
import { goalsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, CheckCircle2, Circle, Trash2, ChevronUp, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Health','Career','Finance','Learning','Personal','Fitness','Relationships','Other'];
const PALETTE: Record<string, { bg: string; text: string; hex: string }> = {
  primary: { bg: '#e1f5ee', text: '#0f6e56', hex: '#1d5b3f' },
  info:    { bg: '#e6f1fb', text: '#185fa5', hex: '#185fa5' },
  amber:   { bg: '#faeeda', text: '#854f0b', hex: '#ba7517' },
  plum:    { bg: '#fbeaf0', text: '#993556', hex: '#993556' },
  danger:  { bg: '#faece7', text: '#993c1d', hex: '#d85a30' },
};
const COLOR_KEYS = Object.keys(PALETTE);

type GoalForm = { title: string; description: string; category: string; color: string; targetDate: string; progress: number };

export default function GoalsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [msOpen, setMsOpen] = useState<string | null>(null);
  const [msText, setMsText] = useState('');
  const [form, setForm] = useState<GoalForm>({ title:'', description:'', category:'Personal', color:'primary', targetDate:'', progress:0 });

  const { data: activeData, isLoading } = useQuery({
    queryKey: ['goals','active'],
    queryFn: () => goalsApi.list({ status: 'active' }).then(r => r.data),
  });
  const { data: completedData } = useQuery({
    queryKey: ['goals','completed'],
    queryFn: () => goalsApi.list({ status: 'completed' }).then(r => r.data),
  });

  const goals: any[]     = activeData?.goals ?? [];
  const completed: any[] = completedData?.goals ?? [];

  const createMutation = useMutation({
    mutationFn: (d: object) => goalsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      setOpen(false);
      setForm({ title:'', description:'', category:'Personal', color:'primary', targetDate:'', progress:0 });
      toast.success('Goal added');
    },
    onError: () => toast.error('Failed to create goal'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => goalsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); toast.success('Goal deleted'); },
  });

  const addMsMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => goalsApi.addMilestone(id, { title }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setMsText(''); setMsOpen(null); },
  });

  const toggleMsMutation = useMutation({
    mutationFn: ({ id, msId, completed }: { id: string; msId: string; completed: boolean }) =>
      goalsApi.updateMilestone(id, msId, { completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const f = (k: keyof GoalForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  if (isLoading) return <AppShell><div className="flex items-center justify-center h-64"><Spinner size={28} /></div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title="Goals"
        sub="Set targets, track milestones, stay focused"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-primary">{goals.length} active</span>
            <span className="badge badge-amber">{completed.length} completed</span>
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}><Plus size={14} /> New goal</Button>
          </div>
        }
      />

      <div className="grid-2col">
        <div>
          <p className="section-title">Active goals</p>
          {goals.length === 0 ? (
            <div className="card-lg">
              <Empty icon={<Target size={26} />} title="No goals yet"
                description="Set your first goal and start tracking your path to success."
                action={<Button variant="primary" onClick={() => setOpen(true)}><Plus size={14} /> Add goal</Button>} />
            </div>
          ) : (
            goals.map((g: any) => {
              const pal = PALETTE[g.color] ?? PALETTE.primary;
              return (
                <div key={g._id} className="card mb-3">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-ink truncate">{g.title}</p>
                      <p className="text-xs text-faint">{g.category}{g.targetDate ? ` · Due ${formatDate(g.targetDate, 'MMM d')}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: pal.bg, color: pal.text }}>{g.progress}%</span>
                      <button onClick={() => updateMutation.mutate({ id: g._id, data: { progress: Math.min(100, g.progress + 5) } })}
                        className="text-faint hover:text-ink p-1 transition-colors" title="+5%"><ChevronUp size={14} /></button>
                      <button onClick={() => deleteMutation.mutate(g._id)} className="text-faint hover:text-danger p-1 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  <ProgressBar value={g.progress} color={pal.hex} />

                  {g.milestones?.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {g.milestones.map((m: any) => (
                        <div key={m._id} className="flex items-center gap-2">
                          <button onClick={() => toggleMsMutation.mutate({ id: g._id, msId: m._id, completed: !m.completed })}>
                            {m.completed ? <CheckCircle2 size={14} className="text-primary" /> : <Circle size={14} className="text-line" />}
                          </button>
                          <span className={`text-xs ${m.completed ? 'line-through text-faint' : 'text-ink'}`}>{m.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    {msOpen === g._id ? (
                      <>
                        <input autoFocus className="form-input flex-1 text-xs py-1.5" placeholder="New milestone..."
                          value={msText} onChange={e => setMsText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && msText.trim()) addMsMutation.mutate({ id: g._id, title: msText.trim() });
                            if (e.key === 'Escape') { setMsOpen(null); setMsText(''); }
                          }} />
                        <Button size="sm" variant="primary"
                          onClick={() => msText.trim() && addMsMutation.mutate({ id: g._id, title: msText.trim() })}
                          loading={addMsMutation.isPending}>Add</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setMsOpen(null); setMsText(''); }}>Cancel</Button>
                      </>
                    ) : (
                      <button onClick={() => setMsOpen(g._id)} className="text-xs text-faint hover:text-primary flex items-center gap-1 transition-colors">
                        <Plus size={11} /> Add milestone
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div>
          <p className="section-title">
            Completed goals
            <span className="badge badge-primary">{completed.length}</span>
          </p>
          {completed.length === 0 ? (
            <div className="card py-8 text-center text-sm text-faint mb-5">Completed goals will appear here</div>
          ) : (
            <div className="mb-5">
              {completed.map((g: any) => (
                <div key={g._id} className="card mb-2 flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{g.title}</p>
                    <p className="text-xs text-faint">{g.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card-lg">
            <p className="section-title">Summary</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-canvas rounded-lg p-3">
                <span className="text-xs text-faint">Active</span>
                <p className="text-2xl font-medium text-ink mt-1">{goals.length}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <span className="text-xs text-faint">Completed</span>
                <p className="text-2xl font-medium text-ink mt-1">{completed.length}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3 col-span-2">
                <span className="text-xs text-faint">Avg progress</span>
                <p className="text-2xl font-medium text-ink mt-1">
                  {goals.length ? Math.round(goals.reduce((s: number, g: any) => s + g.progress, 0) / goals.length) : 0}%
                </p>
                <div className="mt-2">
                  <ProgressBar value={goals.length ? Math.round(goals.reduce((s: number, g: any) => s + g.progress, 0) / goals.length) : 0} color="#1d5b3f" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New goal">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <Input label="Goal title" placeholder="e.g. Run a 5K" value={form.title} onChange={f('title')} required />
          <Textarea label="Description" placeholder="Why is this goal important?" value={form.description} onChange={f('description')} />
          <Select label="Category" value={form.category} onChange={f('category')}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Select>
          <Input label="Target date" type="date" value={form.targetDate} onChange={f('targetDate')} />
          <div className="space-y-1.5">
            <label className="text-xs text-muted font-medium">Color</label>
            <div className="flex gap-2">
              {COLOR_KEYS.map(k => (
                <button key={k} type="button" onClick={() => setForm(p => ({ ...p, color: k }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === k ? 'scale-125 ring-2 ring-ink/20' : 'hover:scale-110'}`}
                  style={{ background: PALETTE[k].hex }} />
              ))}
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full justify-center" loading={createMutation.isPending}>
            <Plus size={14} /> Add goal
          </Button>
        </form>
      </Modal>
    </AppShell>
  );
}
