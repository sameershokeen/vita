'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Modal, Button, Input, Select, PageHeader, Empty, ProgressBar, Spinner } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { authApi, expensesApi } from '@/lib/api';
import { formatCurrency, formatDate, currentMonth, today, EXPENSE_ICON } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, Wallet, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EXP_CATS = ['Food','Transport','Shopping','Health','Entertainment','Education','Rent','Utilities','Other'];
const DEFAULT_BUDGETS: Record<string, number> = { Food: 5000, Transport: 2000, Shopping: 3000, Entertainment: 1500, Education: 2000 };

type ExpForm = { title: string; amount: string; type: string; category: string; note: string };

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { user, setUser } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({});
  const [newBudgetCat, setNewBudgetCat] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [form, setForm] = useState<ExpForm>({ title:'', amount:'', type:'expense', category:'Food', note:'' });

  const budgets: Record<string, number> = user?.preferences?.budgetLimits ?? DEFAULT_BUDGETS;

  const openBudgetEditor = () => {
    setBudgetDraft(Object.fromEntries(Object.entries(budgets).map(([cat, limit]) => [cat, String(limit)])));
    setNewBudgetCat('');
    setBudgetOpen(true);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', month],
    queryFn: () => expensesApi.list({ month, limit: 100 }).then(r => r.data),
  });
  const { data: summaryData } = useQuery({
    queryKey: ['expense-summary', month],
    queryFn: () => expensesApi.summary(month).then(r => r.data),
  });

  const expenses: any[] = data?.expenses ?? [];
  const summary = summaryData ?? { totalIncome:0, totalExpenses:0, balance:0, savingsRate:0, byCategory:{} };

  const createMutation = useMutation({
    mutationFn: (d: object) => expensesApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', month] });
      qc.invalidateQueries({ queryKey: ['expense-summary', month] });
      setOpen(false);
      setForm({ title:'', amount:'', type:'expense', category:'Food', note:'' });
      toast.success('Transaction added');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', month] });
      qc.invalidateQueries({ queryKey: ['expense-summary', month] });
      toast.success('Deleted');
    },
  });

  const budgetMutation = useMutation({
    mutationFn: (budgetLimits: Record<string, number>) => {
      const prefs = user?.preferences ?? { currency: 'INR', theme: 'dark' };
      return authApi.update({ preferences: { ...prefs, budgetLimits } });
    },
    onSuccess: (res) => {
      setUser(res.data.user);
      setBudgetOpen(false);
      toast.success('Budget limits saved');
    },
    onError: () => toast.error('Failed to save budget limits'),
  });

  const saveBudgets = () => {
    const emptyCats = Object.entries(budgetDraft)
      .filter(([, val]) => !val.trim() || isNaN(parseFloat(val)) || parseFloat(val) <= 0)
      .map(([cat]) => cat);
    if (emptyCats.length > 0) {
      toast.error(`Enter an amount for: ${emptyCats.join(', ')}`);
      return;
    }
    const budgetLimits: Record<string, number> = {};
    for (const [cat, val] of Object.entries(budgetDraft)) {
      budgetLimits[cat] = parseFloat(val);
    }
    budgetMutation.mutate(budgetLimits);
  };

  const addBudgetCategory = () => {
    if (!newBudgetCat || budgetDraft[newBudgetCat]) return;
    setBudgetDraft(p => ({ ...p, [newBudgetCat]: '1000' }));
    setNewBudgetCat('');
  };

  const removeBudgetCategory = (cat: string) => {
    setBudgetDraft(p => {
      const next = { ...p };
      delete next[cat];
      return next;
    });
  };

  const availableBudgetCats = EXP_CATS.filter(c => !(c in budgetDraft));

  const f = (k: keyof ExpForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  if (isLoading) return <AppShell><div className="flex items-center justify-center h-64"><Spinner size={28} /></div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title="Expenses"
        sub="Track income, spending, and savings"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="form-input py-2 text-sm w-auto" />
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Add entry</Button>
          </div>
        }
      />

      <div className="grid-stats mb-4">
        <div className={`rounded-lg p-4 ${summary.balance >= 0 ? 'bg-primary text-white' : 'bg-surface'}`}>
          <span className={`text-xs ${summary.balance >= 0 ? 'text-white/75' : 'text-muted'}`}>Balance</span>
          <p className={`text-2xl font-medium mt-1 ${summary.balance >= 0 ? '' : 'text-danger'}`}>{formatCurrency(summary.balance)}</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Income</span>
          <p className="text-2xl font-medium mt-1 text-ink">{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Spent</span>
          <p className="text-2xl font-medium mt-1 text-ink">{formatCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="bg-surface rounded-lg p-4">
          <span className="text-xs text-muted">Savings rate</span>
          <p className="text-2xl font-medium mt-1 text-ink">{summary.savingsRate}%</p>
        </div>
      </div>

      <div className="grid-2col">
        <div className="card-lg">
          <div className="section-title">
            Transactions
            <span className="badge badge-primary">{expenses.length} entries</span>
          </div>
          {expenses.length === 0 ? (
            <Empty icon={<Wallet size={24} />} title="No transactions yet" description="Start tracking your income and spending."
              action={<Button variant="primary" size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Add entry</Button>} />
          ) : (
            <div className="space-y-0.5 max-h-[480px] overflow-y-auto pr-1">
              {expenses.map((e: any) => (
                <div key={e._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-canvas transition-colors group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: e.type === 'income' ? '#e1f5ee' : '#f0ece0' }}>
                    <Icon name={EXPENSE_ICON[e.category] ?? 'CircleDollarSign'} size={16}
                      style={{ color: e.type === 'income' ? '#0f6e56' : '#6b4f2a' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{e.title}</p>
                    <p className="text-xs text-faint">{e.category} · {formatDate(e.date, 'MMM d')}</p>
                  </div>
                  <span className={`text-sm font-medium flex-shrink-0 ${e.type === 'income' ? 'text-primary' : 'text-danger'}`}>
                    {e.type === 'income' ? '+' : '-'}{formatCurrency(e.amount)}
                  </span>
                  <button onClick={() => deleteMutation.mutate(e._id)} className="opacity-0 group-hover:opacity-100 text-faint hover:text-danger transition-all p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card-lg">
            <p className="section-title">Spending by category</p>
            {Object.keys(summary.byCategory ?? {}).length === 0 ? (
              <p className="text-sm text-faint text-center py-4">No expense data</p>
            ) : (
              Object.entries(summary.byCategory as Record<string, number>)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amt]) => {
                  const pct = summary.totalExpenses > 0 ? Math.min(100, Math.round((amt / summary.totalExpenses) * 100)) : 0;
                  return (
                    <div key={cat} className="mb-3 last:mb-0">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-1.5 text-ink">
                          <Icon name={EXPENSE_ICON[cat] ?? 'CircleDollarSign'} size={13} className="text-faint" />{cat}
                        </span>
                        <span className="text-faint">{formatCurrency(amt)} · {pct}%</span>
                      </div>
                      <ProgressBar value={pct} color="#d85a30" />
                    </div>
                  );
                })
            )}
          </div>

          <div className="card-lg">
            <div className="section-title">
              Budget limits
              <Button variant="ghost" size="sm" onClick={openBudgetEditor}>
                <Settings2 size={13} /> Customize
              </Button>
            </div>
            {Object.keys(budgets).length === 0 ? (
              <p className="text-sm text-faint text-center py-4">No budget limits set</p>
            ) : (
              Object.entries(budgets).map(([cat, limit]) => {
              const spent = (summary.byCategory as any)?.[cat] ?? 0;
              const pct   = Math.min(100, Math.round(spent / limit * 100));
              const color = pct >= 90 ? '#d85a30' : pct > 70 ? '#ba7517' : '#1d5b3f';
              return (
                <div key={cat} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 text-ink"><Icon name={EXPENSE_ICON[cat]} size={13} className="text-faint" />{cat}</span>
                    <span className={pct >= 90 ? 'text-danger' : 'text-faint'}>{formatCurrency(spent)} / {formatCurrency(limit)}</span>
                  </div>
                  <ProgressBar value={pct} color={color} />
                </div>
              );
            })
            )}
          </div>
        </div>
      </div>

      <Modal open={budgetOpen} onClose={() => setBudgetOpen(false)} title="Customize budget limits">
        <div className="space-y-4">
          <p className="text-xs text-muted">Set monthly spending limits per category. Progress bars on the expenses page use these values.</p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {Object.entries(budgetDraft).map(([cat, val]) => (
              <div key={cat} className="flex items-end gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    label={cat}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0"
                    value={val}
                    onChange={e => setBudgetDraft(p => ({ ...p, [cat]: e.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeBudgetCategory(cat)}
                  className="text-faint hover:text-danger p-2 mb-0.5 transition-colors"
                  title="Remove category"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          {availableBudgetCats.length > 0 && (
            <div className="flex items-end gap-2">
              <Select label="Add category" value={newBudgetCat} onChange={e => setNewBudgetCat(e.target.value)} className="flex-1">
                <option value="">Select category…</option>
                {availableBudgetCats.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Button type="button" variant="default" size="sm" onClick={addBudgetCategory} disabled={!newBudgetCat}>
                <Plus size={14} /> Add
              </Button>
            </div>
          )}
          <Button type="button" variant="primary" className="w-full justify-center" loading={budgetMutation.isPending} onClick={saveBudgets}>
            Save budget limits
          </Button>
        </div>
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title="Add transaction">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ ...form, amount: parseFloat(form.amount), date: today() }); }} className="space-y-4">
          <Input label="Description" placeholder="e.g. Grocery shopping" value={form.title} onChange={f('title')} required />
          <Input label="Amount (₹)" type="number" placeholder="0" min="0" step="0.01" value={form.amount} onChange={f('amount')} required />
          <Select label="Type" value={form.type} onChange={f('type')}>
            <option value="expense">Expense</option><option value="income">Income</option>
          </Select>
          <Select label="Category" value={form.category} onChange={f('category')}>
            {form.type === 'income'
              ? (<><option value="Income">Salary / Income</option><option value="Investment">Investment</option></>)
              : EXP_CATS.map(c => <option key={c}>{c}</option>)}
          </Select>
          <Button type="submit" variant="primary" className="w-full justify-center" loading={createMutation.isPending}>
            <Plus size={14} /> Save transaction
          </Button>
        </form>
      </Modal>
    </AppShell>
  );
}
