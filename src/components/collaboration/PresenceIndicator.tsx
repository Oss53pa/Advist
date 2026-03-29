/**
 * Presence Indicator Component
 * Shows avatars of users currently viewing the document
 */
import React from 'react';
import { Users, Eye, Edit3 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Participant } from '../../hooks/useDocumentCollaboration';

interface PresenceIndicatorProps {
  participants: Participant[];
  maxVisible?: number;
  showStatus?: boolean;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  participants,
  maxVisible = 4,
  showStatus = true,
}) => {
  const visibleParticipants = participants.slice(0, maxVisible);
  const remainingCount = Math.max(0, participants.length - maxVisible);

  if (participants.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-advist-text-secondary">
        <Users size={16} />
        <span>Vous êtes seul sur ce document</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Avatars Stack */}
      <div className="flex -space-x-2">
        {visibleParticipants.map((participant) => (
          <div
            key={participant.id}
            className="relative"
            title={`${participant.name}${participant.isEditing ? ' (édite)' : ''}`}
          >
            <Avatar
              name={participant.name}
              src={participant.avatar}
              size="sm"
              className="ring-2 ring-white"
            />
            {/* Status indicator dot */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
              style={{ backgroundColor: participant.color }}
            />
            {/* Editing indicator */}
            {participant.isEditing && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-advist-gold rounded-full flex items-center justify-center">
                <Edit3 size={10} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-advist-border flex items-center justify-center text-xs font-medium text-advist-text-secondary ring-2 ring-white">
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Participant count */}
      <div className="flex items-center gap-1.5 text-sm text-advist-text-secondary">
        <Eye size={14} />
        <span>
          {participants.length} {participants.length > 1 ? 'personnes' : 'personne'}
        </span>
      </div>

      {/* Status breakdown */}
      {showStatus && (
        <div className="flex items-center gap-3 text-xs text-advist-text-secondary border-l border-advist-border pl-3">
          {participants.filter((p) => p.isEditing).length > 0 && (
            <span className="flex items-center gap-1 text-advist-gold-dark">
              <Edit3 size={12} />
              {participants.filter((p) => p.isEditing).length} édite
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Compact version for toolbar
 */
export const PresenceIndicatorCompact: React.FC<PresenceIndicatorProps> = ({
  participants,
  maxVisible = 3,
}) => {
  const visibleParticipants = participants.slice(0, maxVisible);
  const remainingCount = Math.max(0, participants.length - maxVisible);

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {visibleParticipants.map((participant) => (
          <div
            key={participant.id}
            className="relative"
            title={participant.name}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ring-1 ring-white/50"
              style={{ backgroundColor: participant.color }}
            >
              {participant.name.charAt(0).toUpperCase()}
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-6 h-6 rounded-full bg-advist-surface-dark flex items-center justify-center text-white text-xs font-medium ring-1 ring-white/50">
            +{remainingCount}
          </div>
        )}
      </div>
      {participants.length > 0 && (
        <span className="text-xs text-advist-text-secondary">
          {participants.length} en ligne
        </span>
      )}
    </div>
  );
};

export default PresenceIndicator;
