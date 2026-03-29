import { format, formatDistance, formatRelative, isToday, isYesterday, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const locales = { fr, en: enUS };
type LocaleKey = keyof typeof locales;

/**
 * Format a date string to a localized date format
 */
export function formatDate(
  dateString: string,
  formatStr: string = 'dd MMM yyyy',
  locale: LocaleKey = 'fr'
): string {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr, { locale: locales[locale] });
  } catch {
    return dateString;
  }
}

/**
 * Format a date string to a localized datetime format
 */
export function formatDateTime(
  dateString: string,
  locale: LocaleKey = 'fr'
): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd MMM yyyy HH:mm', { locale: locales[locale] });
  } catch {
    return dateString;
  }
}

/**
 * Format a date string as relative time (e.g., "il y a 2 heures")
 */
export function formatRelativeTime(
  dateString: string,
  locale: LocaleKey = 'fr'
): string {
  try {
    const date = parseISO(dateString);
    return formatDistance(date, new Date(), {
      addSuffix: true,
      locale: locales[locale],
    });
  } catch {
    return dateString;
  }
}

/**
 * Format a date string with smart relative formatting
 */
export function formatSmartDate(
  dateString: string,
  locale: LocaleKey = 'fr'
): string {
  try {
    const date = parseISO(dateString);

    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: locales[locale] });
    }

    if (isYesterday(date)) {
      return locale === 'fr' ? 'Hier' : 'Yesterday';
    }

    return formatRelative(date, new Date(), { locale: locales[locale] });
  } catch {
    return dateString;
  }
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(
  num: number,
  locale: LocaleKey = 'fr'
): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(num);
}

/**
 * Format a user's full name
 */
export function formatFullName(
  firstName: string | undefined,
  lastName: string | undefined
): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(' ') || '-';
}

/**
 * Get user initials from name
 */
export function getInitials(
  firstName: string | undefined,
  lastName: string | undefined
): string {
  const first = firstName?.charAt(0).toUpperCase() || '';
  const last = lastName?.charAt(0).toUpperCase() || '';
  return first + last || '?';
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('33')) {
    const national = cleaned.substring(2);
    return `+33 ${national.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`;
  }

  if (cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

  return phone;
}

/**
 * Format document status for display
 */
export function formatDocumentStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    pending_review: 'En revision',
    in_workflow: 'En workflow',
    approved: 'Approuve',
    rejected: 'Rejete',
    signed: 'Signe',
    archived: 'Archive',
  };

  return statusLabels[status] || status;
}

/**
 * Format workflow status for display
 */
export function formatWorkflowStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Termine',
    rejected: 'Rejete',
    cancelled: 'Annule',
  };

  return statusLabels[status] || status;
}

/**
 * Format task type for display
 */
export function formatTaskType(type: string): string {
  const typeLabels: Record<string, string> = {
    approval: 'Approbation',
    signature: 'Signature',
    review: 'Revision',
    information: 'Information',
  };

  return typeLabels[type] || type;
}
