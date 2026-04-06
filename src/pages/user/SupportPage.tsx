import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Headphones,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  ChevronRight,
  Loader2,
  Pause,
  XCircle,
} from 'lucide-react';
import { Button, Modal, Input } from '../../components/ui';
import type {
  SupportTicket,
  SupportMessage,
  SupportTicketCategory,
  _SupportTicketPriority,
  SupportTicketStatus,
} from '../../types';

// Mock data
const mockUserTickets: SupportTicket[] = [
  {
    id: '1',
    ticket_id: 'SUP-A1B2C3D4',
    title: 'Probleme de connexion',
    description: "Je n'arrive plus a me connecter depuis ce matin.",
    category: 'technical',
    priority: 'high',
    status: 'in_progress',
    organization: '1',
    organization_name: 'Mon Organisation',
    created_by: '1',
    created_by_name: 'Moi',
    created_at: '2024-12-29T08:30:00Z',
    updated_at: '2024-12-29T10:00:00Z',
    messages_count: 2,
  },
  {
    id: '2',
    ticket_id: 'SUP-E5F6G7H8',
    title: 'Question sur les workflows',
    description: 'Comment creer un workflow avec plusieurs etapes ?',
    category: 'general',
    priority: 'low',
    status: 'resolved',
    organization: '1',
    organization_name: 'Mon Organisation',
    created_by: '1',
    created_by_name: 'Moi',
    created_at: '2024-12-25T14:20:00Z',
    updated_at: '2024-12-27T09:15:00Z',
    resolved_at: '2024-12-27T09:15:00Z',
    messages_count: 4,
  },
];

const mockMessages: SupportMessage[] = [
  {
    id: '1',
    ticket: '1',
    author: '1',
    author_name: 'Moi',
    author_email: 'moi@example.com',
    content:
      'Je n\'arrive plus a me connecter depuis ce matin. Le message d\'erreur indique "Identifiants invalides".',
    is_internal: false,
    created_at: '2024-12-29T08:30:00Z',
  },
  {
    id: '2',
    ticket: '1',
    author: 'admin',
    author_name: 'Support ADVIST',
    author_email: 'support@advist.com',
    content:
      'Bonjour, merci pour votre signalement. Nous avons identifie le probleme et travaillons sur une solution. Pouvez-vous essayer de reinitialiser votre mot de passe en attendant ?',
    is_internal: false,
    created_at: '2024-12-29T10:00:00Z',
  },
];

