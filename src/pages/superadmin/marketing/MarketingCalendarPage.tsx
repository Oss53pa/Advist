/**
 * Marketing Calendar Page - Editorial calendar view
 */
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { publicationsApi } from '../../../services/marketing';
import type { Publication, SocialPlatform } from '../../../types';

const platformColors: Record<string, string> = {
  facebook: 'bg-primary-900',
  linkedin: 'bg-primary-800',
  twitter: 'bg-black',
  instagram: 'bg-primary-500',
  whatsapp: 'bg-green-500',
};

const platformIcons: Record<string, string> = {
  facebook: 'https://cdn.simpleicons.org/facebook',
  linkedin: 'https://cdn.simpleicons.org/linkedin',
  twitter: 'https://cdn.simpleicons.org/x',
  instagram: 'https://cdn.simpleicons.org/instagram',
  whatsapp: 'https://cdn.simpleicons.org/whatsapp',
};

const statusColors: Record<string, string> = {
  scheduled: 'border-l-primary-900',
  published: 'border-l-green-500',
  failed: 'border-l-red-500',
};

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];

export default function MarketingCalendarPage() {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Adjust for Monday start
    const daysInMonth = lastDay.getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Next month days to fill the grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        setLoading(true);
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
        const data = await publicationsApi.calendar({ start: startDate, end: endDate });
        setPublications(data);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublications();
  }, [year, month]);

  const getPublicationsForDate = (date: Date): Publication[] => {
    const dateStr = date.toISOString().split('T')[0];
    return publications.filter((pub) => {
      const pubDate = pub.scheduled_at || pub.published_at;
      if (!pubDate) return false;
      return pubDate.split('T')[0] === dateStr;
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/superadmin/marketing" className="text-primary-500 hover:text-primary-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary-900" />
              {t('superadmin.marketing.calendarPage.title')}
            </h1>
            <p className="text-primary-500">{t('superadmin.marketing.calendarPage.subtitle')}</p>
          </div>
        </div>
        <Link
          to="/superadmin/marketing/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t('superadmin.marketing.newPublication')}
        </Link>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between p-4 border-b border-primary-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-primary-900">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
          >
            {t('superadmin.marketing.calendarPage.today')}
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
            </div>
          ) : (
            <>
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-px mb-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-primary-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-px bg-primary-200 rounded-lg overflow-hidden">
                {calendarDays.map((day, index) => {
                  const dayPublications = getPublicationsForDate(day.date);
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] bg-white p-2 ${
                        !day.isCurrentMonth ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          !day.isCurrentMonth
                            ? 'text-primary-400'
                            : isToday(day.date)
                            ? 'text-white bg-primary-900 w-7 h-7 rounded-full flex items-center justify-center'
                            : 'text-primary-900'
                        }`}
                      >
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayPublications.slice(0, 3).map((pub) => (
                          <button
                            key={pub.id}
                            onClick={() => setSelectedPublication(pub)}
                            className={`w-full text-left p-1 rounded text-xs border-l-2 ${
                              statusColors[pub.status] || 'border-l-primary-300'
                            } bg-primary-50 hover:bg-primary-100 truncate`}
                          >
                            <div className="flex items-center gap-1">
                              {pub.platforms.slice(0, 2).map((platform) => (
                                <div
                                  key={platform}
                                  className={`w-3 h-3 rounded-full flex items-center justify-center ${platformColors[platform]}`}
                                >
                                  <img
                                    src={platformIcons[platform]}
                                    alt={platform}
                                    className="w-2 h-2 filter brightness-0 invert"
                                  />
                                </div>
                              ))}
                              {pub.platforms.length > 2 && (
                                <span className="text-primary-400">+{pub.platforms.length - 2}</span>
                              )}
                            </div>
                            <span className="truncate block">{pub.title}</span>
                          </button>
                        ))}
                        {dayPublications.length > 3 && (
                          <span className="text-xs text-primary-500">
                            +{dayPublications.length - 3} {t('superadmin.marketing.calendarPage.others')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-primary-700 mb-3">{t('superadmin.marketing.calendarPage.legend')}</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-2 border-primary-900 bg-primary-100 rounded"></div>
            <span className="text-sm text-primary-600">{t('superadmin.marketing.status.scheduled')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-2 border-green-500 bg-primary-100 rounded"></div>
            <span className="text-sm text-primary-600">{t('superadmin.marketing.status.published')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-2 border-red-500 bg-primary-100 rounded"></div>
            <span className="text-sm text-primary-600">{t('superadmin.marketing.status.failed')}</span>
          </div>
          <div className="border-l border-primary-300 h-6"></div>
          {Object.entries(platformColors).map(([platform, color]) => (
            <div key={platform} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${color}`}></div>
              <span className="text-sm text-primary-600 capitalize">{platform}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Publication Detail Modal */}
      {selectedPublication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-900">{selectedPublication.title}</h3>
                <button
                  onClick={() => setSelectedPublication(null)}
                  className="text-primary-400 hover:text-primary-600"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm text-primary-500">{t('superadmin.marketing.calendarPage.status')}:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    selectedPublication.status === 'scheduled'
                      ? 'bg-primary-100 text-primary-800'
                      : selectedPublication.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-primary-100 text-primary-700'
                  }`}>
                    {selectedPublication.status_display}
                  </span>
                </div>

                <div>
                  <span className="text-sm text-primary-500">{t('superadmin.marketing.calendarPage.date')}:</span>
                  <span className="ml-2 text-primary-900">
                    {new Date(selectedPublication.scheduled_at || selectedPublication.published_at || selectedPublication.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>

                <div>
                  <span className="text-sm text-primary-500">{t('superadmin.marketing.calendarPage.platforms')}:</span>
                  <div className="flex gap-2 mt-1">
                    {selectedPublication.platforms.map((platform) => (
                      <div
                        key={platform}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${platformColors[platform]}`}
                      >
                        <img
                          src={platformIcons[platform]}
                          alt={platform}
                          className="w-4 h-4 filter brightness-0 invert"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-sm text-primary-500">{t('superadmin.marketing.calendarPage.content')}:</span>
                  <p className="mt-1 text-primary-900 whitespace-pre-wrap">
                    {selectedPublication.content}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedPublication(null)}
                  className="px-4 py-2 text-primary-700 hover:bg-primary-100 rounded-lg"
                >
                  {t('common.close')}
                </button>
                <Link
                  to={`/superadmin/marketing/posts`}
                  className="px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800"
                >
                  {t('superadmin.marketing.calendarPage.viewDetails')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
