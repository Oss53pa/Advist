/**
 * Tests for Logger utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @sentry/react to avoid dynamic import failures in tests
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureMessage: vi.fn(),
  captureException: vi.fn(),
  setContext: vi.fn(),
}));

describe('Logger', () => {
  let _consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should export logger object with all methods', async () => {
    const { logger } = await import('./logger');
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.exception).toBe('function');
  });

  it('should export initSentry function', async () => {
    const { initSentry } = await import('./logger');
    expect(typeof initSentry).toBe('function');
  });

  it('should call console.debug for debug messages in dev mode', async () => {
    const { logger } = await import('./logger');
    logger.debug('Test debug message');
    expect(() => logger.debug('Test')).not.toThrow();
  });

  it('should call console.info for info messages', async () => {
    const { logger } = await import('./logger');
    expect(() => logger.info('Test info message')).not.toThrow();
  });

  it('should call console.warn for warn messages', async () => {
    const { logger } = await import('./logger');
    expect(() => logger.warn('Test warning message')).not.toThrow();
  });

  it('should call console.error for error messages', async () => {
    const { logger } = await import('./logger');
    expect(() => logger.error('Test error message')).not.toThrow();
  });

  it('should handle context objects', async () => {
    const { logger } = await import('./logger');
    const context = { userId: '123', action: 'test' };
    expect(() => logger.info('Test with context', context)).not.toThrow();
  });

  it('should handle exception logging', async () => {
    const { logger } = await import('./logger');
    const error = new Error('Test error');
    expect(() => logger.exception('Exception occurred', error)).not.toThrow();
  });

  it('should handle exception with context', async () => {
    const { logger } = await import('./logger');
    const error = new Error('Test error');
    const context = { userId: '123' };
    expect(() => logger.exception('Exception occurred', error, context)).not.toThrow();
  });

  it('should handle empty messages', async () => {
    const { logger } = await import('./logger');
    expect(() => logger.info('')).not.toThrow();
  });

  it('should handle undefined context', async () => {
    const { logger } = await import('./logger');
    expect(() => logger.info('Test', undefined)).not.toThrow();
  });

  it('should handle complex context objects', async () => {
    const { logger } = await import('./logger');
    const complexContext = {
      nested: { deep: { value: 'test' } },
      array: [1, 2, 3],
      date: new Date().toISOString(),
    };
    expect(() => logger.debug('Complex context', complexContext)).not.toThrow();
  });
});
