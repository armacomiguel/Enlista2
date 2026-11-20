import React, { useEffect, useMemo, useState } from 'react';
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
import { useInventarioStore } from '@/store/inventario-store';
import { getCurrentUser } from '@/lib/firebase/auth';
import { Ingrediente } from '@/lib/types';

type ModoVista = 'inventario' | 'super';

export default function InventarioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [modo, setModo] = useState<ModoVista>('inventario');
  const {
    ingredientes,
    loading,
    error,
    fetchIngredientes,
    subscribeToUpdates,
    toggleComprado,
    deleteIngrediente,
    deleteTodo,
    completarLista,
  } = useInventarioStore();
  const [refreshing, setRefreshing] = useState(false);
  const [completando, setCompletando] = useState(false);

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    fetchIngredientes();
    const unsubscribe = subscribeToUpdates();
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refri = destino 'inventario' (o antiguo sin campo); Súper = destino 'super'
  const refri = useMemo(
    () => ingredientes.filter((i) => i.destino !== 'super'),
    [ingredientes]
  );
  const superLista = useMemo(
    () => ingredientes.filter((i) => i.destino === 'super'),
    [ingredientes]
  );
  const comprados = superLista.filter((i) => i.comprado);
  const visibles = modo === 'super' ? superLista : refri;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIngredientes();
    setRefreshing(false);
  };

  const handleDeleteIngrediente = (ingrediente: Ingrediente) => {
    Alert.alert(
      'Eliminar ingrediente',
      `¿Estás seguro de eliminar "${ingrediente.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIngrediente(ingrediente.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el ingrediente');
            }
          },
        },
      ]
    );
  };

  const handleToggleComprado = async (ingrediente: Ingrediente) => {
    try {
      await toggleComprado(ingrediente.id, !ingrediente.comprado);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el estado');
    }
  };

  const handleVaciarInventario = () => {
    if (refri.length === 0) return;
    Alert.alert(
      'Vaciar inventario',
      `¿Estás seguro de eliminar los ${refri.length} ingredientes del refri? La lista de súper no se toca. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTodo();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo vaciar el inventario');
            }
          },
        },
      ]
    );
  };

  const handleCompletarLista = () => {
    if (comprados.length === 0) return; // botón deshabilitado
    Alert.alert(
      'Completar lista de súper',
      `¿Pasar ${comprados.length} ingrediente(s) comprados a tu inventario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async () => {
            setCompletando(true);
            try {
              await completarLista();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo completar la lista');
            } finally {
              setCompletando(false);
            }
          },
        },
      ]
    );
  };

  const renderIngredienteItem = (ingrediente: Ingrediente) => (
    <Card key={ingrediente.id} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        {modo === 'super' ? (
          // Un tap en el item completo marca/desmarca el check
          <TouchableOpacity
            style={styles.superRow}
            onPress={() => handleToggleComprado(ingrediente)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={ingrediente.comprado ? 'checkbox' : 'square-outline'}
              size={24}
              color={ingrediente.comprado ? Colors.success : Colors.textSecondary}
            />
            <View style={styles.itemInfo}>
              <Text
                style={[
                  styles.itemNombre,
                  ingrediente.comprado && styles.itemNombreComprado,
                ]}
              >
                {ingrediente.nombre}
              </Text>
              <Text style={styles.itemDetail}>
                {ingrediente.cantidad} {ingrediente.unidad}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.itemInfo}>
            <Text style={styles.itemNombre}>{ingrediente.nombre}</Text>
            <Text style={styles.itemDetail}>
              {ingrediente.cantidad} {ingrediente.unidad}
            </Text>
          </View>
        )}
        <View style={styles.itemActions}>
          <TouchableOpacity
            onPress={() => router.push(`/inventario/${ingrediente.id}/editar` as any)}
            style={styles.actionButton}
          >
            <Ionicons name="pencil" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteIngrediente(ingrediente)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderEmpty = () => {
    if (modo === 'super') {
      return (
        <Card style={styles.emptyCard}>
          <Ionicons name="cart-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Lista vacía</Text>
          <Text style={styles.emptySubtitle}>
            Marca los platillos que vas a comer en {'Seleccionar platillos'}{' '}
            y sus ingredientes aparecerán aquí
          </Text>
        </Card>
      );
    }
    return (
      <Card style={styles.emptyCard}>
        <Ionicons name="cube-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>Sin ingredientes</Text>
        <Text style={styles.emptySubtitle}>
          Agrega los ingredientes que ya tienes en casa
        </Text>
        <Button
          title="Agregar ingrediente"
          onPress={() => router.push('/inventario/agregar')}
          style={styles.emptyButton}
        />
      </Card>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Inventario</Text>
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
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, modo === 'inventario' && styles.toggleButtonActive]}
            onPress={() => setModo('inventario')}
          >
            <Text style={[styles.toggleText, modo === 'inventario' && styles.toggleTextActive]}>
              Inventario
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, modo === 'super' && styles.toggleButtonActive]}
            onPress={() => setModo('super')}
          >
            <Text style={[styles.toggleText, modo === 'super' && styles.toggleTextActive]}>
              Lista de súper
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {modo === 'super' ? 'Lista de súper' : 'Tu inventario'}
          </Text>
          {modo === 'super' && comprados.length > 0 ? (
            <Text style={styles.sectionCount}>{comprados.length} comprado(s)</Text>
          ) : null}
          <View style={styles.headerActions}>
            {modo === 'inventario' ? (
              <Button
                title="Vaciar"
                onPress={handleVaciarInventario}
                variant="danger"
                size="small"
                disabled={refri.length === 0}
              />
            ) : null}
            <Button
              title="Nuevo"
              onPress={() =>
                modo === 'super'
                  ? router.push('/inventario/agregar?destino=super' as any)
                  : router.push('/inventario/agregar')
              }
              size="small"
              style={styles.newButton}
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {loading && visibles.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : visibles.length === 0 ? (
          renderEmpty()
        ) : (
          visibles.map(renderIngredienteItem)
        )}
      </ScrollView>

      {modo === 'super' ? (
        <View style={[styles.footer, { paddingBottom: Spacing.md + insets.bottom }]}>
          <Button
            title={completando ? 'Completando...' : 'Completar lista'}
            onPress={handleCompletarLista}
            disabled={comprados.length === 0 || completando}
            style={styles.submitButton}
          />
        </View>
      ) : null}

      {completando && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    flex: 1,
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  sectionCount: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.success,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
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
  superRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginRight: Spacing.md,
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
  itemNombreComprado: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
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
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    marginTop: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
