import React from 'react';
import { Sparkles, Plus, X, Check } from 'lucide-react';
import { Button, Badge } from '../ui';
import { Addon, SubscriptionAddon } from '../../services/subscriptions';

interface AddonCardProps {
  addon: Addon | SubscriptionAddon;
  price?: number;
  isActive?: boolean;
  isLoading?: boolean;
  onAdd?: (addonId: string) => void;
  onRemove?: (addonId: string) => void;
  showFeatures?: boolean;
  compact?: boolean;
}

export const AddonCard: React.FC<AddonCardProps> = ({
  addon,
  price,
  isActive = false,
  isLoading = false,
  onAdd,
  onRemove,
  showFeatures = true,
  compact = false,
}) => {
  const addonId = 'addon' in addon ? addon.addon : addon.id;
  const addonName = 'addon_name' in addon ? addon.addon_name : addon.name;
  const addonDescription = 'addon_description' in addon ? addon.addon_description : addon.description;
  const addonFeatures = 'addon_features' in addon ? addon.addon_features : addon.features;
  const displayPrice = price ?? ('price' in addon ? addon.price : 0);
  const currency = addon.currency || 'XOF';

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  if (compact) {
    return (
      <div className={`flex items-center justify-between p-4 rounded-xl transition-all ${
        isActive
          ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800'
          : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isActive
              ? 'bg-gradient-to-br from-amber-500 to-orange-600'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            <Sparkles className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{addonName}</h4>
            {isActive && (
              <Badge variant="success" size="sm" className="mt-0.5">Actif</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold text-gray-900 dark:text-white">
              {formatPrice(displayPrice)} {currency}
            </p>
            <p className="text-xs text-gray-500">/mois</p>
          </div>
          {isActive && onRemove ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(addonId)}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
              ) : (
                <>
                  <X size={16} className="mr-1" />
                  Retirer
                </>
              )}
            </Button>
          ) : onAdd && (
            <Button
              size="sm"
              onClick={() => onAdd(addonId)}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Plus size={16} className="mr-1" />
                  Ajouter
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden transition-all ${
      isActive
        ? 'border-2 border-amber-300 dark:border-amber-700 shadow-lg shadow-amber-100 dark:shadow-amber-900/20'
        : 'border border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header */}
      <div className={`p-6 ${
        isActive
          ? 'bg-gradient-to-br from-amber-500 to-orange-600'
          : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'
      }`}>
        <div className="flex items-start justify-between">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isActive ? 'bg-white/20' : 'bg-white dark:bg-gray-600'
          }`}>
            <Sparkles className={`w-7 h-7 ${isActive ? 'text-white' : 'text-amber-500'}`} />
          </div>
          {isActive && (
            <Badge variant="success" size="sm">Actif</Badge>
          )}
        </div>
        <h3 className={`text-xl font-bold mt-4 ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {addonName}
        </h3>
        <p className={`text-sm mt-1 ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
          {addonDescription || 'Option supplementaire'}
        </p>
      </div>

      {/* Body */}
      <div className="p-6 bg-white dark:bg-gray-800 space-y-4">
        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatPrice(displayPrice)}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {currency}/mois
          </span>
        </div>

        {/* Features */}
        {showFeatures && addonFeatures && addonFeatures.length > 0 && (
          <ul className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            {addonFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Action */}
        <div className="pt-4">
          {isActive && onRemove ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onRemove(addonId)}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
              ) : (
                <X size={18} className="mr-2" />
              )}
              Desactiver cette option
            </Button>
          ) : onAdd && (
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              onClick={() => onAdd(addonId)}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Plus size={18} className="mr-2" />
              )}
              Ajouter cette option
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddonCard;
