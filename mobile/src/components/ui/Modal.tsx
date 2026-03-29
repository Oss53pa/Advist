import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
  position?: 'center' | 'bottom';
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  size = 'md',
  position = 'center',
}) => {
  const insets = useSafeAreaInsets();

  const getContainerStyle = () => {
    const baseStyle = [styles.container];

    if (position === 'bottom') {
      baseStyle.push(styles.containerBottom);
    }

    return baseStyle;
  };

  const getContentStyle = () => {
    const baseStyle = [styles.content];

    switch (size) {
      case 'sm':
        baseStyle.push(styles.contentSm);
        break;
      case 'lg':
        baseStyle.push(styles.contentLg);
        break;
      case 'full':
        baseStyle.push(styles.contentFull);
        break;
      default:
        baseStyle.push(styles.contentMd);
    }

    if (position === 'bottom') {
      baseStyle.push(styles.contentBottom);
      baseStyle.push({ paddingBottom: insets.bottom + spacing.md });
    }

    return baseStyle;
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={position === 'bottom' ? 'slide' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={closeOnBackdrop ? onClose : undefined}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={getContainerStyle()}
            >
              <View style={getContentStyle()}>
                {(title || showCloseButton) && (
                  <View style={styles.header}>
                    {title && <Text style={styles.title}>{title}</Text>}
                    {showCloseButton && (
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close" size={24} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <View style={styles.body}>{children}</View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  containerBottom: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  contentSm: {
    width: '80%',
    maxWidth: 300,
  },
  contentMd: {
    width: '90%',
    maxWidth: 400,
  },
  contentLg: {
    width: '95%',
    maxWidth: 500,
  },
  contentFull: {
    width: '100%',
    flex: 1,
    borderRadius: 0,
  },
  contentBottom: {
    width: '100%',
    maxWidth: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  body: {
    padding: spacing.md,
  },
});

export default Modal;
