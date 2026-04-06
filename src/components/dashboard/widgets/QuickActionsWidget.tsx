/**
 * Quick Actions Widget
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload, GitBranch, PenTool, Search, FolderPlus } from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';

interface QuickActionsWidgetProps {
  config: WidgetConfig;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  path?: string;
  onClick?: () => void;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ _config }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const actions: QuickAction[] = [
    {
      id: 'upload',
      label: t('dashboard.actions.import', 'Importer'),
      icon: <Upload size={20} />,
      color: 'bg-advist-dark text-white',
      path: '/user/documents/new',
    },
    {
      id: 'workflow',
      label: t('dashboard.actions.workflow', 'Workflow'),
      icon: <GitBranch size={20} />,
      color: 'bg-advist-gold-light/20 text-advist-gray900',
      path: '/user/workflows',
    },
    {
      id: 'sign',
      label: t('dashboard.actions.sign', 'Signer'),
      icon: <PenTool size={20} />,
      color: 'bg-advist-red text-advist-gray900',
      path: '/user/signatures',
    },
    {
      id: 'folder',
      label: t('dashboard.actions.newFolder', 'Nouveau dossier'),
      icon: <FolderPlus size={20} />,
      color: 'bg-advist-gold-light/20 text-advist-gray900',
      path: '/user/folders/new',
    },
    {
      id: 'search',
      label: t('dashboard.actions.search', 'Rechercher'),
      icon: <Search size={20} />,
      color: 'bg-advist-surface-dark text-advist-gray900',
      onClick: () => {
        // Trigger search modal
        document.dispatchEvent(new CustomEvent('open-search'));
      },
    },
  ];

  const handleClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleClick(action)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:scale-105 hover:shadow-md ${action.color}`}
        >
          {action.icon}
          <span className="font-medium text-sm">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActionsWidget;