export const UserSupportPage: React.FC = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<SupportTicket[]>(mockUserTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Create form
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'general' as SupportTicketCategory,
  });

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

  const getCategoryLabel = (category: SupportTicketCategory) => {
    switch (category) {
      case 'technical':
        return t('support.category.technical');
      case 'billing':
        return t('support.category.billing');
      case 'general':
        return t('support.category.general');
      default:
        return category;
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
    setMessages(mockMessages.filter((m) => m.ticket === ticket.id));
    setShowDetailModal(true);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const message: SupportMessage = {
      id: Date.now().toString(),
      ticket: selectedTicket.id,
      author: '1',
      author_name: 'Moi',
      author_email: 'moi@example.com',
      content: newMessage,
      is_internal: false,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleCreateTicket = () => {
    const newTicket: SupportTicket = {
      id: Date.now().toString(),
      ticket_id: `SUP-${Date.now().toString(36).toUpperCase()}`,
      title: createForm.title,
      description: createForm.description,
      category: createForm.category,
      priority: 'medium',
      status: 'new',
      organization: '1',
      organization_name: 'Mon Organisation',
      created_by: '1',
      created_by_name: 'Moi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages_count: 0,
    };

    setTickets([newTicket, ...tickets]);
    setShowCreateModal(false);
    setCreateForm({ title: '', description: '', category: 'general' });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">{t('support.title')}</h1>
          <p className="text-advist-blue-light mt-1">{t('support.userSubtitle')}</p>
        </div>

        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={18} className="mr-2" />
          {t('support.newTicket')}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-advist-bg text-center">
          <p className="text-2xl font-bold text-advist-gray900">{tickets.length}</p>
          <p className="text-sm text-advist-blue-light">{t('support.myTickets')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-advist-bg text-center">
          <p className="text-2xl font-bold text-advist-gold-dark">
            {tickets.filter((tk) => tk.status === 'in_progress' || tk.status === 'new').length}
          </p>
          <p className="text-sm text-advist-blue-light">{t('support.stats.inProgress')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-advist-bg text-center">
          <p className="text-2xl font-bold text-advist-success">
            {tickets.filter((tk) => tk.status === 'resolved').length}
          </p>
          <p className="text-sm text-advist-blue-light">{t('support.stats.resolved')}</p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-advist-bg p-8 text-center">
            <Headphones size={48} className="mx-auto text-advist-blue-light mb-4" />
            <p className="text-advist-gray900 font-medium">{t('support.noTickets')}</p>
            <p className="text-sm text-advist-blue-light mt-1">
              {t('support.noTicketsDescription')}
            </p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} className="mr-2" />
              {t('support.createTicket')}
            </Button>
          </div>
        ) : (
          tickets.map((ticket) => {
            const status = getStatusInfo(ticket.status);

            return (
              <div
                key={ticket.id}
                onClick={() => handleViewTicket(ticket)}
                className="bg-white rounded-xl border border-advist-bg p-4 hover:shadow-card transition-all duration-240 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-advist-blue-light">
                        {ticket.ticket_id}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${status.bg} ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <h3 className="font-medium text-advist-gray900">{ticket.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-advist-blue-light">
                      <span>{getCategoryLabel(ticket.category)}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDate(ticket.created_at)}
                      </span>
                      {ticket.messages_count ? (
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          {ticket.messages_count} messages
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-advist-blue-light" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedTicket?.ticket_id || ''}
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-4">
            {/* Header */}
            <div className="p-4 bg-advist-bg rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-advist-gray900">{selectedTicket.title}</h3>
                  <p className="text-sm text-advist-blue-light mt-1">
                    {getCategoryLabel(selectedTicket.category)} -{' '}
                    {formatDate(selectedTicket.created_at)}
                  </p>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-lg ${getStatusInfo(selectedTicket.status).bg}`}
                >
                  <span
                    className={`text-sm font-medium ${getStatusInfo(selectedTicket.status).color}`}
                  >
                    {getStatusInfo(selectedTicket.status).label}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-advist-gray900 mb-2">
                {t('common.description')}
              </h4>
              <p className="text-sm text-advist-gray900 p-3 bg-advist-bg/50 rounded-xl">
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
                    {t('support.waitingForResponse')}
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-xl ${
                        message.author === 'admin' ? 'bg-advist-gold-light' : 'bg-advist-bg'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-advist-gray900">
                          {message.author === 'admin' ? t('support.supportTeam') : t('support.you')}
                        </span>
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
            {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
              <div className="border-t border-advist-bg pt-4">
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('support.writeMessagePlaceholder')}
                    className="flex-1 px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold resize-none"
                    rows={2}
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('support.newTicket')}
      >
        <div className="space-y-4">
          <Input
            label={t('support.form.title')}
            placeholder={t('support.form.userTitlePlaceholder')}
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
              placeholder={t('support.form.userDescriptionPlaceholder')}
              className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold resize-none"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1.5">
              {t('support.form.category')}
            </label>
            <select
              value={createForm.category}
              onChange={(e) =>
                setCreateForm({ ...createForm, category: e.target.value as SupportTicketCategory })
              }
              className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
            >
              <option value="technical">{t('support.categoryOptions.technical')}</option>
              <option value="billing">{t('support.categoryOptions.billing')}</option>
              <option value="general">{t('support.categoryOptions.general')}</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-advist-bg">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={!createForm.title || !createForm.description}
            >
              <Plus size={16} className="mr-2" />
              {t('common.send')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserSupportPage;
