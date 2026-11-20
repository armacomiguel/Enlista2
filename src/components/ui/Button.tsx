import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles: ViewStyle[] = [styles.base];

  if (variant === 'primary') buttonStyles.push(styles.primary);
  if (variant === 'secondary') buttonStyles.push(styles.secondary);
  if (variant === 'ghost') buttonStyles.push(styles.ghost);
  if (variant === 'danger') buttonStyles.push(styles.danger);

  if (size === 'small') buttonStyles.push(styles.small);
  if (size === 'medium') buttonStyles.push(styles.medium);
  if (size === 'large') buttonStyles.push(styles.large);

  if (disabled) buttonStyles.push(styles.disabled);

  const textStyles: TextStyle[] = [styles.text];
  if (variant === 'ghost') textStyles.push(styles.ghostText);
  if (size === 'small') textStyles.push(styles.smallText);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[...buttonStyles, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? Colors.primary : Colors.surface} />
      ) : (
        <Text style={[...textStyles, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
  },
  small: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  medium: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  large: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: Colors.surface,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  ghostText: {
    color: Colors.primary,
  },
  smallText: {
    fontSize: FontSizes.caption,
  },
});
