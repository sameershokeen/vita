'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          <p className="text-muted text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="text-xs text-muted font-medium">Password</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
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
          </div>
          <Button type="submit" variant="primary" className="w-full justify-center" loading={false}>
            Sign in
          </Button>
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-faint hover:text-primary transition-colors">
              Forgot password?
            </Link>
          </div>
        </form>

        <p className="text-center text-sm text-faint mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
