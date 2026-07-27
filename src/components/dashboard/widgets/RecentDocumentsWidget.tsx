/**
 * Recent Documents Widget
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, ArrowRight } from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';

interface RecentDocumentsWidgetProps {
  config: WidgetConfig;
}

interface DocumentItem {
  id: number;
  title: string;
  type: string;
  updatedAt: string;
  status: string;
}

export const RecentDocumentsWidget: React.FC<RecentDocumentsWidgetProps> = ({ config }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const mockDocs: DocumentItem[] = [
        {
          id: 1,
          title: 'Contrat de prestation Q4',
          type: 'Contrat',
          updatedAt: '2 min',
          status: 'pending',
        },
        {
          id: 2,
          title: 'Budget prévisionnel 2025',
          type: 'Budget',
          updatedAt: '15 min',
          status: 'approved',
        },
        { id: 3, title: 'Rapport financier', type: 'Rapport', updatedAt: '1h', status: 'draft' },
        {
          id: 4,
          title: 'Procédure qualité v2',
          type: 'Procédure',
          updatedAt: '2h',
          status: 'in_review',
        },
        {
          id: 5,
          title: 'Facture client ABC',
          type: 'Facture',
          updatedAt: '3h',
          status: 'approved',
        },
      ];

      const limit = config.settings.limit || 5;
      setDocuments(mockDocs.slice(0, limit));
      setLoading(false);
    };

    fetchData();
  }, [config]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-advist-surface-dark text-advist-text-secondary',
      pending: 'bg-advist-gold-light text-advist-gold-dark',
      in_review: 'bg-advist-gold-light text-advist-gold-dark',
      approved: 'bg-green-50 text-advist-success',
    };
    return styles[status] || styles.draft;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 bg-advist-surface-dark rounded"></div>
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-advist-surface-dark rounded mb-1"></div>
              <div className="h-3 w-1/2 bg-advist-surface-dark rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          to={`/user/documents/${doc.id}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-advist-surface-dark transition-all group"
        >
          <div className="w-8 h-8 bg-advist-gold-light rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-advist-gray900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-advist-gray900 truncate group-hover:text-advist-gold-dark">
              {doc.title}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-advist-text-secondary">{doc.type}</span>
              <span className="text-xs text-advist-text-muted">•</span>
              <span className="text-xs text-advist-text-secondary flex items-center gap-1">
                <Clock size={10} />
                {doc.updatedAt}
              </span>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(doc.status)}`}>
            {doc.status}
          </span>
        </Link>
      ))}
      <Link
        to="/user/documents"
        className="flex items-center justify-center gap-1 pt-2 text-sm text-advist-text-secondary hover:text-advist-gold-dark"
      >
        Voir tous <ArrowRight size={14} />
      </Link>
    </div>
  );
};

export default RecentDocumentsWidget;
