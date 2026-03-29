import React from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getColorFromName = (name: string): string => {
  const colors = [
    'bg-advist-dark',
    'bg-advist-success',
    'bg-advist-gold',
    'bg-advist-error',
    'bg-advist-dark',
    'bg-advist-gold-light',
    'bg-advist-surface-dark',
    'bg-advist-surface-dark',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
}) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`
          rounded-full object-cover
          ${sizeStyles[size]}
          ${className}
        `}
      />
    );
  }

  return (
    <div
      className={`
        rounded-full flex items-center justify-center
        text-white font-medium
        ${sizeStyles[size]}
        ${getColorFromName(name)}
        ${className}
      `}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};

interface AvatarGroupProps {
  users: { name: string; avatar?: string }[];
  max?: number;
  size?: AvatarSize;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  max = 4,
  size = 'sm',
}) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((user, index) => (
        <Avatar
          key={index}
          src={user.avatar}
          name={user.name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            rounded-full flex items-center justify-center
            bg-gradient-to-r from-advist-gold to-primary-500 text-white font-medium ring-2 ring-white
            ${sizeStyles[size]}
          `}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
