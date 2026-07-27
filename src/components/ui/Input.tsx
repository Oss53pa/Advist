import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, leftIcon, rightIcon, className = '', id: providedId, ...props },
    ref
  ) => {
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-advist-gray900 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-advist-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={`
              w-full px-4 py-2
              bg-white border rounded-xl
              text-advist-gray900 placeholder-primary-400
              transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-advist-gold focus:border-transparent
              disabled:bg-advist-surface-dark disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-advist-gold focus:ring-advist-gold' : 'border-advist-border'}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-advist-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-advist-error">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-sm text-advist-gray900/70">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
