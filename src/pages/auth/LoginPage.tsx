import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-advist-gold/5 flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-advist-navy/10 to-transparent rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      <div className="fixed top-1/4 right-0 w-96 h-96 bg-advist-gold/10 rounded-full blur-3xl translate-x-1/3" />

      <div className="relative w-full max-w-md">
        {/* Retour */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-advist-text-secondary hover:text-advist-gray900 hover:bg-advist-dark/5 rounded-xl mb-6 transition-all duration-300"
        >
          <ArrowLeft size={20} />
          <span>{t('common.back')}</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="font-decorative text-3xl bg-gradient-to-r from-advist-navy to-primary-600 bg-clip-text text-transparent">
              Advist
            </h1>
          </div>
          <p className="text-advist-text-secondary">
            {t('landing.hero.subtitle', 'Gestion Documentaire')}
          </p>
        </div>

        <Card padding="lg">
          <h2 className="text-xl font-semibold text-advist-gray900 mb-6">{t('auth.login')}</h2>

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
                  className="w-4 h-4 rounded border-advist-blue-light text-advist-gray900 focus:ring-advist-gold"
                />
                <span className="text-sm text-advist-gray900">{t('auth.rememberMe')}</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-advist-gray900 hover:text-advist-gray900"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {t('auth.login')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-advist-text-secondary">{t('auth.noAccount')}</span>{' '}
            <Link
              to="/register"
              className="text-advist-gold font-semibold hover:text-advist-gold-dark transition-colors"
            >
              {t('auth.register')}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
