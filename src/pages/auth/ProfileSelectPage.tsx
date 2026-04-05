import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Shield, ChevronRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store';

interface ProfileCardProps {
  type: 'user' | 'admin';
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  bgColor: string;
  accentColor: string;
  onClick: () => void;
  accessLabel?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  title,
  description,
  features,
  icon,
  bgColor,
  accentColor,
  onClick,
  accessLabel = 'Accéder',
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative group w-full max-w-md p-8 rounded-3xl text-left
        bg-[#1A1A1D] border border-white/5
        hover:border-[#C8A961] hover:shadow-2xl hover:shadow-[#C8A961]/20
        shadow-xl shadow-black/20
        transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]
        overflow-hidden
      `}
    >
      {/* Background gradient on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accentColor} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
      />

      {/* Icon */}
      <div
        className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${bgColor} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="relative text-2xl font-light text-white mb-2">{title}</h3>

      {/* Description */}
      <p className="relative text-white/40 mb-6">{description}</p>

      {/* Features */}
      <ul className="relative space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-white/80">
            <div className="w-5 h-5 rounded-full bg-advist-gold/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-advist-gold" />
            </div>
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="relative flex items-center gap-2 text-white font-medium group-hover:text-[#C8A961] group-hover:gap-4 transition-all duration-300">
        {accessLabel}
        <ChevronRight className="w-5 h-5" />
      </div>

      {/* Hover accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-advist-gold to-advist-gold-dark rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

export const ProfileSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();

  const handleUserAccess = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/user');
  };

  const handleAdminAccess = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Only allow admin access if user has admin role
    if (user?.role === 'admin' || user?.is_org_admin) {
      navigate('/admin');
    } else {
      navigate('/user');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-advist-navy to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-advist-dark/20 group-hover:shadow-advist-dark/40 transition-all">
                <Sparkles className="w-5 h-5 text-advist-gold" />
              </div>
              <span className="font-decorative text-2xl text-[#C8A961]">Advist</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 font-medium"
            >
              {t('auth.profileSelect.backToHome')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
              {t('auth.profileSelect.chooseProfile')}
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              {t('auth.profileSelect.selectAccessType')}
            </p>
          </div>

          {/* Profile Cards */}
          <div className="grid md:grid-cols-2 gap-8 justify-center">
            {/* User Profile */}
            <ProfileCard
              type="user"
              title={t('auth.profileSelect.user')}
              description={t('auth.profileSelect.userDescription')}
              features={[
                t('auth.profileSelect.userFeature1'),
                t('auth.profileSelect.userFeature2'),
                t('auth.profileSelect.userFeature3'),
                t('auth.profileSelect.userFeature4'),
              ]}
              icon={<Users className="w-8 h-8 text-white" />}
              bgColor="from-advist-gold to-primary-500"
              accentColor="from-advist-gold to-primary-500"
              onClick={handleUserAccess}
              accessLabel={t('auth.profileSelect.access')}
            />

            {/* Admin Profile */}
            <ProfileCard
              type="admin"
              title={t('auth.profileSelect.admin')}
              description={t('auth.profileSelect.adminDescription')}
              features={[
                t('auth.profileSelect.adminFeature1'),
                t('auth.profileSelect.adminFeature2'),
                t('auth.profileSelect.adminFeature3'),
                t('auth.profileSelect.adminFeature4'),
              ]}
              icon={<Shield className="w-8 h-8 text-white" />}
              bgColor="from-advist-navy to-primary-700"
              accentColor="from-advist-navy to-primary-600"
              onClick={handleAdminAccess}
              accessLabel={t('auth.profileSelect.access')}
            />
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <p className="text-sm text-white/40">
              {t('auth.profileSelect.noAccount')}{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-[#C8A961] font-medium hover:text-[#C8A961]/80 transition-colors"
              >
                {t('auth.profileSelect.createAccount')}
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Decorative Elements */}
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-[#C8A961]/10 to-transparent rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      <div className="fixed top-1/4 right-0 w-96 h-96 bg-[#C8A961]/5 rounded-full blur-3xl translate-x-1/3" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#C8A961]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};
