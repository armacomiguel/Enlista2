import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { logoutUser } from '@/lib/firebase/auth';

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logoutUser();
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={48} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Tu cuenta y configuración</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color={Colors.textSecondary} />
          <Text style={styles.infoText}>Email</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="key" size={20} color={Colors.textSecondary} />
          <Text style={styles.infoText}>Cambiar contraseña</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="notifications" size={20} color={Colors.textSecondary} />
          <Text style={styles.infoText}>Notificaciones</Text>
        </View>
      </Card>

      <Button
        title="Cerrar sesión"
        onPress={handleLogout}
        variant="danger"
        size="large"
        style={styles.logoutButton}
      />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    padding: Spacing.md,
    paddingBottom: 0,
  },
  content: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.largeTitle,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  card: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoText: {
    fontSize: FontSizes.body,
    color: Colors.textPrimary,
  },
  logoutButton: {
    marginTop: Spacing.lg,
  },
});
