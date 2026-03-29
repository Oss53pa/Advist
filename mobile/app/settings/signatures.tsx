import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { signaturesService } from '@/services';
import { UserSignature } from '@/types';
import {
  Card,
  Button,
  Loading,
  Modal,
  ConfirmModal,
  ActionSheet,
  ActionSheetOption,
} from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SignatureType = 'formal' | 'initials' | 'paraph';

const SIGNATURE_TYPES: { type: SignatureType; label: string; description: string }[] = [
  { type: 'formal', label: 'Signature complete', description: 'Votre signature officielle' },
  { type: 'initials', label: 'Initiales', description: 'Vos initiales (paraphe court)' },
  { type: 'paraph', label: 'Paraphe', description: 'Pour parapher les pages' },
];

export default function SignaturesScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [signatures, setSignatures] = useState<UserSignature[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<UserSignature | null>(null);
  const [selectedType, setSelectedType] = useState<SignatureType>('formal');
  const [isSaving, setIsSaving] = useState(false);
  const signatureRef = useRef<SignatureViewRef>(null);

  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    setIsLoading(true);
    try {
      const data = await signaturesService.getUserSignatures();
      setSignatures(data);
    } catch (error) {
      console.error('Error loading signatures:', error);
      Alert.alert('Erreur', 'Impossible de charger les signatures');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSignature = () => {
    setSelectedType('formal');
    setShowCreateModal(true);
  };

  const handleSignatureOK = async (signature: string) => {
    if (!signature) {
      Alert.alert('Erreur', 'Veuillez dessiner votre signature');
      return;
    }

    setIsSaving(true);
    try {
      const validation = signaturesService.validateSignatureImage(signature);
      if (!validation.valid) {
        Alert.alert('Erreur', validation.error);
        return;
      }

      const isDefault = signatures.filter((s) => s.type === selectedType).length === 0;
      const newSignature = await signaturesService.createSignature(
        selectedType,
        signature,
        { setAsDefault: isDefault }
      );

      setSignatures((prev) => [...prev, newSignature]);
      setShowCreateModal(false);
      Alert.alert('Succes', 'Signature creee avec succes');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignaturePress = (signature: UserSignature) => {
    setSelectedSignature(signature);
    setShowActionSheet(true);
  };

  const handleSetDefault = async () => {
    if (!selectedSignature) return;

    setShowActionSheet(false);
    try {
      await signaturesService.setDefaultSignature(selectedSignature.id);
      setSignatures((prev) =>
        prev.map((s) => ({
          ...s,
          isDefault: s.type === selectedSignature.type ? s.id === selectedSignature.id : s.isDefault,
        }))
      );
      Alert.alert('Succes', 'Signature par defaut mise a jour');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  const handleDelete = async () => {
    if (!selectedSignature) return;

    try {
      await signaturesService.deleteSignature(selectedSignature.id);
      setSignatures((prev) => prev.filter((s) => s.id !== selectedSignature.id));
      Alert.alert('Succes', 'Signature supprimee');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setShowDeleteModal(false);
      setSelectedSignature(null);
    }
  };

  const getSignatureActions = (): ActionSheetOption[] => {
    if (!selectedSignature) return [];

    const actions: ActionSheetOption[] = [];

    if (!selectedSignature.isDefault) {
      actions.push({
        label: 'Definir par defaut',
        icon: 'star-outline',
        onPress: handleSetDefault,
      });
    }

    actions.push({
      label: 'Supprimer',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => {
        setShowActionSheet(false);
        setTimeout(() => setShowDeleteModal(true), 300);
      },
    });

    return actions;
  };

  const getSignaturesByType = (type: SignatureType) => {
    return signatures.filter((s) => s.type === type);
  };

  const getTypeLabel = (type: SignatureType) => {
    return SIGNATURE_TYPES.find((t) => t.type === type)?.label || type;
  };

  const clearSignature = () => {
    signatureRef.current?.clearSignature();
  };

  if (isLoading) {
    return <Loading fullScreen message="Chargement des signatures..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <Text style={styles.infoText}>
              Creez vos signatures pour signer vos documents electroniquement.
              Vous pouvez avoir plusieurs signatures de chaque type.
            </Text>
          </View>
        </Card>

        {/* Signature Types */}
        {SIGNATURE_TYPES.map((typeInfo) => {
          const typeSignatures = getSignaturesByType(typeInfo.type);
          return (
            <View key={typeInfo.type} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>{typeInfo.label}</Text>
                  <Text style={styles.sectionDescription}>{typeInfo.description}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setSelectedType(typeInfo.type);
                    setShowCreateModal(true);
                  }}
                >
                  <Ionicons name="add" size={20} color={colors.surface} />
                </TouchableOpacity>
              </View>

              {typeSignatures.length > 0 ? (
                <Card style={styles.signaturesCard}>
                  {typeSignatures.map((signature, index) => (
                    <React.Fragment key={signature.id}>
                      {index > 0 && <View style={styles.separator} />}
                      <TouchableOpacity
                        style={styles.signatureItem}
                        onPress={() => handleSignaturePress(signature)}
                      >
                        <View style={styles.signaturePreview}>
                          <Image
                            source={{ uri: signature.imageUrl }}
                            style={styles.signatureImage}
                            resizeMode="contain"
                          />
                        </View>
                        <View style={styles.signatureInfo}>
                          <View style={styles.signatureHeader}>
                            <Text style={styles.signatureLabel}>
                              {getTypeLabel(signature.type)}
                            </Text>
                            {signature.isDefault && (
                              <View style={styles.defaultBadge}>
                                <Ionicons name="star" size={10} color={colors.surface} />
                                <Text style={styles.defaultBadgeText}>Defaut</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.signatureDate}>
                            Creee le{' '}
                            {new Date(signature.createdAt).toLocaleDateString('fr-FR')}
                          </Text>
                        </View>
                        <Ionicons name="ellipsis-vertical" size={20} color={colors.placeholder} />
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </Card>
              ) : (
                <Card style={styles.emptyCard}>
                  <Ionicons name="create-outline" size={32} color={colors.placeholder} />
                  <Text style={styles.emptyText}>Aucune signature</Text>
                  <Button
                    title="Creer"
                    onPress={() => {
                      setSelectedType(typeInfo.type);
                      setShowCreateModal(true);
                    }}
                    variant="outline"
                    size="sm"
                  />
                </Card>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Create Signature Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`Creer ${getTypeLabel(selectedType).toLowerCase()}`}
        size="full"
        position="bottom"
      >
        <View style={styles.modalContent}>
          {/* Type Selector */}
          <View style={styles.typeSelector}>
            {SIGNATURE_TYPES.map((typeInfo) => (
              <TouchableOpacity
                key={typeInfo.type}
                style={[
                  styles.typeOption,
                  selectedType === typeInfo.type && styles.typeOptionActive,
                ]}
                onPress={() => setSelectedType(typeInfo.type)}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedType === typeInfo.type && styles.typeOptionTextActive,
                  ]}
                >
                  {typeInfo.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Signature Canvas */}
          <View style={styles.canvasContainer}>
            <Text style={styles.canvasHint}>Dessinez votre signature ci-dessous</Text>
            <View style={styles.canvas}>
              <SignatureScreen
                ref={signatureRef}
                onOK={handleSignatureOK}
                webStyle={`.m-signature-pad { box-shadow: none; border: none; }
                  .m-signature-pad--body { border: 1px dashed ${colors.border}; border-radius: 8px; }
                  .m-signature-pad--footer { display: none; }`}
                backgroundColor={colors.surface}
                penColor={colors.textPrimary}
                minWidth={1}
                maxWidth={3}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <Button
              title="Effacer"
              onPress={clearSignature}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Enregistrer"
              onPress={() => signatureRef.current?.readSignature()}
              loading={isSaving}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Action Sheet */}
      <ActionSheet
        visible={showActionSheet}
        onClose={() => {
          setShowActionSheet(false);
          setSelectedSignature(null);
        }}
        title="Options"
        options={getSignatureActions()}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSignature(null);
        }}
        onConfirm={handleDelete}
        title="Supprimer la signature"
        message="Etes-vous sur de vouloir supprimer cette signature ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        icon="trash"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.md,
    backgroundColor: `${colors.info}10`,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signaturesCard: {
    padding: 0,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  signatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  signaturePreview: {
    width: 80,
    height: 50,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  signatureInfo: {
    flex: 1,
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  signatureLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  defaultBadgeText: {
    ...typography.caption,
    color: colors.surface,
    fontSize: 10,
  },
  signatureDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  typeOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  typeOptionActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeOptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  typeOptionTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  canvasContainer: {
    flex: 1,
  },
  canvasHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  canvas: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
