import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { usePlatillosStore } from '@/store/platillos-store';
import { getCurrentUser } from '@/lib/firebase/auth';
import { Platillo } from '@/lib/types';

/**
 * "Tus platillos": gestión del catálogo propio (crear, editar, eliminar).
 * Accesible desde la opción "Seleccionar platillos" del Home.
 */
export default function PlatillosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { platillos, loading, error, fetchPlatillos, deletePlatillo } = usePlatillosStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    fetchPlatillos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlatillos();
    setRefreshing(false);
  };

  const handleDeletePlatillo = (platillo: Platillo) => {
    Alert.alert(
      'Eliminar platillo',
      `¿Estás seguro de eliminar "${platillo.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlatillo(platillo.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el platillo');
            }
          },
        },
      ]
    );
  };

  const renderPlatilloItem = (platillo: Platillo) => (
    <Card key={platillo.id} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemNombre}>{platillo.nombre}</Text>
          <Text style={styles.itemDetail}>
            {platillo.ingredientes.length} ingrediente(s)
          </Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            onPress={() => router.push(`/platillos/${platillo.id}` as any)}
            style={styles.actionButton}
          >
            <Ionicons name="pencil" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeletePlatillo(platillo)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Tus platillos</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catálogo</Text>
          <Button
            title="Nuevo"
            onPress={() => router.push('/platillos/crear')}
            size="small"
            style={styles.newButton}
          />
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {loading && platillos.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : platillos.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Sin platillos</Text>
            <Text style={styles.emptySubtitle}>
              Crea tu primer platillo con sus ingredientes
            </Text>
            <Button
              title="Crear platillo"
              onPress={() => router.push('/platillos/crear')}
              style={styles.emptyButton}
            />
          </Card>
        ) : (
          platillos.map(renderPlatilloItem)
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.md,
    paddingTop: 0,
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  newButton: {
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    flex: 1,
    color: Colors.error,
    fontSize: FontSizes.body,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
  },
  emptyTitle: {
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    marginTop: Spacing.sm,
  },
  itemCard: {
    marginBottom: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemNombre: {
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemDetail: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  itemActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
  },
});
