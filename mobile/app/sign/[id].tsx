import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { documentsService, signaturesService } from '@/services';
import { Card, Button, Loading, Badge, Input } from '@/components/ui';
import { SignaturePad, SignatureList } from '@/components/signature';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { UserSignature } from '@/types';

export default function SignDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [selectedSignature, setSelectedSignature] = useState<UserSignature | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: document, isLoading: docLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsService.getDocument(id!),
    enabled: !!id,
  });

  const { data: signatures, isLoading: sigLoading } = useQuery({
    queryKey: ['userSignatures'],
    queryFn: signaturesService.getUserSignatures,
  });

  const signMutation = useMutation({
    mutationFn: (data: {
      signatureId: string;
      pin: string;
      location?: { latitude: number; longitude: number };
    }) =>
      signaturesService.signDocument(id!, {
        signatureId: data.signatureId,
        page: 1, // TODO: Allow page selection
        position: { x: 100, y: 100 }, // TODO: Allow position selection
        pin: data.pin,
        location: data.location,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Alert.alert('Succès', 'Document signé avec succès', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert('Erreur', 'Impossible de signer le document');
    },
  });

  const createSignatureMutation = useMutation({
    mutationFn: (data: { type: 'formal' | 'initials' | 'paraph'; imageData: string }) =>
      signaturesService.createSignature(data.type, data.imageData),
    onSuccess: (newSignature) => {
      queryClient.invalidateQueries({ queryKey: ['userSignatures'] });
      setSelectedSignature(newSignature);
    },
  });

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const handleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentifiez-vous pour signer',
        fallbackLabel: 'Utiliser le code PIN',
      });

      return result.success;
    }

    return false;
  };

  const handleSign = async () => {
    if (!selectedSignature) {
      Alert.alert('Erreur', 'Veuillez sélectionner une signature');
      return;
    }

    setIsVerifying(true);

    // Try biometric first
    const biometricSuccess = await handleBiometricAuth();

    if (biometricSuccess) {
      // Sign with biometric - use empty pin as it's verified biometrically
      signMutation.mutate({
        signatureId: selectedSignature.id,
        pin: '',
        location: location || undefined,
      });
    } else {
      // Fall back to PIN
      setShowPinModal(true);
    }

    setIsVerifying(false);
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      Alert.alert('Erreur', 'Le code PIN doit contenir au moins 4 chiffres');
      return;
    }

    const isValid = await signaturesService.verifyPin(pin);
    if (!isValid) {
      Alert.alert('Erreur', 'Code PIN incorrect');
      return;
    }

    setShowPinModal(false);
    signMutation.mutate({
      signatureId: selectedSignature!.id,
      pin,
      location: location || undefined,
    });
    setPin('');
  };

  const handleSaveNewSignature = (signatureData: string) => {
    createSignatureMutation.mutate({
      type: 'formal',
      imageData: signatureData,
    });
  };

  const isLoading = docLoading || sigLoading;

  if (isLoading) {
    return <Loading fullScreen message="Chargement..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signer le document</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Document Info */}
        <Card style={styles.documentCard}>
          <View style={styles.documentHeader}>
            <Ionicons name="document-text" size={32} color={colors.accent} />
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle} numberOfLines={2}>
                {document?.title}
              </Text>
              <Text style={styles.documentMeta}>
                Version {document?.version} • {document?.type?.name}
              </Text>
            </View>
          </View>
        </Card>

        {/* Signature Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choisir une signature</Text>
            <TouchableOpacity onPress={() => setShowSignaturePad(true)}>
              <Text style={styles.addLink}>+ Nouvelle</Text>
            </TouchableOpacity>
          </View>

          {signatures && signatures.length > 0 ? (
            <SignatureList
              signatures={signatures}
              selectedId={selectedSignature?.id}
              onSelect={setSelectedSignature}
            />
          ) : (
            <Card>
              <View style={styles.emptySignatures}>
                <Text style={styles.emptyText}>
                  Aucune signature enregistrée
                </Text>
                <Button
                  title="Créer une signature"
                  onPress={() => setShowSignaturePad(true)}
                  size="sm"
                  style={styles.createButton}
                />
              </View>
            </Card>
          )}
        </View>

        {/* Location Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {location
                ? 'Position géographique activée'
                : 'Position non disponible'}
            </Text>
            {location && (
              <Badge label="Actif" variant="success" size="sm" />
            )}
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Horodatage: {new Date().toLocaleString('fr-FR')}
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Sign Button */}
      <View style={styles.footer}>
        <Button
          title={isVerifying ? 'Vérification...' : 'Signer le document'}
          onPress={handleSign}
          disabled={!selectedSignature || signMutation.isPending || isVerifying}
          loading={signMutation.isPending}
          fullWidth
          size="lg"
          icon={<Ionicons name="create" size={20} color={colors.surface} />}
        />
      </View>

      {/* Signature Pad Modal */}
      <SignaturePad
        visible={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSave={handleSaveNewSignature}
        title="Créer une signature"
      />

      {/* PIN Modal */}
      {showPinModal && (
        <View style={styles.pinModal}>
          <View style={styles.pinContent}>
            <Text style={styles.pinTitle}>Entrez votre code PIN</Text>
            <Input
              value={pin}
              onChangeText={setPin}
              placeholder="••••"
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              style={styles.pinInput}
            />
            <View style={styles.pinActions}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={() => {
                  setShowPinModal(false);
                  setPin('');
                }}
                style={styles.pinButton}
              />
              <Button
                title="Confirmer"
                onPress={handlePinSubmit}
                style={styles.pinButton}
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 24,
  },
  content: {
    padding: spacing.md,
  },
  documentCard: {
    marginBottom: spacing.lg,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  documentTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  documentMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  addLink: {
    ...typography.body,
    color: colors.accent,
  },
  emptySignatures: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  createButton: {
    marginTop: spacing.sm,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pinModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pinContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  pinTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  pinInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  pinActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  pinButton: {
    flex: 1,
  },
});
