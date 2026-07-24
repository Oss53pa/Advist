import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Archive,
  Search,
  Download,
  Eye,
  RotateCcw,
  Trash2,
  Calendar,
  FileText,
  FolderArchive,
  Clock,
  User,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store';
import { PrintButton } from '../../shared/PrintEngine';

interface ArchivedDocument {
  id: string;
  title: string;
  original_type: string;
  archived_by: string;
  archived_at: string;
  retention_until: string;
  size: string;
  reason: string;
  status: 'active' | 'pending_deletion' | 'legal_hold';
  tags: string[];
}

const STATUS_CONFIG = {
  active: { label: 'Actif', color: 'green' as const, icon: CheckCircle },
  pending_deletion: { label: 'Suppression prevue', color: 'yellow' as const, icon: Clock },
  legal_hold: { label: 'Conservation legale', color: 'red' as const, icon: AlertTriangle },
};

// Map document_status 'archived' to a display status
function mapArchiveStatus(metadata: any): 'active' | 'pending_deletion' | 'legal_hold' {
  if (metadata?.legal_hold) return 'legal_hold';
  if (metadata?.pending_deletion) return 'pending_deletion';
  return 'active';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ArchivesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const orgId = user?.organization?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<ArchivedDocument | null>(null);
  const [archives, setArchives] = useState<ArchivedDocument[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    const fetchArchives = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('documents')
          .select(
            `
            id,
            title,
            file_size,
            tags,
            metadata,
            archived_at,
            status,
            document_types(name),
            profiles!documents_updated_by_fkey(first_name, last_name)
          `
          )
          .eq('organization_id', orgId)
          .eq('status', 'archived')
          .is('deleted_at', null)
          .order('archived_at', { ascending: false });

        if (error) {
          console.error('Archives fetch error:', error);
          return;
        }

        if (data) {
          setArchives(
            (data as any[]).map((doc) => {
              const retentionDays = doc.metadata?.retention_days || 365 * 5;
              const archivedDate = new Date(doc.archived_at || doc.created_at);
              const retentionUntil = new Date(archivedDate);
              retentionUntil.setDate(retentionUntil.getDate() + retentionDays);

              return {
                id: doc.id,
                title: doc.title,
                original_type: doc.document_types?.name || '-',
                archived_by: doc.profiles
                  ? `${doc.profiles.first_name} ${doc.profiles.last_name}`.trim()
                  : '-',
                archived_at: doc.archived_at || '',
                retention_until: retentionUntil.toISOString().split('T')[0],
                size: formatFileSize(doc.file_size || 0),
                reason: doc.metadata?.archive_reason || '-',
                status: mapArchiveStatus(doc.metadata),
                tags: doc.tags || [],
              };
            })
          );
        }
      } catch (err) {
        console.error('Archives fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchives();
  }, [orgId]);

  const filteredArchives = useMemo(() => {
    return archives.filter((archive) => {
      const matchesSearch =
        archive.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        archive.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = selectedStatus === 'all' || archive.status === selectedStatus;
      const matchesType = selectedType === 'all' || archive.original_type === selectedType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [archives, searchQuery, selectedStatus, selectedType]);

  const stats = useMemo(
    () => ({
      total: archives.length,
      active: archives.filter((a) => a.status === 'active').length,
      pendingDeletion: archives.filter((a) => a.status === 'pending_deletion').length,
      legalHold: archives.filter((a) => a.status === 'legal_hold').length,
    }),
    [archives]
  );

  const totalSize = useMemo(() => {
    return archives
      .reduce((acc, a) => {
        const size = parseFloat(a.size);
        return acc + (isNaN(size) ? 0 : size);
      }, 0)
      .toFixed(1);
  }, [archives]);

  const documentTypes = useMemo(
    () => [...new Set(archives.map((a) => a.original_type).filter((t) => t !== '-'))],
    [archives]
  );

  const handleRestore = (archive: ArchivedDocument) => {
    setSelectedArchive(archive);
    setShowRestoreModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">{t('archives.title')}</h1>
          <p className="text-advist-gray900 mt-1">{t('archives.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton config={{ title: 'Archives documentaires', appName: 'Advist' }}>
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Document</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Archivé par</th>
                    <th className="text-left py-2">Date d'archivage</th>
                    <th className="text-left py-2">Rétention</th>
                    <th className="text-left py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArchives.map((archive) => (
                    <tr key={archive.id} className="border-b">
                      <td className="py-1">{archive.title}</td>
                      <td className="py-1">{archive.original_type}</td>
                      <td className="py-1">{archive.archived_by}</td>
                      <td className="py-1">
                        {new Date(archive.archived_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-1">
                        {new Date(archive.retention_until).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-1">{STATUS_CONFIG[archive.status].label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PrintButton>
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            {t('common.export')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          icon={FolderArchive}
          label={t('archives.allArchives')}
          value={stats.total.toString()}
          color="blue"
        />
        <StatsCard
          icon={CheckCircle}
          label={t('archives.status.active')}
          value={stats.active.toString()}
          color="green"
        />
        <StatsCard
          icon={Clock}
          label={t('archives.status.pending_deletion')}
          value={stats.pendingDeletion.toString()}
          color="yellow"
        />
        <StatsCard
          icon={AlertTriangle}
          label={t('archives.status.legal_hold')}
          value={stats.legalHold.toString()}
          color="red"
        />
        <StatsCard
          icon={Archive}
          label={t('common.size')}
          value={`${totalSize} MB`}
          color="purple"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-blue-light"
              />
              <input
                type="text"
                placeholder={t('archives.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-advist-bg rounded-xl text-advist-gray900 placeholder-advist-blue-light focus:outline-none focus:ring-2 focus:ring-advist-gold"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <option value="all">{t('users.allStatuses')}</option>
              <option value="active">{t('archives.status.active')}</option>
              <option value="pending_deletion">{t('archives.status.pending_deletion')}</option>
              <option value="legal_hold">{t('archives.status.legal_hold')}</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
            >
              <option value="all">{t('common.all')}</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Archives Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-advist-bg">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                  Document
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                  Archive par
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                  Date d'archivage
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                  Retention jusqu'au
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                  Statut
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-advist-gray900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-advist-bg">
              {filteredArchives.map((archive) => (
                <ArchiveRow key={archive.id} archive={archive} onRestore={handleRestore} />
              ))}
            </tbody>
          </table>
        </div>

        {filteredArchives.length === 0 && (
          <div className="text-center py-12">
            <Archive size={48} className="mx-auto text-advist-blue-light mb-4" />
            <h3 className="text-lg font-medium text-advist-gray900">{t('archives.noArchives')}</h3>
            <p className="text-advist-gray900 mt-1">{t('common.filter')}</p>
          </div>
        )}
      </Card>

      {/* Restore Modal */}
      {selectedArchive && (
        <RestoreModal
          isOpen={showRestoreModal}
          onClose={() => {
            setShowRestoreModal(false);
            setSelectedArchive(null);
          }}
          archive={selectedArchive}
        />
      )}
    </div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}> = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-advist-gold-light text-advist-gray900',
    green: 'bg-green-50 text-advist-success',
    yellow: 'bg-advist-gold-light text-advist-gold-dark',
    red: 'bg-advist-gold-light text-advist-error',
    purple: 'bg-advist-surface-dark text-advist-gray900',
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xl font-bold text-advist-gray900">{value}</p>
          <p className="text-xs text-advist-gray900">{label}</p>
        </div>
      </div>
    </Card>
  );
};

// Archive Row Component
const ArchiveRow: React.FC<{
  archive: ArchivedDocument;
  onRestore: (archive: ArchivedDocument) => void;
}> = ({ archive, onRestore }) => {
  const [showMenu, setShowMenu] = useState(false);
  const statusConfig = STATUS_CONFIG[archive.status];
  const StatusIcon = statusConfig.icon;

  const isExpiringSoon = () => {
    const retentionDate = new Date(archive.retention_until);
    const now = new Date();
    const diffDays = Math.ceil((retentionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 90;
  };

  return (
    <tr className="hover:bg-advist-bg/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-advist-bg rounded-xl">
            <FileText size={18} className="text-advist-gray900" />
          </div>
          <div>
            <p className="font-medium text-advist-gray900">{archive.title}</p>
            <p className="text-xs text-advist-blue-light">{archive.size}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant="gray" size="sm">
          {archive.original_type}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-advist-gray900">
          <User size={14} />
          {archive.archived_by}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-advist-gray900">
          <Calendar size={14} />
          {new Date(archive.archived_at).toLocaleDateString('fr-FR')}
        </div>
      </td>
      <td className="px-4 py-3">
        <div
          className={`flex items-center gap-2 text-sm ${
            isExpiringSoon() ? 'text-advist-gold-dark' : 'text-advist-gray900'
          }`}
        >
          <Clock size={14} />
          {new Date(archive.retention_until).toLocaleDateString('fr-FR')}
          {isExpiringSoon() && (
            <span className="text-xs bg-advist-gold-light text-advist-gold-dark px-1.5 py-0.5 rounded">
              Bientot
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={statusConfig.color} size="sm">
          <StatusIcon size={12} className="mr-1" />
          {statusConfig.label}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="relative flex items-center justify-end gap-1">
          <button className="p-1.5 rounded hover:bg-advist-bg" title="Voir">
            <Eye size={14} className="text-advist-gray900" />
          </button>
          <button className="p-1.5 rounded hover:bg-advist-bg" title="Telecharger">
            <Download size={14} className="text-advist-gray900" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded hover:bg-advist-bg"
          >
            <MoreVertical size={14} className="text-advist-gray900" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 top-full w-48 bg-white rounded-xl shadow-lg border border-advist-bg py-1 z-10">
                <button
                  onClick={() => {
                    onRestore(archive);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-gray900 hover:bg-advist-bg"
                >
                  <RotateCcw size={14} />
                  Restaurer
                </button>
                {archive.status !== 'legal_hold' && (
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-advist-error hover:bg-advist-gold-light">
                    <Trash2 size={14} />
                    Supprimer definitivement
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// Restore Modal
const RestoreModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  archive: ArchivedDocument;
}> = ({ isOpen, onClose, archive }) => {
  const [destination, setDestination] = useState('original');

  const handleRestore = () => {
    console.error('Restoring:', archive.id, 'to:', destination);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restaurer le document">
      <div className="space-y-4">
        <div className="p-4 bg-advist-bg/50 rounded-xl">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-advist-gray900" />
            <div>
              <p className="font-medium text-advist-gray900">{archive.title}</p>
              <p className="text-sm text-advist-gray900">
                Archive le {new Date(archive.archived_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-2">
            Destination de la restauration
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-advist-bg rounded-xl cursor-pointer hover:bg-advist-bg/30">
              <input
                type="radio"
                name="destination"
                value="original"
                checked={destination === 'original'}
                onChange={(e) => setDestination(e.target.value)}
                className="text-advist-gray900 focus:ring-advist-gold"
              />
              <div>
                <p className="font-medium text-advist-gray900">Emplacement d'origine</p>
                <p className="text-sm text-advist-gray900">
                  Restaurer le document a son emplacement initial
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-advist-bg rounded-xl cursor-pointer hover:bg-advist-bg/30">
              <input
                type="radio"
                name="destination"
                value="documents"
                checked={destination === 'documents'}
                onChange={(e) => setDestination(e.target.value)}
                className="text-advist-gray900 focus:ring-advist-gold"
              />
              <div>
                <p className="font-medium text-advist-gray900">Mes documents</p>
                <p className="text-sm text-advist-gray900">
                  Restaurer dans votre dossier personnel
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-advist-gold-light rounded-xl">
          <AlertTriangle size={18} className="text-advist-gold-dark" />
          <p className="text-sm text-advist-gold-dark">
            Le document sera retire des archives et accessible normalement
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-advist-bg">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleRestore}>
            <RotateCcw size={16} className="mr-2" />
            Restaurer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ArchivesPage;
