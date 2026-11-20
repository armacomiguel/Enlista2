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
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { usePlatillosStore } from '@/store/platillos-store';
import { useComidasStore } from '@/store/comidas-store';
import { syncIngredientesAListaSuper } from '@/lib/inventario-service';
import { getCurrentUser } from '@/lib/firebase/auth';
import { Platillo } from '@/lib/types';

/**
 * Tab "Platillos" = "Seleccionar platillos": el usuario marca con un check los
 * platillos que va a comer.
 * - Al marcar: el platillo entra a "A comer" y sus ingredientes se SUMAN a la
 *   LISTA DE SÚPER por nombre+unidad (destino: 'super'). Cada platillo aporta su
 *   cantidad una sola vez: desmarcar y volver a marcar no infla la cantidad.
 * - Al desmarcar: solo se quita de "A comer"; la lista de súper NO se toca.
 * La gestión del catálogo (crear/editar platillos) vive en /platillos, accesible
 * desde el Home.
 */
export default function GestionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { platillos, loading: cargandoPlatillos, fetchPlatillos } = usePlatillosStore();
  const { comidas, subscribeToUpdates, addComida, removeComida } = useComidasStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    fetchPlatillos();
    const unsubscribe = subscribeToUpdates();
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlatillos();
    setRefreshing(false);
  };

  const findComida = (platilloId: string) =>
    comidas.find((c) => c.platilloId === platilloId) || null;

  const handleToggle = async (platillo: Platillo) => {
    const comida = findComida(platillo.id);
    try {
      if (comida) {
        await removeComida(comida.id);
      } else {
        await addComida(platillo.id);
        try {
          await syncIngredientesAListaSuper(platillo.id, platillo.ingredientes);
        } catch (syncError) {
          console.warn('No se sincronizaron ingredientes a la lista de súper:', syncError);
          Alert.alert(
            'Aviso',
            'El platillo se agregó a "A comer", pero no se pudo actualizar tu lista de súper.'
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar la selección');
    }
  };

  const renderPlatilloItem = (platillo: Platillo) => {
    const seleccionado = Boolean(findComida(platillo.id));
    return (
      <Card key={platillo.id} style={styles.itemCard}>
        <TouchableOpacity
          style={styles.itemRow}
          onPress={() => handleToggle(platillo)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={seleccionado ? 'checkbox' : 'square-outline'}
            size={26}
            color={seleccionado ? Colors.success : Colors.textSecondary}
          />
          <View style={styles.itemInfo}>
            <Text
              style={[
                styles.itemNombre,
                seleccionado && styles.itemNombreSeleccionado,
              ]}
            >
              {platillo.nombre}
            </Text>
            <Text style={styles.itemDetail}>
              {platillo.ingredientes.length} ingrediente(s)
            </Text>
          </View>
          {seleccionado ? (
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          ) : null}
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Seleccionar platillos</Text>
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
        <Text style={styles.hint}>
          Marca los platillos que vas a comer. Sus ingredientes se agregan a tu
          lista de súper.
        </Text>

        {cargandoPlatillos && platillos.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : platillos.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Sin platillos</Text>
            <Text style={styles.emptySubtitle}>
              Primero crea tus platillos para poder seleccionarlos
            </Text>
          </Card>
        ) : (
          platillos.map(renderPlatilloItem)
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Spacing.md + insets.bottom }]}>
        <Button
          title="Agregar nuevo platillo"
          onPress={() => router.push('/platillos/crear')}
          style={styles.submitButton}
        />
      </View>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
  hint: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
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
  },
  itemCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemNombreSeleccionado: {
    color: Colors.success,
  },
  itemDetail: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    marginTop: 0,
  },
});
