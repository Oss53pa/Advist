import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { API_CONFIG, STORAGE_KEYS, ERROR_CODES } from '@/constants/config';
import { tokenStorage } from '@/utils/storage';
import { AuthTokens, ApiError } from '@/types';

// Custom error class for API errors
export class AppError extends Error {
  code: string;
  status?: number;
  details?: Record<string, string[]>;

  constructor(message: string, code: string, status?: number, details?: Record<string, string[]>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

class ApiService {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private onUnauthorized?: () => void;

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'fr',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set callback for unauthorized responses (logout)
   */
  setOnUnauthorized(callback: () => void): void {
    this.onUnauthorized = callback;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          throw new AppError(
            'Pas de connexion internet',
            ERROR_CODES.NETWORK_ERROR
          );
        }

        // Add auth token
        const token = await tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(this.handleError(error))
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 - Token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.instance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.refreshSubscribers.forEach((callback) => callback(newToken));
            this.refreshSubscribers = [];
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.instance(originalRequest);
          } catch (refreshError) {
            await tokenStorage.clearTokens();
            this.onUnauthorized?.();
            throw new AppError(
              'Session expiree. Veuillez vous reconnecter.',
              ERROR_CODES.UNAUTHORIZED,
              401
            );
          } finally {
            this.isRefreshing = false;
          }
        }

        throw this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError<ApiError> | Error): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      // Network error
      if (!error.response) {
        if (error.code === 'ECONNABORTED') {
          return new AppError(
            'La requete a expire. Verifiez votre connexion.',
            ERROR_CODES.TIMEOUT
          );
        }
        return new AppError(
          'Erreur reseau. Verifiez votre connexion.',
          ERROR_CODES.NETWORK_ERROR
        );
      }

      // HTTP errors
      switch (status) {
        case 400:
          return new AppError(
            data?.message || 'Requete invalide',
            ERROR_CODES.VALIDATION_ERROR,
            status,
            data?.details
          );
        case 401:
          return new AppError(
            'Non autorise',
            ERROR_CODES.UNAUTHORIZED,
            status
          );
        case 403:
          return new AppError(
            'Acces refuse',
            ERROR_CODES.FORBIDDEN,
            status
          );
        case 404:
          return new AppError(
            'Ressource non trouvee',
            ERROR_CODES.NOT_FOUND,
            status
          );
        case 500:
        case 502:
        case 503:
          return new AppError(
            'Erreur serveur. Reessayez plus tard.',
            ERROR_CODES.SERVER_ERROR,
            status
          );
        default:
          return new AppError(
            data?.message || 'Une erreur est survenue',
            ERROR_CODES.SERVER_ERROR,
            status
          );
      }
    }

    return new AppError(
      error.message || 'Une erreur inattendue est survenue',
      ERROR_CODES.SERVER_ERROR
    );
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh/`, {
      refresh: refreshToken,
    });

    const { access, refresh } = response.data;
    await tokenStorage.setTokens(access, refresh);
    return access;
  }

  // Token management
  async setTokens(tokens: AuthTokens): Promise<void> {
    await tokenStorage.setTokens(tokens.access, tokens.refresh);
  }

  async clearTokens(): Promise<void> {
    await tokenStorage.clearTokens();
  }

  // HTTP methods with retry support
  async get<T>(
    url: string,
    params?: Record<string, unknown>,
    options?: { retry?: number }
  ): Promise<T> {
    const maxRetries = options?.retry ?? API_CONFIG.RETRY_ATTEMPTS;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.instance.get<T>(url, { params });
        return response.data;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries && this.shouldRetry(error as AppError)) {
          await this.delay(API_CONFIG.RETRY_DELAY * (attempt + 1));
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.instance.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.instance.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.instance.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.instance.delete<T>(url);
    return response.data;
  }

  // File upload with progress
  async uploadFile<T>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const response = await this.instance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Download file
  async downloadFile(
    url: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const response = await this.instance.get(url, {
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  private shouldRetry(error: AppError): boolean {
    return [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT,
      ERROR_CODES.SERVER_ERROR,
    ].includes(error.code);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const api = new ApiService();
export default api;
