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
  User,
  Phone,
  Users,
  UserPlus,
  Loader2,
  Info,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Full name must be at most 80 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens and apostrophes'),
  email: z.string().email('Please enter a valid email address'),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(64, 'Password must be at most 64 characters'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Reusable field wrapper
// ---------------------------------------------------------------------------
interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, htmlFor, error, children }: FieldWrapperProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RegisterPage
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      mobile: '',
      password: '',
      gender: undefined,
    },
  });

  const inputClass = (hasError: boolean) =>
    `w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      hasError
        ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
        : 'border-gray-300 bg-white hover:border-gray-400'
    }`;

  const selectClass = (hasError: boolean) =>
    `w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white ${
      hasError
        ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
        : 'border-gray-300 hover:border-gray-400'
    }`;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setFormError(null);
      await authRegister({
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        password: data.password,
        gender: data.gender,
      });
      navigate('/');
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Registration failed. Please try again later.';
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
            Create an account
          </h2>

          {/* ── Form error banner ──────────────────────────────────────── */}
          {formError && (
            <div className="mb-5 flex items-start gap-2.5 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* ── Full Name ────────────────────────────────────────────── */}
            <FieldWrapper label="Full Name" htmlFor="fullName" error={errors.fullName?.message}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Aarav Sharma"
                  {...register('fullName')}
                  className={inputClass(!!errors.fullName)}
                />
              </div>
            </FieldWrapper>

            {/* ── Email ────────────────────────────────────────────────── */}
            <FieldWrapper label="Email address" htmlFor="email" error={errors.email?.message}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={inputClass(!!errors.email)}
                />
              </div>
            </FieldWrapper>

            {/* ── Mobile ───────────────────────────────────────────────── */}
            <FieldWrapper label="Mobile Number" htmlFor="mobile" error={errors.mobile?.message}>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="mobile"
                  type="tel"
                  autoComplete="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  {...register('mobile')}
                  className={inputClass(!!errors.mobile)}
                />
              </div>
            </FieldWrapper>

            {/* ── Password ─────────────────────────────────────────────── */}
            <FieldWrapper label="Password" htmlFor="password" error={errors.password?.message}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
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
            </FieldWrapper>

            {/* ── Gender ───────────────────────────────────────────────── */}
            <FieldWrapper label="Gender" htmlFor="gender" error={errors.gender?.message}>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  id="gender"
                  {...register('gender')}
                  className={selectClass(!!errors.gender)}
                >
                  <option value="">Select gender…</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </FieldWrapper>

            {/* ── Submit ───────────────────────────────────────────────── */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed mt-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* ── Login link ────────────────────────────────────────────── */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* ── Footer note ──────────────────────────────────────────────── */}
        <p className="mt-5 text-center text-xs text-gray-400">
          By creating an account you agree to our{' '}
          <span className="text-blue-500 cursor-pointer hover:underline">Terms of Service</span>
          {' '}and{' '}
          <span className="text-blue-500 cursor-pointer hover:underline">Privacy Policy</span>.
        </p>

      </div>
    </div>
  );
}

export { RegisterPage };
