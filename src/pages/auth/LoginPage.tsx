import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Sparkles, ExternalLink } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { useAuthStore } from '../../store';
import { getPostLoginRoute } from '../../services/postLoginRoute';

const ATLAS_STUDIO_URL = 'https://atlas-studio.org';

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
      const target = await getPostLoginRoute();
      navigate(target);
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-[#C8A961]/10 to-transparent rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      <div className="fixed top-1/4 right-0 w-96 h-96 bg-[#C8A961]/5 rounded-full blur-3xl translate-x-1/3" />

      <div className="relative w-full max-w-md">
        {/* Retour */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl mb-6 transition-all duration-300"
        >
          <ArrowLeft size={20} />
          <span>{t('common.back')}</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="font-decorative text-3xl text-[#C8A961]">Advist</h1>
          </div>
          <p className="text-white/40">{t('landing.hero.subtitle', 'Gestion Documentaire')}</p>
        </div>

        <Card padding="lg" className="!bg-[#1A1A1D] !border !border-white/5">
          <h2 className="text-xl font-light text-white mb-6">{t('auth.login')}</h2>

          {/* SSO Atlas Studio — primary CTA */}
          <a
            href={`${ATLAS_STUDIO_URL}/portal/login?next=${encodeURIComponent(`${window.location.origin}/user`)}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 mb-4 bg-[#C8A961] text-[#0A0A0B] rounded-xl font-semibold hover:bg-[#C8A961]/90 transition-all"
          >
            <Sparkles size={16} />
            Se connecter avec Atlas Studio
            <ExternalLink size={12} className="opacity-70" />
          </a>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] uppercase tracking-wider text-white/40">
              ou avec votre email
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-advist-red/10 border border-advist-red/30 rounded-xl text-advist-red text-sm">
              {error}
              <button
                onClick={clearError}
                className="float-right text-advist-red hover:text-advist-red/80"
              >
                &times;
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="votre@email.com"
              leftIcon={<Mail size={18} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder', 'Votre mot de passe')}
              leftIcon={<Lock size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#C8A961] focus:ring-[#C8A961]"
                />
                <span className="text-sm text-white/80">{t('auth.rememberMe')}</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-[#C8A961] hover:text-[#C8A961]/80"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {t('auth.login')}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <span className="text-white/40">{t('auth.noAccount', 'Pas encore de compte ?')}</span>{' '}
            <Link
              to="/signup"
              className="text-[#C8A961] font-medium hover:text-[#C8A961]/80 transition-colors"
            >
              {t('auth.register', "S'inscrire")}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
