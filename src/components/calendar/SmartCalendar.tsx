import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  PenTool,
  RefreshCw,
  CreditCard,
  Eye,
  Plus,
  Bell,
  Loader2,
  Search,
  Timer,
  X,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  deadlinesService,
  Deadline,
  PRIORITY_COLORS,
  calculateDaysRemaining,
  getPriorityLabel,
  getTypeLabel,
} from '../../services/deadlines';

interface SmartCalendarProps {
  onDeadlineClick?: (deadline: Deadline) => void;
  onCreateDeadline?: () => void;
  documentId?: number;
  compact?: boolean;
}

type ViewMode = 'month' | 'week';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const TYPE_ICONS: Record<Deadline['type'], React.ReactNode> = {
  expiration: <Timer size={12} />,
  renewal: <RefreshCw size={12} />,
  payment: <CreditCard size={12} />,
  review: <Eye size={12} />,
  signature: <PenTool size={12} />,
  custom: <CalendarIcon size={12} />,
};

// Couleurs pastel pour les types (en accord avec la charte ADVIST)
const TYPE_STYLES: Record<Deadline['type'], { bg: string; text: string; dot: string }> = {
  expiration: { bg: 'bg-advist-red/10', text: 'text-advist-red', dot: 'bg-advist-red' },
  renewal: { bg: 'bg-advist-gold-light/20', text: 'text-advist-gray900', dot: 'bg-advist-gold-light' },
  payment: { bg: 'bg-green-50', text: 'text-advist-success', dot: 'bg-advist-success' },
  review: { bg: 'bg-advist-surface-dark', text: 'text-advist-gray900', dot: 'bg-advist-dark' },
  signature: { bg: 'bg-advist-gold-light', text: 'text-advist-gold-dark', dot: 'bg-advist-gold' },
  custom: { bg: 'bg-advist-surface-dark', text: 'text-advist-gray900', dot: 'bg-advist-dark' },
};

