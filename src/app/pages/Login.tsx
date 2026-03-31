import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { isSupabaseConfigured, missingSupabaseEnvMessage } from '../lib/supabase';
import { normalizeApiError } from '../services/socialApi';

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const authDisabled = !isSupabaseConfigured;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (submitError) {
      setError(normalizeApiError(submitError, 'Unable to sign in.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#f5f3ff_45%,#eef2ff_100%)] p-4">
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-violet-300/25 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <BrandLogo size="lg" showTagline centered />
          <p className="mt-4 text-sm text-neutral-600">Connect with friends and the world</p>
        </div>

        {/* Login Card */}
        <div className="rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Welcome back</h2>
          {authDisabled && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {missingSupabaseEnvMessage}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10 rounded-lg border-neutral-300 focus:border-blue-500"
                  disabled={authDisabled}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 rounded-lg border-neutral-300 focus:border-blue-500"
                  disabled={authDisabled}
                  required
                />
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={authDisabled || isSubmitting}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 h-11 text-base font-medium"
            >
              {authDisabled ? 'Setup required' : isSubmitting ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="ml-2" size={18} />
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-neutral-300 hover:bg-neutral-50"
              disabled={authDisabled}
              onClick={() => navigate('/')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-neutral-300 hover:bg-neutral-50"
              disabled={authDisabled}
              onClick={() => navigate('/')}
            >
              <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
