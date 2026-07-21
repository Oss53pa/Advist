import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rounded?: boolean;
}

// Classes issues des tokens (src/styles/theme.ts) plutot que d'hex codes en dur :
// la palette reste pilotee depuis un point unique.
// Equivalences : gray900 #131C2E · gray800 #1B2740 · gray200 #E8E2D6
//                gray300 #D8CFBF · gray50 #FAF7F1 · error #ef4444
// Seul changement visuel volontaire : les fonds `secondary` et le survol `ghost`
// passent de gray50 a gray100 (#F1ECE1). gray50 est la couleur de fond de page,
// ces boutons y etaient donc invisibles.
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-advist-gray900 text-white hover:bg-advist-gray800 focus:ring-advist-gray900/20 shadow-sm hover:shadow-md',
  secondary:
    'bg-advist-gray100 text-advist-gray900 hover:bg-advist-gray200 focus:ring-advist-gray200',
  outline:
    'border border-advist-gray200 text-advist-gray900 hover:bg-advist-gray50 hover:border-advist-gray300 focus:ring-advist-gray200',
  ghost: 'text-advist-gray900 hover:bg-advist-gray100 focus:ring-advist-gray200',
  danger: 'bg-advist-error text-white hover:bg-red-600 focus:ring-advist-error/20 shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-[13px]',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  rounded = false,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold
        ${rounded ? 'rounded-full' : 'rounded-xl'}
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {rightIcon}
    </button>
  );
};

interface FloatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const floatingSizeStyles = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`
        ${floatingSizeStyles[size]}
        rounded-full flex items-center justify-center
        ${variant === 'danger' ? 'bg-advist-error text-white hover:bg-red-600' : 'bg-advist-gray900 text-white hover:bg-advist-gray800'}
        shadow-lg transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variant === 'danger' ? 'focus:ring-advist-error/20' : 'focus:ring-advist-gray900/20'}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