export const SmartCalendar: React.FC<SmartCalendarProps> = ({
  onDeadlineClick,
  onCreateDeadline,
  documentId,
  compact = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Calculate date range for current view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    if (viewMode === 'week') {
      const dayOfWeek = currentDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setDate(currentDate.getDate() + mondayOffset);
      end.setDate(start.getDate() + 6);
    }

    return { start, end };
  }, [currentDate, viewMode]);

  // Fetch deadlines
  useEffect(() => {
    fetchDeadlines();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.start.toISOString(), dateRange.end.toISOString(), documentId]);

  const fetchDeadlines = async () => {
    setIsLoading(true);
    try {
      const data = await deadlinesService.list({
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0],
        documentId,
      });
      setDeadlines(data ?? []);
    } catch (err) {
      console.error('Failed to fetch deadlines:', err);
      setDeadlines([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  // Get deadlines for a specific date
  const getDeadlinesForDate = (date: Date): Deadline[] => {
    const dateStr = date.toISOString().split('T')[0];
    return deadlines.filter(d => {
      const matches = d.date.split('T')[0] === dateStr;
      if (searchQuery) {
        return matches && (
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.documentName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return matches;
    });
  };

  // Generate calendar days (starting from Monday)
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(dateRange.start);

    if (viewMode === 'month') {
      start.setDate(1);
      const dayOfWeek = start.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setDate(start.getDate() + mondayOffset);
    }

    const numDays = viewMode === 'week' ? 7 : 42;

    for (let i = 0; i < numDays; i++) {
      days.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }

    return days;
  }, [dateRange, viewMode]);

  // Handle deadline click
  const handleDeadlineClick = (deadline: Deadline, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onDeadlineClick) {
      onDeadlineClick(deadline);
    } else {
      setSelectedDeadline(deadline);
      setShowDetailModal(true);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const overdue = deadlines.filter(d => calculateDaysRemaining(d.date) < 0).length;
    const thisWeek = deadlines.filter(d => {
      const days = calculateDaysRemaining(d.date);
      return days >= 0 && days <= 7;
    }).length;
    const completed = deadlines.filter(d => d.status === 'completed').length;
    const total = deadlines.length;

    // Calcul des pourcentages
    const activityRate = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, overdue, thisWeek, completed, activityRate, completionRate };
  }, [deadlines]);

  // Format date range for header
  const formatDateRange = () => {
    const startMonth = MONTHS_FR[dateRange.start.getMonth()];
    const endMonth = MONTHS_FR[dateRange.end.getMonth()];
    const year = dateRange.start.getFullYear();

    if (viewMode === 'week') {
      return `${dateRange.start.getDate()} ${startMonth} - ${dateRange.end.getDate()} ${endMonth}, ${year}`;
    }
    return `${startMonth} ${year}`;
  };

  // Compact view for dashboard
  if (compact) {
    const upcomingDeadlines = [...deadlines]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);

    return (
      <div className="space-y-5">
        {/* Mini Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-advist-red/5 rounded-2xl p-4 border border-advist-red/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-advist-gray900/60">En retard</span>
              <AlertTriangle size={14} className="text-advist-red" />
            </div>
            <p className="text-2xl font-bold text-advist-gray900">{stats.overdue}</p>
          </div>

          <div className="bg-advist-gold-light rounded-2xl p-4 border border-advist-gold">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-advist-gray900/60">Cette semaine</span>
              <Clock size={14} className="text-advist-gold-dark" />
            </div>
            <p className="text-2xl font-bold text-advist-gray900">{stats.thisWeek}</p>
          </div>

          <div className="bg-green-50 rounded-2xl p-4 border border-advist-success">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-advist-gray900/60">Complétées</span>
              <CheckCircle2 size={14} className="text-advist-success" />
            </div>
            <p className="text-2xl font-bold text-advist-gray900">{stats.completed}</p>
          </div>
        </div>

        {/* Upcoming List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-advist-blue-light" />
            </div>
          ) : upcomingDeadlines.length === 0 ? (
            <div className="text-center py-8 bg-advist-surface-dark/30 rounded-2xl">
              <CalendarIcon size={32} className="mx-auto mb-2 text-advist-blue-light/50" />
              <p className="text-sm text-advist-blue-light">Aucune échéance à venir</p>
            </div>
          ) : (
            upcomingDeadlines.map((deadline) => {
              const daysRemaining = calculateDaysRemaining(deadline.date);
              const isOverdue = daysRemaining < 0;
              const style = TYPE_STYLES[deadline.type];

              return (
                <div
                  key={deadline.id}
                  onClick={() => handleDeadlineClick(deadline)}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-advist-border hover:border-advist-blue-light/50 hover:shadow-card cursor-pointer transition-all duration-240"
                >
                  {/* Type dot */}
                  <div className={`w-2 h-2 rounded-full ${style.dot}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-advist-gray900 text-sm truncate">
                      {deadline.title}
                    </p>
                    <p className="text-xs text-advist-blue-light truncate">
                      {deadline.documentName}
                    </p>
                  </div>

                  {/* Date */}
                  <div className={`
                    text-xs font-medium px-2 py-1 rounded-lg
                    ${isOverdue
                      ? 'bg-advist-red/10 text-advist-red'
                      : daysRemaining <= 3
                        ? 'bg-advist-gold-light text-advist-gold-dark'
                        : 'bg-advist-surface-dark text-advist-gray900'
                    }
                  `}>
                    {isOverdue
                      ? `${Math.abs(daysRemaining)}j retard`
                      : daysRemaining === 0
                        ? "Aujourd'hui"
                        : `${daysRemaining}j`
                    }
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Full Calendar View
  return (
    <div className="bg-white rounded-2xl shadow-card border border-advist-border overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-advist-border">
        {/* Title & Search Row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-advist-gray900">Calendrier des échéances</h2>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-blue-light" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-advist-surface-dark/50 border-0 rounded-xl text-sm text-advist-gray900 placeholder:text-advist-blue-light/60 focus:ring-2 focus:ring-advist-blue-light/30 focus:bg-white transition-all w-48"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Activity Rate */}
          <div className="bg-advist-surface-dark/30 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-advist-gray-cold"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeDasharray={`${stats.activityRate * 1.76} 176`}
                    className="text-advist-blue-light"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-advist-gray900">
                  {stats.activityRate}%
                </span>
              </div>
              <div>
                <p className="text-xs text-advist-blue-light">Taux d'activité</p>
                <p className="text-sm font-medium text-advist-gray900">Échéances à jour</p>
              </div>
            </div>
          </div>

          {/* Tasks Count */}
          <div className="bg-advist-gold-light/10 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-xl shadow-sm">
                <span className="text-2xl font-bold text-advist-gray900">{stats.total}</span>
                <TrendingUp size={14} className="text-advist-blue-light" />
              </div>
              <div>
                <p className="text-xs text-advist-blue-light">Nombre total</p>
                <p className="text-sm font-medium text-advist-gray900">Échéances ce mois</p>
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-green-50 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-green-100"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeDasharray={`${stats.completionRate * 1.76} 176`}
                    className="text-advist-success"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-advist-gray900">
                  {stats.completionRate}%
                </span>
              </div>
              <div>
                <p className="text-xs text-advist-blue-light">Taux de complétion</p>
                <p className="text-sm font-medium text-advist-gray900">Tâches terminées</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Row */}
        <div className="flex items-center justify-between">
          {/* Month/Year with Navigation */}
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-advist-gray900 min-w-[200px]">
              {formatDateRange()}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={navigatePrev}
                className="p-2 hover:bg-advist-surface-dark rounded-lg transition-colors"
              >
                <ChevronLeft size={18} className="text-advist-gray900" />
              </button>
              <button
                onClick={navigateNext}
                className="p-2 hover:bg-advist-surface-dark rounded-lg transition-colors"
              >
                <ChevronRight size={18} className="text-advist-gray900" />
              </button>
            </div>
          </div>

          {/* View Mode & Actions */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-advist-surface-dark/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-advist-gray900 shadow-sm'
                    : 'text-advist-blue-light hover:text-advist-gray900'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  viewMode === 'month'
                    ? 'bg-white text-advist-gray900 shadow-sm'
                    : 'text-advist-blue-light hover:text-advist-gray900'
                }`}
              >
                Mois
              </button>
            </div>

            {/* Date Range Display */}
            <div className="flex items-center gap-2 px-3 py-2 bg-advist-red/10 rounded-xl">
              <CalendarIcon size={14} className="text-advist-red" />
              <span className="text-sm font-medium text-advist-gray900">
                {dateRange.start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {dateRange.end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {onCreateDeadline && (
              <Button onClick={onCreateDeadline} size="sm">
                <Plus size={16} className="mr-1" />
                Ajouter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-advist-blue-light" />
        </div>
      ) : (
        <div className="p-4">
          {/* Days Header */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_FR.map((day, idx) => (
              <div
                key={day}
                className={`
                  py-3 text-center text-xs font-semibold uppercase tracking-wider
                  ${idx >= 5 ? 'text-advist-blue-light/60' : 'text-advist-gray900/60'}
                `}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const dayDeadlines = getDeadlinesForDate(day);
              const dateKey = day.toISOString().split('T')[0];
              const isHovered = hoveredDate === dateKey;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div
                  key={day.toISOString()}
                  onMouseEnter={() => setHoveredDate(dateKey)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={`
                    relative min-h-[100px] p-2 rounded-xl transition-all duration-200
                    ${isCurrentMonth ? 'bg-white' : 'bg-advist-surface-dark/20'}
                    ${isHovered ? 'bg-advist-gold-light/5 ring-1 ring-advist-blue-light/20' : ''}
                    ${isWeekend && isCurrentMonth ? 'bg-advist-surface-dark/30' : ''}
                  `}
                >
                  {/* Date Number */}
                  <div className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1
                    ${isToday
                      ? 'bg-advist-dark text-white'
                      : !isCurrentMonth
                        ? 'text-advist-blue-light/40'
                        : 'text-advist-gray900'
                    }
                  `}>
                    {day.getDate()}
                  </div>

                  {/* Deadlines */}
                  <div className="space-y-1">
                    {dayDeadlines.slice(0, 3).map((deadline) => {
                      const isOverdue = calculateDaysRemaining(deadline.date) < 0;
                      const style = TYPE_STYLES[deadline.type];

                      return (
                        <button
                          key={deadline.id}
                          onClick={(e) => handleDeadlineClick(deadline, e)}
                          className={`
                            w-full text-left px-2 py-1 rounded-lg text-xs font-medium
                            flex items-center gap-1.5 truncate transition-all duration-200
                            ${isOverdue
                              ? 'bg-advist-red/10 text-advist-red hover:bg-advist-red/20'
                              : `${style.bg} ${style.text} hover:opacity-80`
                            }
                          `}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOverdue ? 'bg-advist-red' : style.dot}`} />
                          <span className="truncate">{deadline.title}</span>
                        </button>
                      );
                    })}
                    {dayDeadlines.length > 3 && (
                      <p className="text-xs text-center text-advist-blue-light font-medium py-0.5">
                        +{dayDeadlines.length - 3}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title=""
        size="md"
      >
        {selectedDeadline && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className={`
                p-3 rounded-xl ${TYPE_STYLES[selectedDeadline.type].bg}
              `}>
                {React.cloneElement(TYPE_ICONS[selectedDeadline.type] as React.ReactElement, {
                  size: 24,
                  className: TYPE_STYLES[selectedDeadline.type].text
                })}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-advist-gray900">{selectedDeadline.title}</h3>
                <p className="text-sm text-advist-blue-light">{selectedDeadline.documentName}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-advist-surface-dark rounded-lg transition-colors"
              >
                <X size={18} className="text-advist-gray900/60" />
              </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-advist-surface-dark/30 rounded-xl">
                <p className="text-xs text-advist-blue-light mb-1">Date d'échéance</p>
                <p className="font-semibold text-advist-gray900">
                  {new Date(selectedDeadline.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
              <div className={`p-4 rounded-xl ${
                calculateDaysRemaining(selectedDeadline.date) < 0
                  ? 'bg-advist-red/10'
                  : 'bg-green-50'
              }`}>
                <p className="text-xs text-advist-blue-light mb-1">Statut</p>
                <p className={`font-semibold ${
                  calculateDaysRemaining(selectedDeadline.date) < 0
                    ? 'text-advist-red'
                    : 'text-advist-success'
                }`}>
                  {calculateDaysRemaining(selectedDeadline.date) < 0
                    ? `${Math.abs(calculateDaysRemaining(selectedDeadline.date))} jours de retard`
                    : calculateDaysRemaining(selectedDeadline.date) === 0
                      ? "Aujourd'hui"
                      : `J-${calculateDaysRemaining(selectedDeadline.date)}`
                  }
                </p>
              </div>
            </div>

            {/* Type & Priority */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${TYPE_STYLES[selectedDeadline.type].bg} ${TYPE_STYLES[selectedDeadline.type].text}`}>
                {getTypeLabel(selectedDeadline.type)}
              </span>
              <span
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: `${PRIORITY_COLORS[selectedDeadline.priority]}15`,
                  color: PRIORITY_COLORS[selectedDeadline.priority],
                }}
              >
                {getPriorityLabel(selectedDeadline.priority)}
              </span>
            </div>

            {/* Reminders */}
            <div>
              <p className="text-sm font-medium text-advist-gray900 mb-3 flex items-center gap-2">
                <Bell size={14} />
                Rappels
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDeadline.reminders.map((reminder) => (
                  <span
                    key={reminder.id}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2
                      ${reminder.sent
                        ? 'bg-green-50 text-advist-success'
                        : 'bg-advist-surface-dark text-advist-gray900/70'
                      }
                    `}
                  >
                    J-{reminder.daysBefore}
                    {reminder.sent && <CheckCircle size={12} />}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-advist-border">
              <Button
                variant="outline"
                className="flex-1"
                disabled={isSendingReminder}
                onClick={async () => {
                  setIsSendingReminder(true);
                  try {
                    await deadlinesService.sendReminder(selectedDeadline.id);
                    // Show success feedback
                    alert('Rappel envoyé avec succès');
                  } catch (error) {
                    console.error('Failed to send reminder:', error);
                    alert('Erreur lors de l\'envoi du rappel');
                  } finally {
                    setIsSendingReminder(false);
                  }
                }}
              >
                <Bell size={16} className={`mr-2 ${isSendingReminder ? 'animate-pulse' : ''}`} />
                {isSendingReminder ? 'Envoi...' : 'Rappeler'}
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowDetailModal(false);
                  navigate(`/user/documents/${selectedDeadline.documentId}`);
                }}
              >
                <FileText size={16} className="mr-2" />
                Voir document
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SmartCalendar;
