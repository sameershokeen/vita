'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';
import Link from 'next/link';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !email) setError('Invalid reset link. Please request a new one.');
  }, [token, email]);

  const strength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-danger', 'bg-amber', 'bg-info', 'bg-primary'][strength];
  const strengthText  = ['', 'text-danger', 'text-amber', 'text-info', 'text-primary'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await authApi.resetPassword({ token, email, password });
      localStorage.setItem('lifetrack_token', res.data.token);
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full border-2 border-primary flex items-center justify-center">
              <Leaf size={17} className="text-primary" />
            </div>
            <span className="text-2xl font-medium text-ink">Vita</span>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-6">
          {error ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center mx-auto mb-3">
                <XCircle size={24} className="text-danger" />
              </div>
              <h2 className="font-medium text-ink mb-2">Invalid reset link</h2>
              <p className="text-sm text-muted mb-4">{error}</p>
              <Link href="/forgot-password">
                <Button variant="primary" className="w-full justify-center">Request new link</Button>
              </Link>
            </div>
          ) : done ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} className="text-primary" />
              </div>
              <h2 className="font-medium text-ink mb-2">Password reset!</h2>
              <p className="text-sm text-muted">Redirecting you to your dashboard…</p>
            </div>
          ) : (
            <>
              <h1 className="text-base font-medium text-ink mb-1">Set new password</h1>
              <p className="text-sm text-muted mb-5">
                For <span className="text-ink font-medium">{email}</span>
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted font-medium">New password</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="form-input pr-10"
                    />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink">
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-line'}`} />
                        ))}
                      </div>
                      <p className={`text-xs ${strengthText}`}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm password"
                  type="password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                {confirm && password !== confirm && (
                  <p className="text-xs text-danger -mt-2">Passwords don&apos;t match</p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  loading={loading}
                  disabled={password !== confirm || password.length < 6}
                >
                  Reset password
                </Button>
              </form>
            </>
          )}
        </div>

        <Link href="/login" className="flex items-center justify-center gap-1.5 mt-4 text-sm text-faint hover:text-ink transition-colors">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas flex items-center justify-center text-faint">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
