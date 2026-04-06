import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Headphones,
  Search,
  Plus,
  MoreVertical,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Send,
  User,
  Building2,
  _Filter,
  RefreshCw,
  Loader2,
  _ChevronDown,
  AlertCircle,
  Pause,
  _X,
} from 'lucide-react';
import { Button, Modal, Input } from '../../components/ui';
import type {
  SupportTicket,
  SupportMessage,
  SupportTicketStats,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../../types';

// Mock data for development
const mockTickets: SupportTicket[] = [
  {
    id: '1',
    ticket_id: 'SUP-A1B2C3D4',
    title: "Probleme de connexion a l'application",
    description:
      'Je n\'arrive plus a me connecter depuis ce matin. Le message d\'erreur indique "Identifiants invalides" mais je suis sur de mon mot de passe.',
    category: 'technical',
    priority: 'high',
    status: 'new',
    organization: '1',
    organization_name: 'ADVIST Demo',
    created_by: '1',
    created_by_name: 'Jean Kouassi',
    created_by_email: 'jean.kouassi@advist-demo.com',
    created_at: '2024-12-29T08:30:00Z',
    updated_at: '2024-12-29T08:30:00Z',
    messages_count: 0,
  },
  {
    id: '2',
    ticket_id: 'SUP-E5F6G7H8',
    title: 'Question sur la facturation',
    description:
      'Je souhaite passer du plan Starter au plan Business. Comment proceder et quand le changement sera-t-il effectif ?',
    category: 'billing',
    priority: 'medium',
    status: 'in_progress',
    organization: '2',
    organization_name: 'Societe Generale CI',
    created_by: '2',
    created_by_name: 'Marie Diallo',
    created_by_email: 'marie.diallo@sgci.ci',
    assigned_to: 'admin',
    assigned_to_name: 'Support ADVIST',
    created_at: '2024-12-28T14:20:00Z',
    updated_at: '2024-12-29T09:15:00Z',
    messages_count: 2,
  },
  {
    id: '3',
    ticket_id: 'SUP-I9J0K1L2',
    title: 'Demande de formation',
    description:
      "Notre equipe souhaite une session de formation sur les workflows avances. Est-ce possible d'organiser cela ?",
    category: 'general',
    priority: 'low',
    status: 'waiting',
    organization: '3',
    organization_name: "Orange Cote d'Ivoire",
    created_by: '3',
    created_by_name: 'Amadou Traore',
    created_by_email: 'amadou.traore@orange.ci',
    assigned_to: 'admin',
    assigned_to_name: 'Support ADVIST',
    created_at: '2024-12-27T10:00:00Z',
    updated_at: '2024-12-28T16:30:00Z',
    messages_count: 3,
  },
  {
    id: '4',
    ticket_id: 'SUP-M3N4O5P6',
    title: 'Bug lors de la signature',
    description:
      "Quand je tente de signer un document, l'application se fige et je dois rafraichir la page.",
    category: 'technical',
    priority: 'urgent',
    status: 'in_progress',
    organization: '1',
    organization_name: 'ADVIST Demo',
    created_by: '4',
    created_by_name: 'Sophie Aka',
    created_by_email: 'sophie.aka@advist-demo.com',
    assigned_to: 'admin',
    assigned_to_name: 'Support ADVIST',
    created_at: '2024-12-29T07:00:00Z',
    updated_at: '2024-12-29T10:00:00Z',
    messages_count: 1,
  },
  {
    id: '5',
    ticket_id: 'SUP-Q7R8S9T0',
    title: 'Demande de remboursement',
    description:
      'Suite a un double prelevement sur notre compte, nous demandons le remboursement du montant en trop.',
    category: 'billing',
    priority: 'high',
    status: 'resolved',
    organization: '4',
    organization_name: 'Cabinet Juridique Kouassi',
    created_by: '5',
    created_by_name: 'Paul Kouassi',
    created_by_email: 'paul.kouassi@cjk.ci',
    assigned_to: 'admin',
    assigned_to_name: 'Support ADVIST',
    created_at: '2024-12-25T09:00:00Z',
    updated_at: '2024-12-28T11:00:00Z',
    resolved_at: '2024-12-28T11:00:00Z',
    messages_count: 5,
  },
];

const mockMessages: SupportMessage[] = [
  {
    id: '1',
    ticket: '2',
    author: '2',
    author_name: 'Marie Diallo',
    author_email: 'marie.diallo@sgci.ci',
    content:
      "Bonjour, je souhaite passer du plan Starter au plan Business. Pouvez-vous m'indiquer la procedure ?",
    is_internal: false,
    created_at: '2024-12-28T14:20:00Z',
  },
  {
    id: '2',
    ticket: '2',
    author: 'admin',
    author_name: 'Support ADVIST',
    author_email: 'support@advist.com',
    content:
      'Bonjour Marie, merci pour votre message. Pour passer au plan Business, vous pouvez vous rendre dans Parametres > Abonnement et cliquer sur "Changer de plan". Le changement sera effectif immediatement et la facturation sera proratisee.',
    is_internal: false,
    created_at: '2024-12-29T09:15:00Z',
  },
];

export const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [_isLoading, _setIsLoading] = useState(false);

  // Create ticket form state
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'general' as SupportTicketCategory,
    priority: 'medium' as SupportTicketPriority,
    organization: '',
  });

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.created_by_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Stats
  const stats: SupportTicketStats = {
    total: tickets.length,
    new: tickets.filter((t) => t.status === 'new').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    waiting: tickets.filter((t) => t.status === 'waiting').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
    by_priority: {
      low: tickets.filter((t) => t.priority === 'low').length,
      medium: tickets.filter((t) => t.priority === 'medium').length,
      high: tickets.filter((t) => t.priority === 'high').length,
      urgent: tickets.filter((t) => t.priority === 'urgent').length,
    },
    by_category: {
      technical: tickets.filter((t) => t.category === 'technical').length,
      billing: tickets.filter((t) => t.category === 'billing').length,
      general: tickets.filter((t) => t.category === 'general').length,
    },
  };

  const getStatusInfo = (status: SupportTicketStatus) => {
    switch (status) {
      case 'new':
        return {
          icon: AlertCircle,
          color: 'text-primary-900',
          bg: 'bg-primary-50',
          label: t('support.status.new'),
        };
      case 'in_progress':
        return {
          icon: Loader2,
          color: 'text-advist-gold-dark',
          bg: 'bg-advist-gold-light',
          label: t('support.status.inProgress'),
        };
      case 'waiting':
        return {
          icon: Pause,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          label: t('support.status.waiting'),
        };
      case 'resolved':
        return {
          icon: CheckCircle,
          color: 'text-advist-success',
          bg: 'bg-green-50',
          label: t('support.status.resolved'),
        };
      case 'closed':
        return {
          icon: XCircle,
          color: 'text-primary-500',
          bg: 'bg-primary-100',
          label: t('support.status.closed'),
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-primary-500',
          bg: 'bg-primary-100',
          label: status,
        };
    }
  };

  const getPriorityInfo = (priority: SupportTicketPriority) => {
    switch (priority) {
      case 'urgent':
        return {
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: t('support.priority.urgent'),
        };
      case 'high':
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          label: t('support.priority.high'),
        };
      case 'medium':
        return {
          color: 'text-advist-gold-dark',
          bg: 'bg-advist-gold-light',
          border: 'border-advist-gold',
          label: t('support.priority.medium'),
        };
      case 'low':
        return {
          color: 'text-primary-600',
          bg: 'bg-primary-50',
          border: 'border-primary-200',
          label: t('support.priority.low'),
        };
      default:
        return {
          color: 'text-primary-600',
          bg: 'bg-primary-50',
          border: 'border-primary-200',
          label: priority,
        };
    }
  };

  const getCategoryInfo = (category: SupportTicketCategory) => {
    switch (category) {
      case 'technical':
        return {
          label: t('support.category.technical'),
          color: 'text-primary-900',
          bg: 'bg-primary-50',
        };
      case 'billing':
        return { label: t('support.category.billing'), color: 'text-green-600', bg: 'bg-green-50' };
      case 'general':
        return {
          label: t('support.category.general'),
          color: 'text-primary-900',
          bg: 'bg-primary-50',
        };
      default:
        return { label: category, color: 'text-primary-600', bg: 'bg-primary-50' };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    // Load messages for this ticket
    setMessages(mockMessages.filter((m) => m.ticket === ticket.id));
    setShowDetailModal(true);
  };

  const handleChangeStatus = (ticketId: string, newStatus: SupportTicketStatus) => {
    setTickets(
      tickets.map((t) =>
        t.id === ticketId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
      )
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const message: SupportMessage = {
      id: Date.now().toString(),
      ticket: selectedTicket.id,
      author: 'admin',
      author_name: 'Support ADVIST',
      author_email: 'support@advist.com',
      content: newMessage,
      is_internal: isInternalNote,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setIsInternalNote(false);

    // Update ticket
    setTickets(
      tickets.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              messages_count: (t.messages_count || 0) + 1,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const handleCreateTicket = () => {
    const newTicket: SupportTicket = {
      id: Date.now().toString(),
      ticket_id: `SUP-${Date.now().toString(36).toUpperCase()}`,
      title: createForm.title,
      description: createForm.description,
      category: createForm.category,
      priority: createForm.priority,
      status: 'new',
      organization: createForm.organization || '1',
      organization_name: 'Organisation',
      created_by: 'admin',
      created_by_name: 'Support ADVIST',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages_count: 0,
    };

    setTickets([newTicket, ...tickets]);
    setShowCreateModal(false);
    setCreateForm({
      title: '',
      description: '',
      category: 'general',
      priority: 'medium',
      organization: '',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">{t('support.title')}</h1>
          <p className="text-advist-blue-light mt-1">{t('support.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setTickets([...mockTickets])}>
            <RefreshCw size={18} className="mr-2" />
            {t('common.refresh')}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={18} className="mr-2" />
            {t('support.newTicket')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-advist-gold-light rounded-xl">
              <Headphones size={20} className="text-advist-gray900" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.total}</p>
              <p className="text-sm text-advist-blue-light">{t('common.total')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-xl">
              <AlertCircle size={20} className="text-primary-900" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.new}</p>
              <p className="text-sm text-advist-blue-light">{t('support.stats.new')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-advist-gold-light rounded-xl">
              <Clock size={20} className="text-advist-gold-dark" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.in_progress}</p>
              <p className="text-sm text-advist-blue-light">{t('support.stats.inProgress')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-xl">
              <Pause size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.waiting}</p>
              <p className="text-sm text-advist-blue-light">{t('support.stats.waiting')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl">
              <CheckCircle size={20} className="text-advist-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.resolved}</p>
              <p className="text-sm text-advist-blue-light">{t('support.stats.resolved')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-xl">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.by_priority.urgent}</p>
              <p className="text-sm text-advist-blue-light">{t('support.stats.urgent')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-advist-bg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-blue-light"
            />
            <input
              type="text"
              placeholder={t('support.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
            >
              <option value="all">{t('support.filter.allStatuses')}</option>
              <option value="new">{t('support.status.new')}</option>
              <option value="in_progress">{t('support.status.inProgress')}</option>
              <option value="waiting">{t('support.status.waiting')}</option>
              <option value="resolved">{t('support.status.resolved')}</option>
              <option value="closed">{t('support.status.closed')}</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
            >
              <option value="all">{t('support.filter.allPriorities')}</option>
              <option value="urgent">{t('support.priority.urgent')}</option>
              <option value="high">{t('support.priority.high')}</option>
              <option value="medium">{t('support.priority.medium')}</option>
              <option value="low">{t('support.priority.low')}</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
            >
              <option value="all">{t('support.filter.allCategories')}</option>
              <option value="technical">{t('support.category.technical')}</option>
              <option value="billing">{t('support.category.billing')}</option>
              <option value="general">{t('support.category.general')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-advist-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-advist-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  {t('support.table.ticket')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  {t('support.table.organization')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  {t('support.table.category')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  {t('support.table.priority')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  {t('support.table.status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  {t('support.table.date')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-advist-blue-light uppercase">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-advist-bg">
              {filteredTickets.map((ticket) => {
                const status = getStatusInfo(ticket.status);
                const priority = getPriorityInfo(ticket.priority);
                const category = getCategoryInfo(ticket.category);

                return (
                  <tr key={ticket.id} className="hover:bg-advist-bg/50 transition-all duration-240">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-mono text-sm font-medium text-advist-gray900">
                          {ticket.ticket_id}
                        </p>
                        <p className="text-sm text-advist-gray900 mt-0.5 line-clamp-1">
                          {ticket.title}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-advist-blue-light">
                          <User size={12} />
                          <span>{ticket.created_by_name}</span>
                          {ticket.messages_count ? (
                            <span className="flex items-center gap-1 ml-2">
                              <MessageSquare size={12} />
                              {ticket.messages_count}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-advist-dark rounded-lg flex items-center justify-center text-white text-sm font-medium">
                          {ticket.organization_name.charAt(0)}
                        </div>
                        <span className="text-sm text-advist-gray900">
                          {ticket.organization_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-lg ${category.bg} ${category.color}`}
                      >
                        {category.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-lg border ${priority.bg} ${priority.color} ${priority.border}`}
                      >
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${status.bg}`}
                      >
                        <status.icon size={14} className={status.color} />
                        <span className={`text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-advist-gray900">{formatDate(ticket.created_at)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                          title={t('common.viewDetails')}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" title={t('common.moreOptions')}>
                          <MoreVertical size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-8 text-center">
            <Headphones size={48} className="mx-auto text-advist-blue-light mb-4" />
            <p className="text-advist-gray900 font-medium">{t('support.noTicketsFound')}</p>
            <p className="text-sm text-advist-blue-light mt-1">
              {t('support.noTicketsFoundDescription')}
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-advist-bg">
          <p className="text-sm text-advist-blue-light">
            {t('support.showingTickets', {
              showing: filteredTickets.length,
              total: tickets.length,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled>
              {t('common.previous')}
            </Button>
            <Button variant="ghost" size="sm" disabled>
              {t('common.next')}
            </Button>
          </div>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedTicket?.ticket_id || ''}
        size="xl"
      >
        {selectedTicket && (
          <div className="space-y-6">
            {/* Header */}
            <div className="p-4 bg-advist-bg rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-advist-gray900">
                    {selectedTicket.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-lg ${getCategoryInfo(selectedTicket.category).bg} ${getCategoryInfo(selectedTicket.category).color}`}
                    >
                      {getCategoryInfo(selectedTicket.category).label}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-lg border ${getPriorityInfo(selectedTicket.priority).bg} ${getPriorityInfo(selectedTicket.priority).color} ${getPriorityInfo(selectedTicket.priority).border}`}
                    >
                      {getPriorityInfo(selectedTicket.priority).label}
                    </span>
                  </div>
                </div>
                <select
                  value={selectedTicket.status}
                  onChange={(e) =>
                    handleChangeStatus(selectedTicket.id, e.target.value as SupportTicketStatus)
                  }
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${getStatusInfo(selectedTicket.status).bg} ${getStatusInfo(selectedTicket.status).color}`}
                >
                  <option value="new">{t('support.status.new')}</option>
                  <option value="in_progress">{t('support.status.inProgress')}</option>
                  <option value="waiting">{t('support.status.waiting')}</option>
                  <option value="resolved">{t('support.status.resolved')}</option>
                  <option value="closed">{t('support.status.closed')}</option>
                </select>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-advist-bg/50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-advist-blue-light mb-1">
                  <Building2 size={14} />
                  {t('support.organization')}
                </div>
                <p className="font-medium text-advist-gray900">
                  {selectedTicket.organization_name}
                </p>
              </div>
              <div className="p-4 bg-advist-bg/50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-advist-blue-light mb-1">
                  <User size={14} />
                  {t('support.requester')}
                </div>
                <p className="font-medium text-advist-gray900">{selectedTicket.created_by_name}</p>
                <p className="text-sm text-advist-blue-light">{selectedTicket.created_by_email}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-advist-gray900 mb-2">
                {t('common.description')}
              </h4>
              <p className="text-sm text-advist-gray900 p-4 bg-advist-bg/50 rounded-xl">
                {selectedTicket.description}
              </p>
            </div>

            {/* Messages */}
            <div>
              <h4 className="text-sm font-medium text-advist-gray900 mb-3">
                {t('support.conversation')}
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-sm text-advist-blue-light text-center py-4">
                    {t('support.noMessages')}
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-xl ${
                        message.is_internal
                          ? 'bg-yellow-50 border border-yellow-200'
                          : message.author === 'admin'
                            ? 'bg-advist-gold-light'
                            : 'bg-advist-bg'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-advist-gray900">
                            {message.author_name}
                          </span>
                          {message.is_internal && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-200 text-yellow-800 rounded">
                              {t('support.internalNote')}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-advist-blue-light">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-advist-gray900">{message.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply */}
            <div className="border-t border-advist-bg pt-4">
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-advist-gray900">
                    {t('support.internalNoteDescription')}
                  </span>
                </label>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? t('support.addInternalNotePlaceholder')
                      : t('support.writeReplyPlaceholder')
                  }
                  className="flex-1 px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold resize-none"
                  rows={2}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('support.newTicket')}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={t('support.form.title')}
            placeholder={t('support.form.titlePlaceholder')}
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1.5">
              {t('common.description')}
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder={t('support.form.descriptionPlaceholder')}
              className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold resize-none"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1.5">
                {t('support.form.category')}
              </label>
              <select
                value={createForm.category}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    category: e.target.value as SupportTicketCategory,
                  })
                }
                className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
              >
                <option value="technical">{t('support.category.technical')}</option>
                <option value="billing">{t('support.category.billing')}</option>
                <option value="general">{t('support.category.general')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1.5">
                {t('support.form.priority')}
              </label>
              <select
                value={createForm.priority}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    priority: e.target.value as SupportTicketPriority,
                  })
                }
                className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
              >
                <option value="low">{t('support.priority.low')}</option>
                <option value="medium">{t('support.priority.medium')}</option>
                <option value="high">{t('support.priority.high')}</option>
                <option value="urgent">{t('support.priority.urgent')}</option>
              </select>
            </div>
          </div>

          <Input
            label={t('support.form.organizationOptional')}
            placeholder={t('support.form.organizationPlaceholder')}
            value={createForm.organization}
            onChange={(e) => setCreateForm({ ...createForm, organization: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-advist-bg">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={!createForm.title || !createForm.description}
            >
              <Plus size={16} className="mr-2" />
              {t('support.createTicket')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupportPage;
