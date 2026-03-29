import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { UserSignature } from '@/types';

interface SignatureListProps {
  signatures: UserSignature[];
  selectedId?: string;
  onSelect?: (signature: UserSignature) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'formal':
      return 'Signature';
    case 'initials':
      return 'Initiales';
    case 'paraph':
      return 'Paraphe';
    default:
      return type;
  }
};

export const SignatureList: React.FC<SignatureListProps> = ({
  signatures,
  selectedId,
  onSelect,
  onDelete,
  onSetDefault,
}) => {
  const handleDelete = (signature: UserSignature) => {
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer cette ${getTypeLabel(signature.type).toLowerCase()} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDelete?.(signature.id),
        },
      ]
    );
  };

  if (signatures.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="create-outline" size={48} color={colors.accent} />
        <Text style={styles.emptyText}>Aucune signature enregistrée</Text>
        <Text style={styles.emptySubtext}>
          Créez votre première signature pour signer des documents
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {signatures.map((signature) => (
        <Card
          key={signature.id}
          style={[
            styles.signatureCard,
            selectedId === signature.id && styles.selectedCard,
          ]}
          onPress={() => onSelect?.(signature)}
        >
          <View style={styles.signatureContent}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: signature.imageUrl }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.signatureInfo}>
              <View style={styles.labelRow}>
                <Badge label={getTypeLabel(signature.type)} size="sm" />
                {signature.isDefault && (
                  <Badge label="Par défaut" variant="success" size="sm" />
                )}
              </View>
              <Text style={styles.dateText}>
                Créée le{' '}
                {new Date(signature.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.actions}>
              {!signature.isDefault && onSetDefault && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onSetDefault(signature.id)}
                >
                  <Ionicons
                    name="star-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(signature)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.error}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  signatureCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: colors.textPrimary,
  },
  signatureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 50,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  signatureInfo: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
  },
});

export default SignatureList;
