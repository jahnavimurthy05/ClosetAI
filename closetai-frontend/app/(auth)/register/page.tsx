'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
      setLoading(false);
      return;
    }

    toast.success('Account created! Let\'s set up your style profile.');
    router.push('/onboarding');
    router.refresh();
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-3xl font-light text-[#252525]">Create account</h2>
        <p className="text-[#A99B8C] mt-2 text-sm">
          Start your personal styling journey today
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[#252525] text-sm font-medium">
            Full name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A99B8C]" />
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="pl-10 bg-white border-[#E8DFD3] focus:border-[#A99B8C] rounded-lg"
            />
          </div>
        </div>

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
              className="pl-10 bg-white border-[#E8DFD3] focus:border-[#A99B8C] rounded-lg"
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
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10 bg-white border-[#E8DFD3] focus:border-[#A99B8C] rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-[#252525] text-sm font-medium">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A99B8C]" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="pl-10 bg-white border-[#E8DFD3] focus:border-[#A99B8C] rounded-lg"
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
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#A99B8C]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[#252525] font-medium hover:underline underline-offset-2 transition-all duration-150"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
