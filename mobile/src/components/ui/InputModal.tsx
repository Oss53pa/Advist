import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface InputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  variant?: 'default' | 'danger';
}

export const InputModal: React.FC<InputModalProps> = ({
  visible,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = '',
  initialValue = '',
  submitLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  loading = false,
  required = false,
  multiline = false,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  variant = 'default',
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      // Focus input after modal animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible, initialValue]);

  const handleSubmit = () => {
    if (required && !value.trim()) {
      return;
    }
    onSubmit(value.trim());
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  const isSubmitDisabled = required && !value.trim();

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={title}
      showCloseButton={false}
      size="md"
      closeOnBackdrop={!loading}
    >
      <View style={styles.container}>
        {message && <Text style={styles.message}>{message}</Text>}

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              multiline && styles.inputMultiline,
            ]}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            maxLength={maxLength}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry}
            editable={!loading}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
          {maxLength && (
            <Text style={styles.charCount}>
              {value.length}/{maxLength}
            </Text>
          )}
        </View>

        <View style={styles.buttons}>
          <Button
            title={cancelLabel}
            variant="outline"
            onPress={handleClose}
            disabled={loading}
            style={styles.button}
          />
          <Button
            title={submitLabel}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onPress={handleSubmit}
            loading={loading}
            disabled={isSubmitDisabled}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: spacing.sm,
  },
  charCount: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});

export default InputModal;
