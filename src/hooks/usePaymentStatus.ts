/**
 * Payment Status Polling Hook
 * Permet de suivre le statut d'un paiement en temps réel
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkoutService, PaymentStatus } from '../services/checkout';

interface UsePaymentStatusOptions {
  /** Intervalle de polling en ms (défaut: 3000) */
  pollingInterval?: number;
  /** Timeout max en ms (défaut: 300000 = 5 min) */
  timeout?: number;
  /** Rediriger automatiquement après succès */
  autoRedirect?: boolean;
  /** Callback après succès */
  onSuccess?: (status: PaymentStatus) => void;
  /** Callback après échec */
  onFailed?: (status: PaymentStatus) => void;
  /** Callback après timeout */
  onTimeout?: () => void;
}

interface UsePaymentStatusResult {
  /** Statut actuel du paiement */
  status: PaymentStatus | null;
  /** Chargement en cours */
  isLoading: boolean;
  /** Polling actif */
  isPolling: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Temps écoulé en secondes */
  elapsedTime: number;
  /** Temps restant estimé en secondes */
  remainingTime: number;
  /** Démarrer le polling */
  startPolling: () => void;
  /** Arrêter le polling */
  stopPolling: () => void;
  /** Vérifier manuellement */
  checkStatus: () => Promise<void>;
}

export function usePaymentStatus(
  checkoutToken: string | null,
  options: UsePaymentStatusOptions = {}
): UsePaymentStatusResult {
  const {
    pollingInterval = 3000,
    timeout = 300000, // 5 minutes
    autoRedirect = true,
    onSuccess,
    onFailed,
    onTimeout,
  } = options;

  const navigate = useNavigate();

  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const remainingTime = Math.max(0, Math.ceil((timeout - elapsedTime * 1000) / 1000));

  // Vérifier le statut
  const checkStatus = useCallback(async () => {
    if (!checkoutToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await checkoutService.getPaymentStatus(checkoutToken);
      setStatus(result);

      // Traiter les statuts finaux
      if (result.status === 'completed') {
        stopPolling();
        onSuccess?.(result);
        if (autoRedirect && result.redirect_url) {
          navigate(result.redirect_url);
        }
      } else if (result.status === 'failed') {
        stopPolling();
        onFailed?.(result);
        setError(result.error_message || 'Le paiement a échoué');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de vérification';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [checkoutToken, autoRedirect, navigate, onSuccess, onFailed]);

  // Arrêter le polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Démarrer le polling
  const startPolling = useCallback(() => {
    if (!checkoutToken || isPolling) return;

    setIsPolling(true);
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    // Timer pour le temps écoulé
    elapsedTimerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    // Première vérification immédiate
    checkStatus();

    // Polling régulier
    pollingRef.current = setInterval(() => {
      checkStatus();
    }, pollingInterval);

    // Timeout global
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      onTimeout?.();
      setError('Le délai de vérification a expiré. Veuillez vérifier votre email.');
    }, timeout);
  }, [checkoutToken, isPolling, checkStatus, pollingInterval, timeout, stopPolling, onTimeout]);

  // Nettoyage à la destruction
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Démarrer automatiquement si token présent
  useEffect(() => {
    if (checkoutToken && !isPolling && !status) {
      startPolling();
    }
  }, [checkoutToken]);

  return {
    status,
    isLoading,
    isPolling,
    error,
    elapsedTime,
    remainingTime,
    startPolling,
    stopPolling,
    checkStatus,
  };
}

export default usePaymentStatus;
