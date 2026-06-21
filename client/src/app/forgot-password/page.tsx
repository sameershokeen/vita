'use client';

import { useState } from 'react';
import { Leaf, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setSent(true);
      if (res.data.devResetUrl) setDevUrl(res.data.devResetUrl);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
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
          {!sent ? (
            <>
              <h1 className="text-base font-medium text-ink mb-1">Forgot password?</h1>
              <p className="text-sm text-muted mb-5">
                Enter your email and we&apos;ll send you a reset link valid for 10 minutes.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" className="w-full justify-center" loading={loading}>
                  <Mail size={14} /> Send reset link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} className="text-primary" />
              </div>
              <h2 className="font-medium text-ink mb-2">Check your inbox</h2>
              <p className="text-sm text-muted mb-4">
                If <span className="text-ink font-medium">{email}</span> is registered, a reset link is on its way.
              </p>
              {devUrl && (
                <div className="bg-amber-soft rounded-lg p-3 mb-4 text-left">
                  <p className="text-xs text-amber font-medium mb-1">Development mode — reset URL:</p>
                  <a href={devUrl} className="text-xs text-primary break-all hover:underline">{devUrl}</a>
                </div>
              )}
              <Button variant="ghost" onClick={() => { setSent(false); setEmail(''); setDevUrl(''); }} className="text-muted text-sm">
                Try a different email
              </Button>
            </div>
          )}
        </div>

        <Link href="/login" className="flex items-center justify-center gap-1.5 mt-4 text-sm text-faint hover:text-ink transition-colors">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
