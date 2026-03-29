/**
 * Calendar Mini Widget
 */
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';

interface CalendarWidgetProps {
  config: WidgetConfig;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ config }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock deadlines data
  const deadlines: Record<string, number> = {
    '2024-12-05': 2,
    '2024-12-10': 1,
    '2024-12-15': 3,
    '2024-12-20': 1,
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-advist-surface-dark rounded">
          <ChevronLeft size={16} className="text-advist-gray900" />
        </button>
        <span className="font-medium text-advist-gray900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button onClick={nextMonth} className="p-1 hover:bg-advist-surface-dark rounded">
          <ChevronRight size={16} className="text-advist-gray900" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs text-advist-gray900/50 font-medium">
            {day.charAt(0)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
          const hasDeadline = deadlines[dateKey];
          const isToday =
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();

          return (
            <button
              key={day}
              className={`
                aspect-square flex flex-col items-center justify-center rounded text-sm relative
                ${isToday ? 'bg-advist-dark text-white font-medium' : 'hover:bg-advist-surface-dark/50'}
                ${hasDeadline && !isToday ? 'font-medium text-advist-gray900' : 'text-advist-gray900/70'}
              `}
            >
              {day}
              {hasDeadline && (
                <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-advist-red'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarWidget;
