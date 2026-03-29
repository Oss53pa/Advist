import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Search, Filter, Download } from 'lucide-react';

const ISO27001PoliciesPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            {t('iso27001.policies.title')}
          </h1>
          <p className="text-advist-text-secondary mt-1">
            {t('iso27001.policies.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-advist-border rounded-xl hover:bg-advist-surface transition-colors">
            <Download className="w-4 h-4" />
            {t('iso27001.policies.export')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />
            {t('iso27001.policies.newPolicy')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-advist-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-advist-text-secondary" />
          <input
            type="text"
            placeholder={t('iso27001.policies.searchPolicy')}
            className="w-full pl-10 pr-4 py-2 bg-advist-surface rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-advist-surface rounded-lg hover:bg-advist-surface-dark transition-colors">
          <Filter className="w-4 h-4" />
          {t('iso27001.policies.filters')}
        </button>
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-xl border border-advist-border p-8 text-center">
        <FileText className="w-16 h-16 text-advist-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-advist-gray900 mb-2">
          {t('iso27001.policies.devTitle')}
        </h3>
        <p className="text-advist-text-secondary max-w-md mx-auto">
          {t('iso27001.policies.devDescription')}
        </p>
      </div>
    </div>
  );
};

export default ISO27001PoliciesPage;
