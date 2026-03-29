import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Camera,
  Save,
  Key,
  Shield,
  Smartphone,
  History,
  LogOut,
  AlertTriangle,
  PenTool,
  Upload,
  Trash2,
  Check,
  Type,
  Edit3,
  Image,
  Star,
  X,
  Stamp,
  FileSignature,
  Paintbrush,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store';
import { ThemeCustomizer } from '../../components/theme';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  location: string;
  bio: string;
}

interface SignatureSpecimen {
  id: string;
  name: string;
  type: 'drawn' | 'typed' | 'uploaded';
  specimenType: 'signature' | 'paraph' | 'visa';
  data: string;
  createdAt: Date;
  isDefault: boolean;
}

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'signature' | 'security' | 'sessions' | 'appearance'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: user?.first_name || 'Jean',
    last_name: user?.last_name || 'Dupont',
    email: user?.email || 'jean.dupont@advist.com',
    phone: '+33 6 12 34 56 78',
    department: 'Direction',
    position: 'Directeur General',
    location: 'Paris, France',
    bio: 'Directeur general chez ADVIST Demo. Passionne par la transformation digitale et l\'optimisation des processus.',
  });

  const tabs = [
    { id: 'profile', label: t('profile.personal', 'Profil'), icon: User },
    { id: 'signature', label: t('signatures.title', 'Signature'), icon: PenTool },
    { id: 'security', label: t('profile.security', 'Sécurité'), icon: Shield },
    { id: 'sessions', label: t('profile.sessions', 'Sessions'), icon: History },
    { id: 'appearance', label: t('settings.appearance', 'Apparence'), icon: Paintbrush },
  ] as const;

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Call API to update profile
      if (updateUser) {
        await updateUser({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          // Add other fields as needed
        });
      }

      setSaveMessage({ type: 'success', text: t('profile.updateSuccess', 'Profil mis à jour avec succès') });
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveMessage({ type: 'error', text: t('profile.updateError', 'Erreur lors de la mise à jour du profil') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">{t('profile.title')}</h1>
          <p className="text-advist-gray900 mt-1">
            {t('profile.subtitle')}
          </p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-[14px] border border-advist-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <Avatar
              name={`${profileData.first_name} ${profileData.last_name}`}
              src={user?.avatar}
              size="xl"
              className="w-24 h-24 text-2xl"
            />
            <button className="absolute bottom-0 right-0 p-2 bg-advist-dark text-white rounded-full hover:bg-advist-dark transition-all duration-240">
              <Camera size={16} />
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-xl font-bold text-advist-gray900">
              {profileData.first_name} {profileData.last_name}
            </h2>
            <p className="text-advist-gray900">{profileData.position}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
              <span className="px-2.5 py-1 bg-advist-gold-light/20 text-advist-gray900 text-xs font-medium rounded-xl">
                {user?.role || 'Administrateur'}
              </span>
              <span className="text-sm text-advist-blue-light">
                {t('profile.memberSince', 'Membre depuis')} {new Date().getFullYear() - 1}
              </span>
            </div>
          </div>
          <Button
            variant={isEditing ? 'primary' : 'outline'}
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {t('common.processing', 'Enregistrement...')}
              </>
            ) : isEditing ? (
              <>
                <Save size={16} className="mr-2" />
                {t('common.save', 'Enregistrer')}
              </>
            ) : (
              t('profile.editProfile', 'Modifier le profil')
            )}
          </Button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          saveMessage.type === 'success'
            ? 'bg-green-50 border border-advist-success text-advist-success'
            : 'bg-advist-gold-light border border-advist-gold text-advist-error'
        }`}>
          {saveMessage.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          {saveMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-advist-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-240
                ${activeTab === tab.id
                  ? 'border-advist-dark text-advist-gray900'
                  : 'border-transparent text-advist-gray900 hover:text-advist-gray900'
                }
              `}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <ProfileTab
          profileData={profileData}
          setProfileData={setProfileData}
          isEditing={isEditing}
        />
      )}
      {activeTab === 'signature' && <SignatureTab userName={`${profileData.first_name} ${profileData.last_name}`} />}
      {activeTab === 'security' && (
        <SecurityTab
          onChangePassword={() => setShowPasswordModal(true)}
          onSetup2FA={() => setShow2FAModal(true)}
          onDeleteAccount={() => setShowDeleteAccountModal(true)}
        />
      )}
      {activeTab === 'sessions' && <SessionsTab />}
      {activeTab === 'appearance' && <AppearanceTab />}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* 2FA Setup Modal */}
      <Setup2FAModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        userEmail={profileData.email}
      />
    </div>
  );
};

