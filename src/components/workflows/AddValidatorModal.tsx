import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  Search,
  User,
  Users,
  Building2,
  Check,
  X,
  Loader2,
  Mail,
  Phone,
  AlertTriangle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import api from '../../services/api';

export interface Validator {
  id: number;
  type: 'user' | 'role' | 'department';
  name: string;
  email?: string;
  avatar?: string;
  department?: string;
}

export interface ExternalValidator {
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
}

interface AddValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: number;
  currentStepId?: string;
  onValidatorAdded?: (validator: Validator | ExternalValidator) => void;
}

type InsertPosition = 'current' | 'next' | 'end';

export const AddValidatorModal: React.FC<AddValidatorModalProps> = ({
  isOpen,
  onClose,
  workflowId,
  currentStepId,
  onValidatorAdded,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'user' | 'role' | 'department' | 'external'>('user');
  const [users, setUsers] = useState<Validator[]>([]);
  const [roles, setRoles] = useState<Validator[]>([]);
  const [departments, setDepartments] = useState<Validator[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [insertPosition, setInsertPosition] = useState<InsertPosition>('next');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // External validator form
  const [externalValidator, setExternalValidator] = useState<ExternalValidator>({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
  });

  // Step configuration
  const [stepConfig, setStepConfig] = useState({
    type: 'validation' as 'consultation' | 'validation' | 'approval' | 'signature',
    deadlineDays: 3,
    canDelegate: true,
    message: '',
  });

  // Fetch available validators
  useEffect(() => {
    if (isOpen) {
      fetchValidators();
    }
  }, [isOpen]);

  const fetchValidators = async () => {
    setIsLoading(true);
    try {
      // Fetch users, roles, and departments
      const [usersRes, rolesRes, deptsRes] = await Promise.all([
        api.get('/users/'),
        api.get('/roles/'),
        api.get('/departments/'),
      ]);

      setUsers(usersRes.data.results?.map((u: any) => ({
        id: u.id,
        type: 'user' as const,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        department: u.department?.name,
      })) || []);

      setRoles(rolesRes.data.results?.map((r: any) => ({
        id: r.id,
        type: 'role' as const,
        name: r.name,
      })) || []);

      setDepartments(deptsRes.data.results?.map((d: any) => ({
        id: d.id,
        type: 'department' as const,
        name: d.name,
      })) || []);
    } catch (err) {
      console.error('Failed to fetch validators:', err);
      // Use mock data for development
      setUsers([
        { id: 1, type: 'user', name: 'Jean Dupont', email: 'jean.dupont@example.com', department: 'Finance' },
        { id: 2, type: 'user', name: 'Marie Martin', email: 'marie.martin@example.com', department: 'RH' },
        { id: 3, type: 'user', name: 'Pierre Bernard', email: 'pierre.bernard@example.com', department: 'Direction' },
      ]);
      setRoles([
        { id: 1, type: 'role', name: 'Manager' },
        { id: 2, type: 'role', name: 'Directeur' },
        { id: 3, type: 'role', name: 'Validateur Finance' },
      ]);
      setDepartments([
        { id: 1, type: 'department', name: 'Direction Générale' },
        { id: 2, type: 'department', name: 'Finance' },
        { id: 3, type: 'department', name: 'Ressources Humaines' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter validators based on search
  const getFilteredValidators = (): Validator[] => {
    let list: Validator[] = [];
    switch (searchType) {
      case 'user':
        list = users;
        break;
      case 'role':
        list = roles;
        break;
      case 'department':
        list = departments;
        break;
      default:
        return [];
    }

    if (!searchTerm) return list;
    return list.filter(v =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Add validator to workflow
  const handleAddValidator = async () => {
    setError(null);
    setIsAdding(true);

    try {
      let validatorData: any;

      if (searchType === 'external') {
        // Validate external validator
        if (!externalValidator.email || !externalValidator.firstName || !externalValidator.lastName) {
          setError('Veuillez remplir tous les champs obligatoires');
          setIsAdding(false);
          return;
        }

        validatorData = {
          type: 'external',
          external: externalValidator,
        };
      } else {
        if (!selectedValidator) {
          setError('Veuillez sélectionner un validateur');
          setIsAdding(false);
          return;
        }

        validatorData = {
          type: selectedValidator.type,
          id: selectedValidator.id,
          name: selectedValidator.name,
        };
      }

      // Call API to add validator
      await api.post(`/workflows/${workflowId}/add-validator/`, {
        validator: validatorData,
        insert_position: insertPosition,
        current_step_id: currentStepId,
        step_config: {
          type: stepConfig.type,
          deadline_days: stepConfig.deadlineDays,
          can_delegate: stepConfig.canDelegate,
          message: stepConfig.message,
        },
      });

      // Notify parent
      if (onValidatorAdded) {
        onValidatorAdded(searchType === 'external' ? externalValidator : selectedValidator!);
      }

      // Reset and close
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Failed to add validator:', err);
      setError(err.response?.data?.message || 'Impossible d\'ajouter le validateur');
    } finally {
      setIsAdding(false);
    }
  };

  const resetForm = () => {
    setSelectedValidator(null);
    setSearchTerm('');
    setSearchType('user');
    setInsertPosition('next');
    setExternalValidator({
      email: '',
      firstName: '',
      lastName: '',
      company: '',
      phone: '',
    });
    setStepConfig({
      type: 'validation',
      deadlineDays: 3,
      canDelegate: true,
      message: '',
    });
    setError(null);
  };

  const getTypeIcon = (type: 'user' | 'role' | 'department') => {
    switch (type) {
      case 'user':
        return <User size={16} />;
      case 'role':
        return <Users size={16} />;
      case 'department':
        return <Building2 size={16} />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Ajouter un validateur"
      size="lg"
    >
      <div className="space-y-6">
        {/* Error */}
        {error && (
          <div className="p-3 bg-advist-gold-light border border-advist-gold rounded-lg flex items-center gap-2 text-advist-error">
            <AlertTriangle size={16} />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-2">
            Type de validateur
          </label>
          <div className="flex gap-2">
            {[
              { value: 'user', label: 'Utilisateur', icon: User },
              { value: 'role', label: 'Rôle', icon: Users },
              { value: 'department', label: 'Département', icon: Building2 },
              { value: 'external', label: 'Externe', icon: Mail },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setSearchType(value as any);
                  setSelectedValidator(null);
                }}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors
                  ${searchType === value
                    ? 'bg-advist-dark text-white'
                    : 'bg-advist-bg text-advist-gray900 hover:bg-advist-border'
                  }
                `}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search / External Form */}
        {searchType === 'external' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={externalValidator.firstName}
                  onChange={(e) => setExternalValidator(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-2 bg-advist-bg border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={externalValidator.lastName}
                  onChange={(e) => setExternalValidator(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-2 bg-advist-bg border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={externalValidator.email}
                onChange={(e) => setExternalValidator(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 bg-advist-bg border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                placeholder="jean.dupont@external.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-1">
                  Entreprise
                </label>
                <input
                  type="text"
                  value={externalValidator.company}
                  onChange={(e) => setExternalValidator(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-4 py-2 bg-advist-bg border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={externalValidator.phone}
                  onChange={(e) => setExternalValidator(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 bg-advist-bg border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                  placeholder="+225 XX XX XX XX"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-blue-light" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2.5 bg-advist-bg border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
              />
            </div>

            {/* Validators List */}
            <div className="max-h-[200px] overflow-y-auto border border-advist-border rounded-lg divide-y divide-primary-100">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-advist-blue-light" />
                </div>
              ) : getFilteredValidators().length === 0 ? (
                <div className="py-8 text-center text-advist-blue-light">
                  Aucun résultat trouvé
                </div>
              ) : (
                getFilteredValidators().map((validator) => (
                  <button
                    key={`${validator.type}-${validator.id}`}
                    onClick={() => setSelectedValidator(validator)}
                    className={`
                      w-full flex items-center gap-3 p-3 text-left transition-colors
                      ${selectedValidator?.id === validator.id && selectedValidator?.type === validator.type
                        ? 'bg-advist-gold-light/10'
                        : 'hover:bg-advist-bg'
                      }
                    `}
                  >
                    <div className="p-2 bg-advist-bg rounded-lg">
                      {getTypeIcon(validator.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-advist-gray900 truncate">{validator.name}</p>
                      {validator.email && (
                        <p className="text-xs text-advist-blue-light truncate">{validator.email}</p>
                      )}
                      {validator.department && (
                        <p className="text-xs text-advist-blue-light">{validator.department}</p>
                      )}
                    </div>
                    {selectedValidator?.id === validator.id && selectedValidator?.type === validator.type && (
                      <Check size={20} className="text-advist-success" />
                    )}
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {/* Insert Position */}
        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-2">
            Position dans le circuit
          </label>
          <div className="flex gap-2">
            {[
              { value: 'current', label: 'Étape actuelle', description: 'Ajouter à l\'étape en cours' },
              { value: 'next', label: 'Étape suivante', description: 'Créer une nouvelle étape après' },
              { value: 'end', label: 'Fin du circuit', description: 'Ajouter à la fin' },
            ].map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => setInsertPosition(value as InsertPosition)}
                className={`
                  flex-1 p-3 rounded-lg text-left transition-colors
                  ${insertPosition === value
                    ? 'bg-advist-dark text-white'
                    : 'bg-advist-bg text-advist-gray900 hover:bg-advist-border'
                  }
                `}
              >
                <p className="font-medium text-sm">{label}</p>
                <p className={`text-xs mt-0.5 ${insertPosition === value ? 'text-white/70' : 'text-advist-blue-light'}`}>
                  {description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Step Configuration */}
        <div className="p-4 bg-advist-bg rounded-xl space-y-4">
          <h4 className="font-medium text-advist-gray900">Configuration de l'étape</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1">
                Type d'action
              </label>
              <select
                value={stepConfig.type}
                onChange={(e) => setStepConfig(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-4 py-2 bg-white border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
              >
                <option value="consultation">Consultation</option>
                <option value="validation">Validation</option>
                <option value="approval">Approbation</option>
                <option value="signature">Signature</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1">
                <Clock size={14} className="inline mr-1" />
                Délai (jours)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={stepConfig.deadlineDays}
                onChange={(e) => setStepConfig(prev => ({ ...prev, deadlineDays: parseInt(e.target.value) || 3 }))}
                className="w-full px-4 py-2 bg-white border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stepConfig.canDelegate}
                onChange={(e) => setStepConfig(prev => ({ ...prev, canDelegate: e.target.checked }))}
                className="w-4 h-4 rounded border-advist-border text-advist-gray900 focus:ring-advist-blue-light"
              />
              <span className="text-sm text-advist-gray900">Permettre la délégation</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-1">
              Message pour le validateur (optionnel)
            </label>
            <textarea
              value={stepConfig.message}
              onChange={(e) => setStepConfig(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Instructions ou contexte pour le nouveau validateur..."
              rows={2}
              className="w-full px-4 py-2 bg-white border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-advist-border">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isAdding}
          >
            Annuler
          </Button>
          <Button
            className="flex-1"
            onClick={handleAddValidator}
            disabled={isAdding || (searchType !== 'external' && !selectedValidator)}
          >
            {isAdding ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Ajout en cours...
              </>
            ) : (
              <>
                <UserPlus size={16} className="mr-2" />
                Ajouter le validateur
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddValidatorModal;
