import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileCheck, Search, Filter, Download, CheckCircle, Clock, XCircle } from 'lucide-react';

const ISO27001SoAPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            {t('iso27001.soa.title')}
          </h1>
          <p className="text-advist-text-secondary mt-1">{t('iso27001.soa.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-advist-border rounded-xl hover:bg-advist-surface transition-colors">
            <Download className="w-4 h-4" />
            {t('iso27001.soa.export')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-advist-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-advist-text-secondary" />
          <input
            type="text"
            placeholder={t('iso27001.soa.searchControl')}
            className="w-full pl-10 pr-4 py-2 bg-advist-surface rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-advist-surface rounded-lg hover:bg-advist-surface-dark transition-colors">
          <Filter className="w-4 h-4" />
          {t('iso27001.soa.filters')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-advist-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">67</p>
              <p className="text-xs text-advist-text-secondary">{t('iso27001.soa.implemented')}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-advist-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">18</p>
              <p className="text-xs text-advist-text-secondary">{t('iso27001.soa.partial')}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-advist-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">8</p>
              <p className="text-xs text-advist-text-secondary">
                {t('iso27001.soa.notImplemented')}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-advist-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">93</p>
              <p className="text-xs text-advist-text-secondary">{t('iso27001.soa.total')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Table Placeholder */}
      <div className="bg-white rounded-xl border border-advist-border p-8 text-center">
        <FileCheck className="w-16 h-16 text-advist-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-advist-gray900 mb-2">
          {t('iso27001.soa.tableTitle')}
        </h3>
        <p className="text-advist-text-secondary max-w-md mx-auto">
          {t('iso27001.soa.tableDescription')}
        </p>
      </div>
    </div>
  );
};

export default ISO27001SoAPage;