// Profile Tab
const ProfileTab: React.FC<{
  profileData: ProfileData;
  setProfileData: (data: ProfileData) => void;
  isEditing: boolean;
}> = ({ profileData, setProfileData, isEditing }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Information */}
      <div className="bg-white rounded-[14px] border border-advist-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
          {t('profile.personal', 'Informations personnelles')}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('auth.firstName', 'Prénom')}
              value={profileData.first_name}
              onChange={(e) =>
                setProfileData({ ...profileData, first_name: e.target.value })
              }
              disabled={!isEditing}
            />
            <Input
              label={t('auth.lastName', 'Nom')}
              value={profileData.last_name}
              onChange={(e) =>
                setProfileData({ ...profileData, last_name: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>
          <Input
            label={t('common.email', 'Email')}
            type="email"
            value={profileData.email}
            onChange={(e) =>
              setProfileData({ ...profileData, email: e.target.value })
            }
            disabled={!isEditing}
          />
          <Input
            label={t('common.phone', 'Téléphone')}
            type="tel"
            value={profileData.phone}
            onChange={(e) =>
              setProfileData({ ...profileData, phone: e.target.value })
            }
            disabled={!isEditing}
          />
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-white rounded-[14px] border border-advist-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
          {t('profile.professional', 'Informations professionnelles')}
        </h3>
        <div className="space-y-4">
          <Input
            label={t('profile.position', 'Poste')}
            value={profileData.position}
            onChange={(e) =>
              setProfileData({ ...profileData, position: e.target.value })
            }
            disabled={!isEditing}
          />
          <Input
            label={t('users.department', 'Département')}
            value={profileData.department}
            onChange={(e) =>
              setProfileData({ ...profileData, department: e.target.value })
            }
            disabled={!isEditing}
          />
          <Input
            label={t('profile.location', 'Localisation')}
            value={profileData.location}
            onChange={(e) =>
              setProfileData({ ...profileData, location: e.target.value })
            }
            disabled={!isEditing}
          />
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-[14px] border border-advist-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-advist-gray900 mb-4">{t('profile.bio', 'Bio')}</h3>
        <textarea
          value={profileData.bio}
          onChange={(e) =>
            setProfileData({ ...profileData, bio: e.target.value })
          }
          disabled={!isEditing}
          rows={4}
          className="w-full px-4 py-3 bg-advist-surface-dark border border-advist-border rounded-[10px] text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold/20 focus:border-advist-dark resize-none disabled:bg-advist-surface-dark disabled:cursor-not-allowed"
          placeholder={t('profile.bioPlaceholder', 'Parlez-nous de vous...')}
        />
      </div>
    </div>
  );
};

// Specimen types configuration
const SPECIMEN_TYPES = [
  {
    id: 'signature' as const,
    label: 'Signature',
    icon: PenTool,
    color: 'bg-advist-dark',
    bgColor: 'bg-advist-gold-light',
    borderColor: 'border-advist-gold',
    description: 'Signature complète pour les documents officiels',
  },
  {
    id: 'paraph' as const,
    label: 'Paraphe',
    icon: FileSignature,
    color: 'bg-advist-gold',
    bgColor: 'bg-advist-gold-light',
    borderColor: 'border-advist-gold',
    description: 'Initiales pour parapher chaque page',
  },
  {
    id: 'visa' as const,
    label: 'Visa',
    icon: Stamp,
    color: 'bg-advist-dark',
    bgColor: 'bg-advist-surface-dark',
    borderColor: 'border-advist-dark',
    description: 'Cachet de validation ou approbation',
  },
];

// Signature Tab
const SignatureTab: React.FC<{ userName: string }> = ({ userName }) => {
  const [specimens, setSpecimens] = useState<SignatureSpecimen[]>([
    {
      id: '1',
      name: 'Signature principale',
      type: 'drawn',
      specimenType: 'signature',
      data: '',
      createdAt: new Date(),
      isDefault: true,
    },
    {
      id: '2',
      name: 'Paraphe',
      type: 'typed',
      specimenType: 'paraph',
      data: '',
      createdAt: new Date(),
      isDefault: true,
    },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [selectedSpecimenType, setSelectedSpecimenType] = useState<'signature' | 'paraph' | 'visa'>('signature');
  const [activeSpecimenTab, setActiveSpecimenTab] = useState<'signature' | 'paraph' | 'visa'>('signature');

  const handleSetDefault = (id: string, specimenType: 'signature' | 'paraph' | 'visa') => {
    setSpecimens(specimens.map(spec => ({
      ...spec,
      isDefault: spec.specimenType === specimenType ? spec.id === id : spec.isDefault,
    })));
  };

  const handleDelete = (id: string) => {
    setSpecimens(specimens.filter(spec => spec.id !== id));
  };

  const handleCreateSpecimen = (data: string, type: 'drawn' | 'typed' | 'uploaded') => {
    const specimenConfig = SPECIMEN_TYPES.find(s => s.id === selectedSpecimenType);
    const existingOfType = specimens.filter(s => s.specimenType === selectedSpecimenType);

    const newSpecimen: SignatureSpecimen = {
      id: Date.now().toString(),
      name: `${specimenConfig?.label} ${existingOfType.length + 1}`,
      type,
      specimenType: selectedSpecimenType,
      data,
      createdAt: new Date(),
      isDefault: existingOfType.length === 0,
    };
    setSpecimens([...specimens, newSpecimen]);
    setShowCreateModal(false);
  };

  const openCreateModal = (specimenType: 'signature' | 'paraph' | 'visa') => {
    setSelectedSpecimenType(specimenType);
    setCreateMode('draw');
    setShowCreateModal(true);
  };

  const filteredSpecimens = specimens.filter(s => s.specimenType === activeSpecimenTab);
  const activeConfig = SPECIMEN_TYPES.find(s => s.id === activeSpecimenTab);

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-advist-gold-light/20 rounded-[14px] border border-advist-gold/30 p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-advist-gold-light/30 rounded-xl">
            <PenTool size={20} className="text-advist-gray900" />
          </div>
          <div>
            <h3 className="font-semibold text-advist-gray900">Spécimens de signature</h3>
            <p className="text-sm text-advist-gray900 mt-1">
              Gérez vos signatures, paraphes et visas pour la signature électronique de documents.
              Vous pouvez créer plusieurs spécimens de chaque type et définir un par défaut.
            </p>
          </div>
        </div>
      </div>

      {/* Specimen Type Tabs */}
      <div className="flex gap-2 p-1 bg-advist-surface-dark rounded-xl">
        {SPECIMEN_TYPES.map((type) => {
          const count = specimens.filter(s => s.specimenType === type.id).length;
          return (
            <button
              key={type.id}
              onClick={() => setActiveSpecimenTab(type.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                activeSpecimenTab === type.id
                  ? 'bg-advist-dark text-white shadow-md'
                  : 'text-advist-gray900 hover:bg-advist-surface-dark'
              }`}
            >
              <type.icon size={18} />
              <span>{type.label}</span>
              {count > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeSpecimenTab === type.id
                    ? 'bg-white/20 text-white'
                    : 'bg-advist-dark/10 text-advist-gray900'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Type Description */}
      <div className={`p-4 rounded-xl ${activeConfig?.bgColor} ${activeConfig?.borderColor} border`}>
        <div className="flex items-center gap-3">
          {activeConfig && <activeConfig.icon size={20} className="text-advist-gray900" />}
          <div>
            <h4 className="font-medium text-advist-gray900">{activeConfig?.label}</h4>
            <p className="text-sm text-advist-gray900">{activeConfig?.description}</p>
          </div>
        </div>
      </div>

      {/* Specimens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Add New Specimen Card */}
        <button
          onClick={() => openCreateModal(activeSpecimenTab)}
          className="flex flex-col items-center justify-center gap-3 p-8 bg-white rounded-[14px] border-2 border-dashed border-advist-border hover:border-advist-dark hover:bg-advist-gold-light/20/30 transition-all group min-h-[200px]"
        >
          <div className="p-4 bg-advist-surface-dark rounded-full group-hover:bg-advist-gold-light/20 transition-all duration-240">
            {activeConfig && <activeConfig.icon size={24} className="text-advist-blue-light group-hover:text-advist-gray900 transition-all duration-240" />}
          </div>
          <span className="font-medium text-advist-gray900 group-hover:text-advist-gray900">
            Ajouter un {activeConfig?.label.toLowerCase()}
          </span>
        </button>

        {/* Existing Specimens */}
        {filteredSpecimens.map((specimen) => (
          <div
            key={specimen.id}
            className={`relative bg-white rounded-[14px] border ${specimen.isDefault ? 'border-advist-gold ring-2 ring-primary-300/20' : 'border-advist-border'} shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden`}
          >
            {/* Default Badge */}
            {specimen.isDefault && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-advist-gold-light text-advist-gray900 text-xs font-semibold rounded-xl">
                <Star size={12} />
                Par défaut
              </div>
            )}

            {/* Specimen Preview */}
            <div className="h-32 bg-advist-surface-dark flex items-center justify-center border-b border-advist-border">
              {specimen.data ? (
                <img src={specimen.data} alt={specimen.name} className="max-h-24 max-w-full object-contain" />
              ) : (
                <div className="text-center">
                  {specimen.specimenType === 'signature' && (
                    <p className="text-2xl font-serif italic text-advist-gray900">{userName}</p>
                  )}
                  {specimen.specimenType === 'paraph' && (
                    <p className="text-3xl font-bold text-advist-gray900">
                      {userName.split(' ').map(n => n[0]).join('')}
                    </p>
                  )}
                  {specimen.specimenType === 'visa' && (
                    <div className="px-4 py-2 border-2 border-advist-dark rounded">
                      <p className="text-sm font-bold text-advist-gray900">VALIDÉ</p>
                    </div>
                  )}
                  <p className="text-xs text-advist-blue-light mt-1">Aperçu</p>
                </div>
              )}
            </div>

            {/* Specimen Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-advist-gray900">{specimen.name}</h4>
                <span className={`px-2 py-0.5 text-xs rounded-xl ${
                  specimen.type === 'drawn' ? 'bg-advist-gold-light/20 text-advist-gray900' :
                  specimen.type === 'typed' ? 'bg-advist-dark/10 text-advist-gray900' :
                  'bg-advist-dark/10 text-advist-gray900'
                }`}>
                  {specimen.type === 'drawn' ? 'Dessiné' : specimen.type === 'typed' ? 'Tapé' : 'Importé'}
                </span>
              </div>
              <p className="text-xs text-advist-blue-light mb-3">
                Créé le {specimen.createdAt.toLocaleDateString('fr-FR')}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!specimen.isDefault && (
                  <button
                    onClick={() => handleSetDefault(specimen.id, specimen.specimenType)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-advist-gray900 bg-advist-gold-light/20 hover:bg-advist-surface-dark rounded-xl transition-all duration-240"
                  >
                    <Star size={12} />
                    Par défaut
                  </button>
                )}
                <button
                  onClick={() => handleDelete(specimen.id)}
                  className="p-2 text-advist-error hover:bg-advist-gold-light rounded-xl transition-all duration-240"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Specimen Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`Créer un ${SPECIMEN_TYPES.find(s => s.id === selectedSpecimenType)?.label.toLowerCase()}`}
        size="lg"
      >
        <CreateSignatureModal
          userName={userName}
          mode={createMode}
          setMode={setCreateMode}
          specimenType={selectedSpecimenType}
          onSave={handleCreateSpecimen}
          onClose={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
};

// Create Signature Modal Content
const CreateSignatureModal: React.FC<{
  userName: string;
  mode: 'draw' | 'type' | 'upload';
  setMode: (mode: 'draw' | 'type' | 'upload') => void;
  specimenType: 'signature' | 'paraph' | 'visa';
  onSave: (data: string, type: 'drawn' | 'typed' | 'uploaded') => void;
  onClose: () => void;
}> = ({ userName, mode, setMode, specimenType, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Default text based on specimen type
  const getDefaultText = () => {
    switch (specimenType) {
      case 'signature':
        return userName;
      case 'paraph':
        return userName.split(' ').map(n => n[0]).join('');
      case 'visa':
        return 'VALIDÉ';
      default:
        return userName;
    }
  };

  const [typedText, setTypedText] = useState(getDefaultText());
  const [selectedFont, setSelectedFont] = useState('cursive');

  const specimenConfig = SPECIMEN_TYPES.find(s => s.id === specimenType);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const fonts = [
    { id: 'cursive', name: 'Cursive', style: 'font-serif italic' },
    { id: 'elegant', name: 'Elegant', style: 'font-serif' },
    { id: 'modern', name: 'Moderne', style: 'font-sans' },
    { id: 'classic', name: 'Classique', style: 'font-mono' },
  ];

  // Canvas drawing functions
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#171717';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [mode]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    setIsDrawing(true);
    lastPoint.current = point;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getCanvasPoint(e);
    if (!point || !lastPoint.current) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);

    // Use quadratic curve for smoother lines
    const midX = (lastPoint.current.x + point.x) / 2;
    const midY = (lastPoint.current.y + point.y) / 2;
    ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midX, midY);
    ctx.stroke();

    lastPoint.current = point;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#171717';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (mode === 'draw' && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl, 'drawn');
    } else if (mode === 'type') {
      // For typed signature, we could create a canvas with the text
      onSave('', 'typed');
    } else if (mode === 'upload' && uploadedImage) {
      onSave(uploadedImage, 'uploaded');
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-advist-surface-dark rounded-[10px]">
        <button
          onClick={() => setMode('draw')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-240 ${
            mode === 'draw' ? 'bg-advist-dark text-white' : 'text-advist-gray900 hover:bg-advist-surface-dark'
          }`}
        >
          <Edit3 size={16} />
          Dessiner
        </button>
        <button
          onClick={() => setMode('type')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-240 ${
            mode === 'type' ? 'bg-advist-dark text-white' : 'text-advist-gray900 hover:bg-advist-surface-dark'
          }`}
        >
          <Type size={16} />
          Taper
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-240 ${
            mode === 'upload' ? 'bg-advist-dark text-white' : 'text-advist-gray900 hover:bg-advist-surface-dark'
          }`}
        >
          <Upload size={16} />
          Importer
        </button>
      </div>

      {/* Draw Mode */}
      {mode === 'draw' && (
        <div className="space-y-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full border border-advist-border rounded-[10px] cursor-crosshair bg-[#fafafa] touch-none"
              style={{ touchAction: 'none' }}
            />
            <button
              onClick={clearCanvas}
              className="absolute top-3 right-3 p-2 bg-white text-advist-gray900 hover:bg-advist-surface-dark rounded-xl transition-all duration-240 shadow"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <p className="text-sm text-advist-text-secondary text-center">
            Dessinez votre signature avec la souris, le doigt ou un stylet
          </p>
        </div>
      )}

      {/* Type Mode */}
      {mode === 'type' && (
        <div className="space-y-4">
          <Input
            label="Texte de la signature"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Votre nom"
          />

          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              Style de police
            </label>
            <div className="grid grid-cols-2 gap-2">
              {fonts.map((font) => (
                <button
                  key={font.id}
                  onClick={() => setSelectedFont(font.id)}
                  className={`p-4 border rounded-[10px] text-left transition-all ${
                    selectedFont === font.id
                      ? 'border-advist-dark bg-advist-gold-light/20'
                      : 'border-advist-border hover:border-advist-blue-light'
                  }`}
                >
                  <p className={`text-xl ${font.style} text-advist-gray900`}>{typedText || 'Apercu'}</p>
                  <p className="text-xs text-advist-blue-light mt-1">{font.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-6 bg-advist-surface-dark rounded-[10px] border border-advist-border">
            <p className="text-xs text-advist-blue-light mb-2">Apercu</p>
            <p className={`text-3xl ${fonts.find(f => f.id === selectedFont)?.style} text-advist-gray900`}>
              {typedText || 'Votre signature'}
            </p>
          </div>
        </div>
      )}

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div className="space-y-4">
          {!uploadedImage ? (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-3 p-12 border-2 border-dashed border-advist-border rounded-[10px] hover:border-advist-dark transition-all duration-240">
                <div className="p-4 bg-advist-surface-dark rounded-full">
                  <Image size={24} className="text-advist-blue-light" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-advist-gray900">Cliquez ou glissez une image</p>
                  <p className="text-sm text-advist-blue-light mt-1">PNG, JPG jusqu'a 5MB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="p-6 bg-advist-surface-dark rounded-[10px] border border-advist-border">
                <img src={uploadedImage} alt="Signature" className="max-h-40 mx-auto" />
              </div>
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-3 right-3 p-2 bg-advist-gold-light text-advist-error hover:bg-advist-gold-light rounded-xl transition-all duration-240"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <p className="text-sm text-advist-blue-light text-center">
            Importez une image de votre signature manuscrite
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-advist-border">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Annuler
        </Button>
        <button
          onClick={handleSave}
          disabled={mode === 'upload' && !uploadedImage}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-advist-dark hover:bg-advist-dark disabled:bg-advist-surface-dark text-white disabled:text-advist-blue-light font-medium rounded-[10px] transition-all duration-240"
        >
          <Check size={16} />
          Enregistrer la signature
        </button>
      </div>
    </div>
  );
};

// Security Tab
const SecurityTab: React.FC<{
  onChangePassword: () => void;
  onSetup2FA: () => void;
  onDeleteAccount: () => void;
}> = ({ onChangePassword, onSetup2FA, onDeleteAccount }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      {/* Password */}
      <div className="bg-white rounded-[14px] border border-advist-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-advist-gold-light/20 rounded-xl">
              <Key size={24} className="text-advist-gray900" />
            </div>
            <div>
              <h3 className="font-semibold text-advist-gray900">{t('auth.password', 'Mot de passe')}</h3>
              <p className="text-sm text-advist-gray900 mt-1">
                {t('profile.lastPasswordChange', 'Dernière modification il y a 3 mois')}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onChangePassword}>
            {t('common.edit', 'Modifier')}
          </Button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-[14px] border border-advist-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Smartphone size={24} className="text-advist-success" />
            </div>
            <div>
              <h3 className="font-semibold text-advist-gray900">
                {t('profile.twoFactor', 'Authentification à deux facteurs')}
              </h3>
              <p className="text-sm text-advist-gray900 mt-1">
                {t('profile.twoFactorDesc', 'Ajoutez une couche de sécurité supplémentaire à votre compte')}
              </p>
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-green-50 text-advist-success text-xs font-medium rounded-xl">
                <Check size={12} />
                {t('users.status.active', 'Actif')}
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={onSetup2FA}>
            {t('profile.configure', 'Configurer')}
          </Button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-white rounded-[14px] border border-advist-gold shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-advist-gold-light rounded-xl">
            <AlertTriangle size={24} className="text-advist-error" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-advist-error">{t('profile.deleteAccount', 'Supprimer le compte')}</h3>
            <p className="text-sm text-advist-gray900 mt-1">
              {t('profile.deleteAccountWarning', 'La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.')}
            </p>
            <button
              onClick={onDeleteAccount}
              className="mt-3 px-4 py-2 bg-advist-error hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all duration-240"
            >
              {t('profile.deleteMyAccount', 'Supprimer mon compte')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sessions Tab
const SessionsTab: React.FC = () => {
  const { t } = useTranslation();
  const sessions = [
    {
      id: 1,
      device: 'Windows - Chrome',
      location: 'Paris, France',
      ip: '192.168.1.100',
      lastActive: t('profile.currentlyActive', 'Actuellement actif'),
      current: true,
    },
    {
      id: 2,
      device: 'iPhone - Safari',
      location: 'Paris, France',
      ip: '192.168.1.101',
      lastActive: t('common.hours_ago', 'Il y a {{count}} h', { count: 2 }),
      current: false,
    },
    {
      id: 3,
      device: 'MacBook - Firefox',
      location: 'Lyon, France',
      ip: '192.168.2.50',
      lastActive: t('common.days_ago', 'Il y a {{count}} j', { count: 3 }),
      current: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[14px] border border-advist-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-advist-gray900">
            {t('profile.activeSessions', 'Sessions actives')}
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-advist-gray900 hover:bg-advist-gold-light/20 border border-advist-border rounded-xl transition-all duration-240">
            <LogOut size={16} />
            {t('profile.logoutAllSessions', 'Déconnecter toutes les sessions')}
          </button>
        </div>

        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-4 rounded-[10px] ${
                session.current ? 'bg-green-50 border border-advist-success' : 'bg-advist-surface-dark'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-xl ${
                    session.current ? 'bg-green-50' : 'bg-advist-gold-light/20'
                  }`}
                >
                  <Smartphone
                    size={20}
                    className={session.current ? 'text-advist-success' : 'text-advist-gray900'}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-advist-gray900">{session.device}</p>
                    {session.current && (
                      <span className="px-2 py-0.5 bg-green-50 text-advist-success text-xs font-medium rounded-xl">
                        {t('profile.currentSession', 'Session actuelle')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-advist-gray900">
                    {session.location} - {session.ip}
                  </p>
                  <p className="text-xs text-advist-blue-light">{session.lastActive}</p>
                </div>
              </div>
              {!session.current && (
                <button className="flex items-center gap-1 px-3 py-2 text-sm text-advist-error hover:bg-advist-gold-light rounded-xl transition-all duration-240">
                  <LogOut size={14} />
                  {t('auth.logout', 'Déconnecter')}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Change Password Modal
const ChangePasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Changing password');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le mot de passe">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Mot de passe actuel"
          type="password"
          value={formData.currentPassword}
          onChange={(e) =>
            setFormData({ ...formData, currentPassword: e.target.value })
          }
          required
        />
        <Input
          label="Nouveau mot de passe"
          type="password"
          value={formData.newPassword}
          onChange={(e) =>
            setFormData({ ...formData, newPassword: e.target.value })
          }
          required
        />
        <Input
          label="Confirmer le nouveau mot de passe"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          required
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">Modifier le mot de passe</Button>
        </div>
      </form>
    </Modal>
  );
};

// 2FA Setup Modal
const Setup2FAModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurer l'authentification a deux facteurs"
    >
      <div className="space-y-4">
        {step === 1 && (
          <>
            <p className="text-sm text-advist-gray900">
              Scannez le QR code ci-dessous avec votre application d'authentification
              (Google Authenticator, Authy, etc.)
            </p>
            <div className="flex justify-center py-6">
              <div className="w-48 h-48 bg-advist-surface-dark rounded-[10px] flex items-center justify-center border border-advist-border">
                <span className="text-advist-blue-light">QR Code</span>
              </div>
            </div>
            <p className="text-xs text-center text-advist-blue-light">
              Code manuel: ABCD-EFGH-IJKL-MNOP
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={() => setStep(2)}>Suivant</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-advist-gray900">
              Entrez le code a 6 chiffres genere par votre application
            </p>
            <Input
              label="Code de verification"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
              <Button variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button onClick={onClose}>Activer</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// Appearance Tab
const AppearanceTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-advist-gold-light/20 rounded-[14px] border border-advist-blue-light/30 p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-advist-gold-light/30 rounded-xl">
            <Paintbrush size={20} className="text-advist-gray900" />
          </div>
          <div>
            <h3 className="font-semibold text-advist-gray900">Personnalisation de l'interface</h3>
            <p className="text-sm text-advist-gray900 mt-1">
              Adaptez l'apparence de votre espace de travail selon vos préférences.
              Choisissez vos couleurs, polices et options de mise en page.
            </p>
          </div>
        </div>
      </div>

      {/* Theme Customizer */}
      <ThemeCustomizer />
    </div>
  );
};

// Delete Account Modal
const DeleteAccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}> = ({ isOpen, onClose, userEmail }) => {
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const CONFIRM_WORD = 'SUPPRIMER';

  const handleClose = () => {
    setStep(1);
    setConfirmText('');
    setPassword('');
    setError('');
    onClose();
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== CONFIRM_WORD) {
      setError('Veuillez taper SUPPRIMER pour confirmer');
      return;
    }

    if (!password) {
      setError('Veuillez entrer votre mot de passe');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      // Simulate API call to delete account
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // On success, logout and redirect
      if (logout) {
        logout();
      }
      handleClose();
      // In real implementation, redirect to a goodbye page or home
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Demo data for documents that will be deleted
  const documentsToDelete = [
    { type: 'Documents', count: 47, icon: '📄' },
    { type: 'Signatures', count: 12, icon: '✍️' },
    { type: 'Modèles', count: 8, icon: '📋' },
    { type: 'Contacts', count: 23, icon: '👥' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="space-y-6">
        {step === 1 && (
          <>
            {/* Warning Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-primary-900">
                {t('profile.deleteAccount', 'Supprimer votre compte')}
              </h2>
              <p className="text-sm text-primary-500 mt-2">
                Cette action est irréversible et entraînera la suppression définitive de toutes vos données.
              </p>
            </div>

            {/* What will be deleted */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Les éléments suivants seront supprimés :
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {documentsToDelete.map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-red-100"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-medium text-primary-900">{item.count}</p>
                      <p className="text-xs text-primary-500">{item.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional warnings */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-primary-600">
                <AlertTriangle className="w-4 h-4 text-primary-900 flex-shrink-0 mt-0.5" />
                <span>Tous vos documents signés seront définitivement supprimés</span>
              </div>
              <div className="flex items-start gap-2 text-primary-600">
                <AlertTriangle className="w-4 h-4 text-primary-900 flex-shrink-0 mt-0.5" />
                <span>Vos signatures électroniques ne seront plus valides</span>
              </div>
              <div className="flex items-start gap-2 text-primary-600">
                <AlertTriangle className="w-4 h-4 text-primary-900 flex-shrink-0 mt-0.5" />
                <span>Votre historique d'activité sera effacé</span>
              </div>
              <div className="flex items-start gap-2 text-primary-600">
                <AlertTriangle className="w-4 h-4 text-primary-900 flex-shrink-0 mt-0.5" />
                <span>Vous ne pourrez plus récupérer votre compte</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-primary-200">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={() => setStep(2)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Continuer la suppression
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Confirmation Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-primary-900">
                Confirmer la suppression
              </h2>
              <p className="text-sm text-primary-500 mt-2">
                Pour des raisons de sécurité, veuillez confirmer votre identité.
              </p>
            </div>

            {/* Email display */}
            <div className="bg-primary-50 rounded-xl p-4">
              <p className="text-xs text-primary-500 mb-1">Compte à supprimer</p>
              <p className="font-medium text-primary-900">{userEmail}</p>
            </div>

            {/* Confirmation text input */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Tapez <span className="font-bold text-red-600">{CONFIRM_WORD}</span> pour confirmer
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder={CONFIRM_WORD}
                className={`w-full px-4 py-3 border rounded-xl text-center text-lg font-mono tracking-widest transition-colors ${
                  confirmText === CONFIRM_WORD
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-primary-200 focus:border-primary-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
              />
            </div>

            {/* Password input */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Mot de passe actuel
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-primary-200">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Retour
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={confirmText !== CONFIRM_WORD || !password || isDeleting}
                className={`flex-1 ${
                  confirmText === CONFIRM_WORD && password && !isDeleting
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-primary-300 cursor-not-allowed'
                } text-white`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ProfilePage;
