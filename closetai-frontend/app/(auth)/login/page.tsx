'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message || 'Failed to sign in. Please try again.');
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-3xl font-light text-[#252525]">Welcome back</h2>
        <p className="text-[#A99B8C] mt-2 text-sm">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#252525] text-sm font-medium">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A99B8C]" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 bg-white border-[#E8DFD3] focus:border-[#A99B8C] focus:ring-[#A99B8C] rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#252525] text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A99B8C]" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10 bg-white border-[#E8DFD3] focus:border-[#A99B8C] focus:ring-[#A99B8C] rounded-lg"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#252525] hover:bg-[#3a3a3a] text-white rounded-lg h-11 transition-all duration-150"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#A99B8C]">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-[#252525] font-medium hover:underline underline-offset-2 transition-all duration-150"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
