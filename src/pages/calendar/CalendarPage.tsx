import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { SmartCalendar } from '../../components/calendar';

export const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-advist-surface-dark rounded-xl transition-colors"
        >
          <ArrowLeft size={20} className="text-advist-gray900" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">{t('calendar.title')}</h1>
          <p className="text-advist-blue-light mt-1">
            {t('calendar.subtitle')}
          </p>
        </div>
      </div>

      <SmartCalendar />
    </div>
  );
};

export default CalendarPage;
