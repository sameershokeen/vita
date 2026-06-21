'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await register(form.name, form.email, form.password);
      toast.success('Welcome to Vita!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

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
          <p className="text-muted text-sm">Start your self-improvement journey</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 space-y-4">
          <Input label="Full name" placeholder="Alex Johnson" value={form.name} onChange={set('name')} required />
          <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          <Input label="Password" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required />
          <Button type="submit" variant="primary" className="w-full justify-center" loading={isLoading}>
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-faint mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
