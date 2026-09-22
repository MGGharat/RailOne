import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Train,
  Mail,
  Lock,
  LogIn,
  Loader2,
  Info,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Demo credential pill component
// ---------------------------------------------------------------------------
interface DemoCredentialProps {
  role: string;
  email: string;
  password: string;
  onUse: (email: string, password: string) => void;
}

function DemoCredential({ role, email, password, onUse }: DemoCredentialProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-blue-100 text-xs">
      <div className="space-y-0.5">
        <p className="font-semibold text-blue-700">{role}</p>
        <p className="text-gray-500 font-mono">{email}</p>
        <p className="text-gray-500 font-mono">{password}</p>
      </div>
      <button
        type="button"
        onClick={() => onUse(email, password)}
        className="ml-3 shrink-0 px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
      >
        Use
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const fillDemo = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setFormError(null);
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setFormError(null);
      await login(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Login failed. Please check your credentials and try again.';
      setFormError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Brand header ─────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Train className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Rail<span className="text-blue-600">One</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            India's trusted railway booking platform
          </p>
        </div>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Sign in to your account
          </h2>

          {/* ── Form error banner ──────────────────────────────────────── */}
          {formError && (
            <div className="mb-5 flex items-start gap-2.5 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* ── Email ────────────────────────────────────────────────── */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email
                      ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* ── Password ─────────────────────────────────────────────── */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-11 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password
                      ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* ── Submit ───────────────────────────────────────────────── */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed mt-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* ── Register link ─────────────────────────────────────────── */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* ── Demo credentials ─────────────────────────────────────────── */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Demo Credentials
            </p>
          </div>
          <div className="space-y-2">
            <DemoCredential
              role="User Account"
              email="user@railone.demo"
              password="User@12345"
              onUse={fillDemo}
            />
            <DemoCredential
              role="Admin Account"
              email="admin@railone.demo"
              password="Admin@12345"
              onUse={fillDemo}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export { LoginPage };
