import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface SignaturePadProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signatureData: string) => void;
  title?: string;
  type?: 'formal' | 'initials' | 'paraph';
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  visible,
  onClose,
  onSave,
  title = 'Signez ici',
  type = 'formal',
}) => {
  const signatureRef = useRef<SignatureViewRef>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (isEmpty) {
      Alert.alert('Erreur', 'Veuillez dessiner votre signature');
      return;
    }
    signatureRef.current?.readSignature();
  };

  const handleSignature = (signature: string) => {
    onSave(signature);
    handleClear();
    onClose();
  };

  const handleEmpty = () => {
    setIsEmpty(true);
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const getInstructions = () => {
    switch (type) {
      case 'initials':
        return 'Dessinez vos initiales';
      case 'paraph':
        return 'Dessinez votre paraphe';
      default:
        return 'Dessinez votre signature';
    }
  };

  const webStyle = `.m-signature-pad--footer { display: none; }
    .m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: none; }
    body, html { background-color: ${colors.surface}; }
    canvas { background-color: ${colors.surface}; }`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Instructions */}
        <Text style={styles.instructions}>{getInstructions()}</Text>

        {/* Signature Canvas */}
        <View style={styles.canvasContainer}>
          <SignatureScreen
            ref={signatureRef}
            onOK={handleSignature}
            onEmpty={handleEmpty}
            onBegin={handleBegin}
            webStyle={webStyle}
            backgroundColor={colors.surface}
            penColor={colors.textPrimary}
            dotSize={3}
            minWidth={2}
            maxWidth={4}
          />
          <View style={styles.signatureLine} />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Effacer"
            variant="outline"
            onPress={handleClear}
            icon={<Ionicons name="trash-outline" size={18} color={colors.textPrimary} />}
            style={styles.actionButton}
          />
          <Button
            title="Enregistrer"
            onPress={handleSave}
            disabled={isEmpty}
            icon={<Ionicons name="checkmark" size={18} color={colors.surface} />}
            style={styles.actionButton}
          />
        </View>
      </View>
    </Modal>
  );
};

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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  instructions: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
  },
  canvasContainer: {
    flex: 1,
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  signatureLine: {
    position: 'absolute',
    bottom: '30%',
    left: spacing.xl,
    right: spacing.xl,
    height: 1,
    backgroundColor: colors.accent,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
  },
});

export default SignaturePad;
