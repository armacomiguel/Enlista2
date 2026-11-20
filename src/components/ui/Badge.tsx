import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'error' | 'neutral' | 'warning';
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
  },
  success: {
    backgroundColor: '#DCFCE7',
  },
  successText: {
    color: Colors.success,
  },
  error: {
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: Colors.error,
  },
  neutral: {
    backgroundColor: '#F3F4F6',
  },
  neutralText: {
    color: Colors.textSecondary,
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  warningText: {
    color: '#D97706',
  },
});
