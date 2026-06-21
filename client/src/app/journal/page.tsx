'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Button, PageHeader, Empty, Spinner, Textarea, Input } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { journalApi } from '@/lib/api';
import { formatDate, today, MOOD_SCORES, MOODS, moodIcon } from '@/lib/utils';
import { Trash2, RefreshCw, Pencil, X, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JournalPage() {
  const qc = useQueryClient();
  const [mood, setMood] = useState('good');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['journal'],
    queryFn: () => journalApi.list({ limit: 30 }).then(r => r.data),
  });
  const { data: streakData } = useQuery({
    queryKey: ['journal-streak'],
    queryFn: () => journalApi.streak().then(r => r.data),
  });
  const { data: promptData, refetch: refetchPrompt } = useQuery({
    queryKey: ['journal-prompt'],
    queryFn: () => journalApi.prompt().then(r => r.data),
  });

  const entries: any[] = data?.entries ?? [];
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  const createMutation = useMutation({
    mutationFn: (d: object) => journalApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      qc.invalidateQueries({ queryKey: ['journal-streak'] });
      setTitle(''); setBody(''); setMood('good');
      toast.success('Entry saved');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => journalApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); setSelected(null); toast.success('Entry deleted'); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { toast.error('Title and body required'); return; }
    createMutation.mutate({
      title, body, date: today(),
      mood: { emoji: mood, score: MOOD_SCORES[mood] ?? 3 },
    });
  };

  if (isLoading) return <AppShell><div className="flex items-center justify-center h-64"><Spinner size={28} /></div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title="Journal"
        sub="Reflect, write, and grow"
        action={
          <div className="flex items-center gap-2">
            <span className="badge badge-plum">{streakData?.streak ?? 0} day streak</span>
            <span className="badge badge-amber">{streakData?.totalEntries ?? 0} entries</span>
          </div>
        }
      />

      <div className="grid-2col">
        <div>
          <p className="section-title">
            Recent entries
            <span className="badge badge-primary">{entries.length} shown</span>
          </p>

          {entries.length === 0 ? (
            <div className="card-lg">
              <Empty icon={<BookOpen size={24} />} title="No entries yet"
                description="Start your journaling practice — even 3 sentences a day makes a difference." />
            </div>
          ) : (
            entries.map((e: any) => (
              <div key={e._id} onClick={() => setSelected(selected?._id === e._id ? null : e)}
                className={`bg-surface rounded-lg p-3.5 mb-2 cursor-pointer transition-all hover:bg-canvas ${selected?._id === e._id ? 'ring-1 ring-primary/30' : ''}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-faint flex items-center gap-1.5">
                    <Icon name={moodIcon(e.mood?.emoji)} size={13} />{formatDate(e.date, 'MMM d, yyyy')}
                  </span>
                  <button onClick={ev => { ev.stopPropagation(); deleteMutation.mutate(e._id); }} className="text-faint hover:text-danger transition-colors p-0.5">
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-sm font-medium text-ink mb-1 truncate">{e.title}</p>
                <p className="text-xs text-faint line-clamp-2">{e.body}</p>
                {e.wordCount > 0 && <p className="text-xs text-faint mt-1.5">{e.wordCount} words</p>}
              </div>
            ))
          )}
        </div>

        <div>
          {selected ? (
            <>
              <div className="card-lg mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-faint flex items-center gap-1.5">
                    <Icon name={moodIcon(selected.mood?.emoji)} size={13} />{formatDate(selected.date, 'EEEE, MMMM d, yyyy')}
                  </span>
                  <button onClick={() => setSelected(null)} className="text-faint hover:text-ink"><X size={16} /></button>
                </div>
                <h2 className="text-base font-medium text-ink mb-3">{selected.title}</h2>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{selected.body}</p>
                {selected.wordCount > 0 && <p className="text-xs text-faint mt-4">{selected.wordCount} words</p>}
              </div>
              <Button variant="ghost" className="w-full justify-center text-muted" onClick={() => setSelected(null)}>Back to write</Button>
            </>
          ) : (
            <div className="card-lg">
              <p className="section-title">Write today's entry</p>

              {promptData?.prompt && (
                <div className="bg-canvas rounded-lg p-3 mb-4 flex items-start justify-between gap-2">
                  <p className="text-xs text-muted italic">{promptData.prompt}</p>
                  <button onClick={() => refetchPrompt()} className="text-faint hover:text-primary flex-shrink-0 transition-colors" title="New prompt">
                    <RefreshCw size={13} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-muted font-medium block mb-2">How are you feeling?</label>
                  <div className="flex gap-2 flex-wrap">
                    {MOODS.map(m => (
                      <button key={m.key} type="button" onClick={() => setMood(m.key)}
                        className={`flex flex-col items-center gap-1 w-14 h-14 rounded-lg transition-all ${mood === m.key ? 'bg-primary-soft ring-1 ring-primary' : 'bg-canvas hover:bg-line'}`}>
                        <Icon name={m.icon} size={17} className={mood === m.key ? 'text-primary' : 'text-muted'} />
                        <span className={`text-[10px] ${mood === m.key ? 'text-primary' : 'text-faint'}`}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Input placeholder="Entry title..." value={title} onChange={e => setTitle(e.target.value)} required />
                <Textarea placeholder="What's on your mind? Write freely..." value={body} onChange={e => setBody(e.target.value)} style={{ minHeight: 160 }} required />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-faint">{wordCount} words</span>
                  <Button type="submit" variant="primary" loading={createMutation.isPending}><Pencil size={13} /> Save entry</Button>
                </div>
              </form>
            </div>
          )}

          {entries.length > 0 && (
            <div className="card-lg mt-4">
              <p className="section-title">Mood history</p>
              <div className="flex flex-wrap gap-3">
                {entries.slice(0, 14).map((e: any) => (
                  <div key={e._id} className="flex flex-col items-center gap-1">
                    <Icon name={moodIcon(e.mood?.emoji)} size={18} className="text-muted" />
                    <span className="text-[10px] text-faint">{formatDate(e.date, 'M/d')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
