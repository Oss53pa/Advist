import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store';

type LoginForm = {
  email: string;
  password: string;
};

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();

  const loginSchema = z.object({
    email: z.string().email(t('validation.emailInvalid', 'Email invalide')),
    password: z.string().min(1, t('validation.passwordRequired', 'Mot de passe requis')),
  });
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      navigate('/user');
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-[#131C2E] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#B9975B]/8 to-transparent rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3" />
      <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-[#B9975B]/4 rounded-full blur-[100px] translate-x-1/4 -translate-y-1/4" />

      <div className="relative w-full max-w-[420px]">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3 py-2 text-white/30 hover:text-white/70 hover:bg-white/[0.04] rounded-xl mb-8 transition-all text-sm"
        >
          <ArrowLeft size={16} />
          <span>{t('common.back')}</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-decorative text-4xl text-[#B9975B] mb-2">Advist</h1>
          <p className="text-[13px] text-white/25 font-medium uppercase tracking-[0.15em]">
            {t('landing.hero.subtitle', 'Gestion Documentaire')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1B2740]/80 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
          <h2 className="text-lg font-semibold text-white mb-6">{t('auth.login')}</h2>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="text-red-400/60 hover:text-red-400 ml-2 text-lg leading-none"
              >
                &times;
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-white/40 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20"
                />
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#B9975B]/40 focus:ring-1 focus:ring-[#B9975B]/20 transition-all"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-white/40 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder', 'Votre mot de passe')}
                  className="w-full pl-10 pr-12 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#B9975B]/40 focus:ring-1 focus:ring-[#B9975B]/20 transition-all"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/10 bg-white/[0.04] text-[#B9975B] focus:ring-[#B9975B]/30 focus:ring-offset-0"
                />
                <span className="text-[13px] text-white/50">{t('auth.rememberMe')}</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[13px] text-[#B9975B] hover:text-[#D4B87E] transition-colors"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#B9975B] text-[#131C2E] text-sm font-bold rounded-xl hover:bg-[#D4B87E] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#B9975B]/15 hover:shadow-[#B9975B]/25"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-4 w-4 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <span className="text-[13px] text-white/30">{t('auth.noAccount')}</span>{' '}
            <Link
              to="/register"
              className="text-[13px] text-[#B9975B] font-semibold hover:text-[#D4B87E] transition-colors"
            >
              {t('auth.register')}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-[11px] text-white/15">
          &copy; {new Date().getFullYear()} Advist &middot; Atlas Studio
        </p>
      </div>
    </div>
  );
};
