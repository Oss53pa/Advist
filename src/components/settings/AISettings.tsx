/**
 * AI Settings Component
 * Configuration panel for multiple AI providers (OpenRouter, Claude)
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Loader2,
  MessageSquare,
  FileSearch,
  Sliders,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  useAIStore,
  OPENROUTER_MODELS,
  OPENROUTER_FREE_MODELS,
  CLAUDE_MODELS,
} from '../../store/aiStore';
import { maskApiKey } from '../../utils/encryption';

export const AISettings: React.FC = () => {
  const { t } = useTranslation();
  const {
    config,
    isValidating,
    validationError,
    setProvider,
    setOpenRouterApiKey,
    setOpenRouterModel,
    setOpenRouterUseFreeModels,
    setClaudeApiKey,
    setClaudeModel,
    setMaxTokens,
    setTemperature,
    setFeature,
    validateConfig,
    clearConfig,
    getApiKey,
    requiresApiKey,
  } = useAIStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isEditing, setIsEditing] = useState(!config.isConfigured);

  const currentApiKey = getApiKey();
  const displayApiKey = showApiKey ? currentApiKey : maskApiKey(currentApiKey);
  const needsApiKey = requiresApiKey();

  const handleSaveApiKey = () => {
    if (config.provider === 'openrouter') {
      setOpenRouterApiKey(apiKeyInput);
    } else {
      if (apiKeyInput && apiKeyInput.startsWith('sk-ant-') && apiKeyInput.length > 20) {
        setClaudeApiKey(apiKeyInput);
      } else {
        return;
      }
    }
    setApiKeyInput('');
    setIsEditing(false);
  };

  const handleTestConnection = async () => {
    const success = await validateConfig();
    if (success) {
      setIsEditing(false);
    }
  };

  const handleClearConfig = () => {
    clearConfig();
    setApiKeyInput('');
    setIsEditing(true);
  };

  const isValidKey = () => {
    if (config.provider === 'openrouter') {
      // OpenRouter keys start with sk-or- but any non-empty key works for paid models
      return !needsApiKey || apiKeyInput.length > 0;
    }
    // Claude keys must start with sk-ant-
    return apiKeyInput.startsWith('sk-ant-') && apiKeyInput.length > 20;
  };

  const getCurrentModels = () => {
    if (config.provider === 'openrouter') {
      return config.openrouter.useFreeModels
        ? OPENROUTER_FREE_MODELS
        : OPENROUTER_MODELS;
    }
    return CLAUDE_MODELS;
  };

  const getCurrentModel = () => {
    if (config.provider === 'openrouter') {
      return config.openrouter.model;
    }
    return config.claude.model;
  };

  const handleModelChange = (modelId: string) => {
    if (config.provider === 'openrouter') {
      setOpenRouterModel(modelId as typeof config.openrouter.model);
    } else {
      setClaudeModel(modelId as typeof config.claude.model);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-primary-900 to-primary-900 rounded-xl">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-advist-gray900">
              {t('settings.ai.title', 'Intelligence Artificielle')}
            </h2>
            <p className="text-advist-gray900/60 mt-1">
              {t('settings.ai.multiProviderDesc', 'Configurez votre fournisseur d\'IA - choisissez entre des modeles gratuits ou payants')}
            </p>
          </div>
          {config.isConfigured && (
            <Badge variant="success" className="flex items-center gap-1">
              <Check size={14} />
              {t('settings.ai.configured', 'Configure')}
            </Badge>
          )}
        </div>
      </Card>

      {/* Provider Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-advist-gray900 mb-4 flex items-center gap-2">
          <Zap size={20} />
          {t('settings.ai.selectProvider', 'Choisir le fournisseur')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* OpenRouter */}
          <button
            onClick={() => setProvider('openrouter')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              config.provider === 'openrouter'
                ? 'border-advist-primary bg-advist-primary/5'
                : 'border-primary-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-advist-gray900">OpenRouter</p>
                <Badge variant="success" className="text-xs">Gratuit disponible</Badge>
              </div>
            </div>
            <p className="text-sm text-advist-gray900/60">
              Acces a Llama 3, Gemma 2, Mistral et plus. Modeles gratuits inclus.
            </p>
          </button>

          {/* Claude */}
          <button
            onClick={() => setProvider('claude')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              config.provider === 'claude'
                ? 'border-advist-primary bg-advist-primary/5'
                : 'border-primary-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-advist-gray900">Claude (Anthropic)</p>
                <Badge variant="warning" className="text-xs">Cle API requise</Badge>
              </div>
            </div>
            <p className="text-sm text-advist-gray900/60">
              Modeles Claude 3 & 4 d'Anthropic. Tres puissant, payant.
            </p>
          </button>
        </div>
      </Card>

      {/* OpenRouter Free/Paid Toggle */}
      {config.provider === 'openrouter' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
            Type de modeles
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => setOpenRouterUseFreeModels(true)}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                config.openrouter.useFreeModels
                  ? 'border-green-500 bg-green-50'
                  : 'border-primary-200 hover:border-primary-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-green-600" />
                <p className="font-medium text-advist-gray900">Modeles gratuits</p>
              </div>
              <p className="text-sm text-advist-gray900/60">
                Llama 3, Gemma 2, Mistral - Aucune cle requise
              </p>
            </button>
            <button
              onClick={() => setOpenRouterUseFreeModels(false)}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                !config.openrouter.useFreeModels
                  ? 'border-advist-primary bg-advist-primary/5'
                  : 'border-primary-200 hover:border-primary-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap size={18} className="text-advist-primary" />
                <p className="font-medium text-advist-gray900">Modeles premium</p>
              </div>
              <p className="text-sm text-advist-gray900/60">
                GPT-4, Claude, Gemini Pro - Cle API requise
              </p>
            </button>
          </div>
        </Card>
      )}

      {/* API Key Configuration */}
      {needsApiKey && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-advist-gray900 mb-4 flex items-center gap-2">
            <Key size={20} />
            {config.provider === 'openrouter'
              ? 'Cle API OpenRouter'
              : 'Cle API Claude'}
          </h3>

          {config.isConfigured && !isEditing && currentApiKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-advist-bg rounded-xl">
                <div className="flex-1">
                  <p className="text-sm text-advist-gray900/60 mb-1">
                    {t('settings.ai.currentKey', 'Cle actuelle')}
                  </p>
                  <code className="text-advist-gray900 font-mono">
                    {displayApiKey}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-advist-gray900/60">
                <Check size={16} className="text-green-500" />
                {t('settings.ai.lastValidated', 'Derniere validation')}:{' '}
                {config.lastValidated
                  ? new Date(config.lastValidated).toLocaleString('fr-FR')
                  : '-'}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  {t('settings.ai.changeKey', 'Modifier la cle')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleTestConnection}
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <Loader2 size={18} className="animate-spin mr-2" />
                  ) : (
                    <RefreshCw size={18} className="mr-2" />
                  )}
                  {t('settings.ai.testConnection', 'Tester la connexion')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">
                  {config.provider === 'openrouter'
                    ? 'Entrez votre cle API OpenRouter'
                    : 'Entrez votre cle API Claude'}
                </label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={config.provider === 'openrouter' ? 'sk-or-...' : 'sk-ant-api...'}
                      className="font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-advist-gray900/40 hover:text-advist-gray900"
                    >
                      {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <Button
                    onClick={handleSaveApiKey}
                    disabled={!isValidKey()}
                  >
                    {t('common.save', 'Enregistrer')}
                  </Button>
                </div>
                {config.provider === 'claude' && apiKeyInput && !isValidKey() && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    Format de cle invalide. La cle doit commencer par "sk-ant-"
                  </p>
                )}
              </div>

              <div className="p-4 bg-primary-50 rounded-xl">
                <p className="text-sm text-primary-800">
                  Obtenez votre cle API sur{' '}
                  <a
                    href={config.provider === 'openrouter'
                      ? 'https://openrouter.ai/keys'
                      : 'https://console.anthropic.com/settings/keys'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline inline-flex items-center gap-1"
                  >
                    {config.provider === 'openrouter' ? 'openrouter.ai' : 'console.anthropic.com'}
                    <ExternalLink size={14} />
                  </a>
                </p>
              </div>

              {config.isConfigured && (
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                >
                  {t('common.cancel', 'Annuler')}
                </Button>
              )}
            </div>
          )}

          {validationError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <X size={16} />
                {validationError}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Test Connection for Free Models */}
      {config.provider === 'openrouter' && config.openrouter.useFreeModels && !config.isConfigured && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-advist-gray900 mb-1">
                Pret a utiliser
              </h3>
              <p className="text-sm text-advist-gray900/60">
                Les modeles gratuits ne necessitent pas de cle API. Testez la connexion pour commencer.
              </p>
            </div>
            <Button
              onClick={handleTestConnection}
              disabled={isValidating}
            >
              {isValidating ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : (
                <Check size={18} className="mr-2" />
              )}
              Activer l'IA
            </Button>
          </div>
          {validationError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <X size={16} />
                {validationError}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Model Selection */}
      {(config.isConfigured || (config.provider === 'openrouter' && config.openrouter.useFreeModels)) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-advist-gray900 mb-4 flex items-center gap-2">
            <Sliders size={20} />
            {t('settings.ai.parameters', 'Parametres du modele')}
          </h3>

          <div className="space-y-6">
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                {t('settings.ai.model', 'Modele')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getCurrentModels().map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      getCurrentModel() === model.id
                        ? 'border-advist-primary bg-advist-primary/5'
                        : 'border-primary-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-advist-gray900">{model.name}</p>
                      {'free' in model && model.free && (
                        <Badge variant="success" className="text-xs">Gratuit</Badge>
                      )}
                    </div>
                    <p className="text-sm text-advist-gray900/60">{model.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                {t('settings.ai.maxTokens', 'Tokens maximum')}: {config.maxTokens}
              </label>
              <input
                type="range"
                min="100"
                max="8192"
                step="100"
                value={config.maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer accent-advist-primary"
              />
              <div className="flex justify-between text-xs text-advist-gray900/60 mt-1">
                <span>100</span>
                <span>8192</span>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                {t('settings.ai.temperature', 'Temperature')}: {config.temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer accent-advist-primary"
              />
              <div className="flex justify-between text-xs text-advist-gray900/60 mt-1">
                <span>{t('settings.ai.precise', 'Precis')}</span>
                <span>{t('settings.ai.creative', 'Creatif')}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Features */}
      {config.isConfigured && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
            {t('settings.ai.features', 'Fonctionnalites')}
          </h3>

          <div className="space-y-4">
            {/* Chat Assistant */}
            <div className="flex items-center justify-between p-4 bg-advist-bg rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <MessageSquare size={20} className="text-advist-primary" />
                </div>
                <div>
                  <p className="font-medium text-advist-gray900">
                    {t('settings.ai.chatAssistant', 'Assistant de chat')}
                  </p>
                  <p className="text-sm text-advist-gray900/60">
                    {t('settings.ai.chatAssistantDesc', 'Chatbot pour repondre aux questions des utilisateurs')}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.features.chatEnabled}
                  onChange={(e) => setFeature('chatEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-advist-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-primary"></div>
              </label>
            </div>

            {/* Document Analysis */}
            <div className="flex items-center justify-between p-4 bg-advist-bg rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <FileSearch size={20} className="text-advist-primary" />
                </div>
                <div>
                  <p className="font-medium text-advist-gray900">
                    {t('settings.ai.documentAnalysis', 'Analyse de documents')}
                  </p>
                  <p className="text-sm text-advist-gray900/60">
                    {t('settings.ai.documentAnalysisDesc', 'Resumer et analyser automatiquement les documents')}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.features.documentAnalysisEnabled}
                  onChange={(e) => setFeature('documentAnalysisEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-advist-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-primary"></div>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Danger Zone */}
      {config.isConfigured && (
        <Card className="p-6 border-red-200">
          <h3 className="text-lg font-semibold text-red-600 mb-4">
            {t('settings.ai.dangerZone', 'Zone de danger')}
          </h3>
          <p className="text-sm text-advist-gray900/60 mb-4">
            {t('settings.ai.clearConfigWarning', 'Supprimer la configuration effacera la cle API et desactivera toutes les fonctionnalites IA.')}
          </p>
          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
            onClick={handleClearConfig}
          >
            {t('settings.ai.clearConfig', 'Supprimer la configuration')}
          </Button>
        </Card>
      )}
    </div>
  );
};

export default AISettings;
