import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSizes } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + Spacing.md }]}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.quickAction}>
        <Text style={styles.quickActionTitle}>Seleccionar platillos</Text>
        <Text style={styles.quickActionSubtitle}>
          Marca los platillos que vas a comer. Sus ingredientes se agregan a tu
          lista de súper.
        </Text>
        <Button
          title="Seleccionar platillos"
          onPress={() => router.push('/platillos' as any)}
          variant="secondary"
          style={styles.quickActionButton}
        />
      </Card>

      <Card style={styles.quickAction}>
        <Text style={styles.quickActionTitle}>Mi inventario</Text>
        <Text style={styles.quickActionSubtitle}>
          Tu refri y la lista de súper: marca lo comprado y pásalo al inventario
        </Text>
        <Button
          title="Ver inventario"
          onPress={() => router.push('/inventario' as any)}
          variant="secondary"
          style={styles.quickActionButton}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingTop: 0,
    paddingBottom: Spacing.xl,
  },
  quickAction: {
    padding: Spacing.lg,
  },
  quickActionTitle: {
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  quickActionSubtitle: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  quickActionButton: {
    marginTop: Spacing.sm,
  },
});
