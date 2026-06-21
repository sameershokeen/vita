'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface Completion { date: string; completed: boolean }
interface HabitHeatmapProps {
  completions: Completion[];
  weeks?: number;
  color?: string;
  showMonths?: boolean;
  tooltip?: boolean;
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toIso(date: Date): string { return date.toISOString().split('T')[0]; }
function addDays(date: Date, n: number): Date { const d = new Date(date); d.setDate(d.getDate() + n); return d; }

export function HabitHeatmap({
  completions, weeks = 26, color = '#1d5b3f', showMonths = true, tooltip = true,
}: HabitHeatmapProps) {
  const [hovered, setHovered] = useState<{ date: string; count: number } | null>(null);

  const completedSet = useMemo(
    () => new Set(completions.filter(c => c.completed).map(c => c.date)),
    [completions]
  );

  const grid = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const gridEnd = addDays(today, 6 - dayOfWeek);
    const gridStart = addDays(gridEnd, -(weeks * 7 - 1));

    const columns: { date: string }[][] = [];
    let current = new Date(gridStart);
    for (let w = 0; w < weeks; w++) {
      const col: { date: string }[] = [];
      for (let d = 0; d < 7; d++) { col.push({ date: toIso(current) }); current = addDays(current, 1); }
      columns.push(col);
    }
    return { columns };
  }, [weeks]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    grid.columns.forEach((col, i) => {
      const m = new Date(col[0].date).getMonth();
      if (m !== lastMonth) { labels.push({ label: MONTHS[m], col: i }); lastMonth = m; }
    });
    return labels;
  }, [grid]);

  const CELL = 12, GAP = 3;
  const totalW = grid.columns.length * (CELL + GAP);

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: totalW + 32 }}>
        {showMonths && (
          <div className="relative mb-1" style={{ height: 14, marginLeft: 28 }}>
            {monthLabels.map(({ label, col }) => (
              <div key={`${label}-${col}`}
                className="text-[10px] text-faint whitespace-nowrap absolute"
                style={{ left: col * (CELL + GAP) }}>
                {label}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-0.5 mt-2">
          <div className="flex flex-col gap-0.5 mr-1.5">
            {DAYS.map((d, i) => (
              <div key={d} className="text-[10px] text-faint leading-none flex items-center"
                style={{ height: CELL, visibility: i % 2 === 1 ? 'visible' : 'hidden' }}>
                {d[0]}
              </div>
            ))}
          </div>

          <div className="flex" style={{ gap: GAP }}>
            {grid.columns.map((col, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                {col.map(({ date }) => {
                  const done = completedSet.has(date);
                  const isFuture = date > toIso(new Date());
                  return (
                    <div
                      key={date}
                      style={{
                        width: CELL, height: CELL, borderRadius: 3,
                        background: isFuture ? 'transparent' : done ? color : '#e9e7df',
                        border: isFuture ? '1px solid #e9e7df' : 'none',
                        cursor: tooltip && !isFuture ? 'pointer' : 'default',
                      }}
                      className={cn(!isFuture && done && 'hover:opacity-80')}
                      onMouseEnter={() => tooltip && !isFuture && setHovered({ date, count: done ? 1 : 0 })}
                      onMouseLeave={() => setHovered(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 ml-7 flex-wrap">
          <span className="text-[10px] text-faint">Less</span>
          {['#e9e7df', color + '55', color + '99', color + 'cc', color].map((bg, i) => (
            <div key={i} style={{ width: CELL, height: CELL, borderRadius: 3, background: bg }} />
          ))}
          <span className="text-[10px] text-faint">More</span>

          {hovered && tooltip && (
            <div className="ml-3 text-[11px] text-muted bg-canvas px-2 py-1 rounded">
              {hovered.date} — {hovered.count > 0 ? 'completed' : 'missed'}
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-3 ml-7 text-[11px] text-faint">
          <span><span className="text-ink font-medium">{completedSet.size}</span> completions</span>
          <span><span className="text-ink font-medium">{weeks}</span> weeks tracked</span>
          <span>
            <span className="text-ink font-medium">
              {completedSet.size > 0 && weeks > 0 ? Math.round((completedSet.size / (weeks * 7)) * 100) : 0}%
            </span> consistency
          </span>
        </div>
      </div>
    </div>
  );
}

export function HabitWeekDots({ completions, color = '#1d5b3f' }: { completions: Completion[]; color?: string }) {
  const completedSet = new Set(completions.filter(c => c.completed).map(c => c.date));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toIso(d);
  });
  return (
    <div className="flex gap-1">
      {days.map((date) => (
        <div key={date} title={date}
          style={{
            width: 10, height: 10, borderRadius: 3,
            background: completedSet.has(date) ? color : '#e9e7df',
          }}
        />
      ))}
    </div>
  );
}
