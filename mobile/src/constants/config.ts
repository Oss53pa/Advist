// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.advist.com',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'advist_access_token',
  REFRESH_TOKEN: 'advist_refresh_token',
  USER: 'advist_user',
  BIOMETRIC_ENABLED: 'advist_biometric_enabled',
  BIOMETRIC_EMAIL: 'advist_biometric_email',
  BIOMETRIC_TOKEN: 'advist_biometric_token',
  THEME: 'advist_theme',
  LANGUAGE: 'advist_language',
  OFFLINE_QUEUE: 'advist_offline_queue',
  CACHED_DOCUMENTS: 'advist_cached_documents',
  CACHED_TASKS: 'advist_cached_tasks',
  CACHED_WORKFLOWS: 'advist_cached_workflows',
  CACHED_NOTIFICATIONS: 'advist_cached_notifications',
  PUSH_TOKEN: 'advist_push_token',
  DEVICE_ID: 'advist_device_id',
  LAST_SYNC: 'advist_last_sync',
  NOTIFICATION_PREFERENCES: 'advist_notification_prefs',
  APP_LOCK_ENABLED: 'advist_app_lock_enabled',
  ONBOARDING_COMPLETED: 'advist_onboarding_completed',
  APP_SETTINGS: 'advist_app_settings',
  PENDING_ACTIONS: 'advist_pending_actions',
  SIGNATURE_PIN: 'advist_signature_pin',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 50,
  MAX_SIZE_BYTES: 50 * 1024 * 1024,
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif'],
} as const;

// Signature
export const SIGNATURE_CONFIG = {
  MIN_WIDTH: 300,
  MIN_HEIGHT: 150,
  STROKE_WIDTH: 2,
  STROKE_COLOR: '#171717',
  BACKGROUND_COLOR: '#ffffff',
} as const;

// Cache
export const CACHE_CONFIG = {
  DOCUMENTS_TTL: 5 * 60 * 1000, // 5 minutes
  TASKS_TTL: 2 * 60 * 1000, // 2 minutes
  USER_TTL: 30 * 60 * 1000, // 30 minutes
  NOTIFICATIONS_TTL: 1 * 60 * 1000, // 1 minute
} as const;

// Biometric
export const BIOMETRIC_CONFIG = {
  PROMPT_MESSAGE: 'Authentifiez-vous pour continuer',
  CANCEL_LABEL: 'Annuler',
  FALLBACK_LABEL: 'Utiliser le code PIN',
} as const;

// Notification Channels (Android)
export const NOTIFICATION_CHANNELS = {
  TASKS: {
    id: 'tasks',
    name: 'Taches',
    importance: 4, // HIGH
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#171717',
  },
  DOCUMENTS: {
    id: 'documents',
    name: 'Documents',
    importance: 3, // DEFAULT
  },
  GENERAL: {
    id: 'general',
    name: 'General',
    importance: 2, // LOW
  },
} as const;

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  BIOMETRIC_ERROR: 'BIOMETRIC_ERROR',
  LOCATION_ERROR: 'LOCATION_ERROR',
} as const;

// Routes
export const ROUTES = {
  AUTH: {
    LOGIN: '/(auth)/login',
    REGISTER: '/(auth)/register',
    FORGOT_PASSWORD: '/(auth)/forgot-password',
  },
  TABS: {
    HOME: '/(tabs)',
    DOCUMENTS: '/(tabs)/documents',
    TASKS: '/(tabs)/tasks',
    NOTIFICATIONS: '/(tabs)/notifications',
    PROFILE: '/(tabs)/profile',
  },
  DOCUMENT: {
    DETAIL: '/document/[id]',
    PREVIEW: '/document/preview/[id]',
  },
  WORKFLOW: {
    START: '/workflow/start/[id]',
    DETAIL: '/workflow/[id]',
  },
  SIGN: {
    DOCUMENT: '/sign/[id]',
    CREATE: '/sign/create',
  },
} as const;
