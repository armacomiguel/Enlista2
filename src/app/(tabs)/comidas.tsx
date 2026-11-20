import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { useComidasStore } from '@/store/comidas-store';
import { usePlatillosStore } from '@/store/platillos-store';
import { useInventarioStore } from '@/store/inventario-store';
import { calcularFaltantesParaArmar } from '@/lib/inventario-sync';
import { consumirIngredientesDePlatillo } from '@/lib/inventario-service';
import { getCurrentUser } from '@/lib/firebase/auth';

/**
 * "A comer": platillos seleccionados en "Seleccionar platillos".
 * - El check solo puede marcarse si el platillo está Disponible en el refri;
 *   marcarlo NO lo quita: es la antesala de "consumir".
 * - "Consumir seleccionados" (botón inferior): quita los platillos marcados de
 *   "A comer" y descuenta sus ingredientes del inventario, como cuando ya comiste.
 * - La papelera quita el platillo de "A comer" sin tocar el inventario.
 */
export default function ComidasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { comidas, loading, subscribeToUpdates, fetchComidas, removeComida } =
    useComidasStore();
  const { platillos, fetchPlatillos } = usePlatillosStore();
  const { ingredientes, fetchIngredientes, subscribeToUpdates: subscribeInventario } =
    useInventarioStore();
  const [refreshing, setRefreshing] = useState(false);
  const [consumiendo, setConsumiendo] = useState(false);
  // IDs de comida marcadas para consumir
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  // IDs de comida expandidas (acordeón de ingredientes)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    fetchPlatillos();
    fetchComidas();
    fetchIngredientes();
    const unsubComidas = subscribeToUpdates();
    const unsubInventario = subscribeInventario();
    return () => {
      unsubComidas();
      unsubInventario();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPlatillos(), fetchComidas(), fetchIngredientes()]);
    setRefreshing(false);
  };

  const platilloById = useMemo(
    () => new Map(platillos.map((p) => [p.id, p])),
    [platillos]
  );

  // Solo el refri real cuenta para armar platillos (no la lista de súper)
  const refri = useMemo(
    () => ingredientes.filter((i) => i.destino !== 'super'),
    [ingredientes]
  );

  // Comidas cuya selección tiene un platillo existente
  const seleccion = comidas.flatMap((comida) => {
    const platillo = platilloById.get(comida.platilloId);
    return platillo ? [{ comida, platillo }] : [];
  });

  const toggleMarcada = (comidaId: string) => {
    setMarcadas((prev) => {
      const next = new Set(prev);
      if (next.has(comidaId)) next.delete(comidaId);
      else next.add(comidaId);
      return next;
    });
  };

  // Acordeón: ver ingredientes del platillo (solo disponibles)
  const toggleExpandido = (comidaId: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(comidaId)) next.delete(comidaId);
      else next.add(comidaId);
      return next;
    });
  };

  const handleRemove = async (comidaId: string, nombre: string) => {
    try {
      await removeComida(comidaId);
    } catch (error: any) {
      Alert.alert('Error', error.message || `No se pudo quitar "${nombre}"`);
    }
  };

  const handleConsumir = () => {
    const pendientes = seleccion.filter(({ comida }) => marcadas.has(comida.id));
    if (pendientes.length === 0) return;
    Alert.alert(
      'Marcar como consumidas',
      `¿Confirmas que comiste ${pendientes.length} platillo(s)? Se descontarán sus ingredientes de tu inventario.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Consumir',
          onPress: async () => {
            setConsumiendo(true);
            try {
              // Secuencial: cada consumo descuenta sobre el stock restante
              for (const { comida, platillo } of pendientes) {
                await consumirIngredientesDePlatillo(platillo.ingredientes);
                await removeComida(comida.id);
              }
              setMarcadas(new Set());
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo registrar el consumo');
            } finally {
              setConsumiendo(false);
            }
          },
        },
      ]
    );
  };

  // Marcadas que siguen en la lista (si un platillo se quita, su marca se ignora)
  const numMarcadas = seleccion.reduce(
    (n, { comida }) => (marcadas.has(comida.id) ? n + 1 : n),
    0
  );

  const renderItem = ({ comida, platillo }: (typeof seleccion)[number]) => {
    const faltantes = calcularFaltantesParaArmar(platillo.ingredientes, refri);
    const disponible = faltantes.length === 0;
    const marcada = marcadas.has(comida.id);
    const expandida = disponible && expandidos.has(comida.id);

    return (
      <Card key={comida.id} style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <TouchableOpacity
            onPress={() => toggleMarcada(comida.id)}
            style={styles.checkboxContainer}
          >
            <Ionicons
              name={marcada ? 'checkbox' : 'square-outline'}
              size={26}
              color={marcada ? Colors.success : Colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.itemInfo}
            onPress={() => toggleExpandido(comida.id)}
            disabled={!disponible}
            activeOpacity={0.7}
          >
            <View style={styles.nombreRow}>
              <Text
                style={[styles.itemNombre, marcada && styles.itemNombreConsumida]}
                numberOfLines={1}
              >
                {platillo.nombre}
              </Text>
              {disponible ? (
                <Ionicons
                  name={expandida ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textSecondary}
                />
              ) : null}
            </View>
            <Text style={styles.itemDetail}>
              {platillo.ingredientes.length} ingrediente(s)
            </Text>
          </TouchableOpacity>
          <View style={styles.itemStatus}>
            <Badge
              label={disponible ? 'Disponible' : 'Faltan ingredientes'}
              variant={disponible ? 'success' : 'warning'}
            />
            <TouchableOpacity
              onPress={() => handleRemove(comida.id, platillo.nombre)}
              style={styles.actionButton}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        {expandida ? (
          <View style={styles.ingredientesContainer}>
            <Text style={styles.ingredientesTitulo}>Ingredientes:</Text>
            {platillo.ingredientes.map((ing, i) => (
              <View key={`${ing.nombre}-${i}`} style={styles.ingredienteRow}>
                <Ionicons name="ellipse" size={6} color={Colors.primary} />
                <Text style={styles.ingredienteTexto}>
                  {ing.nombre}: {ing.cantidad} {ing.unidad}
                </Text>
              </View>
            ))}
          </View>
        ) : !disponible ? (
          <View style={styles.faltantesContainer}>
            <Text style={styles.faltantesTitulo}>Faltantes:</Text>
            {faltantes.map((f) => (
              <View key={`${f.nombre}-${f.unidad}`} style={styles.faltanteRow}>
                <Ionicons name="remove-circle-outline" size={15} color="#D97706" />
                <Text style={styles.faltanTexto}>
                  {f.nombre}: faltan {f.cantidad} {f.unidad}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>A comer</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {loading && seleccion.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : seleccion.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Sin comidas elegidas</Text>
            <Text style={styles.emptySubtitle}>
              Selecciona los platillos que vas a comer y sus ingredientes
              aparecerán en tu lista de súper
            </Text>
            <Button
              title="Seleccionar platillos"
              onPress={() => router.push('/gestion')}
              style={styles.emptyButton}
            />
          </Card>
        ) : (
          <>
            <Text style={styles.hint}>
              Toca un platillo disponible para ver sus ingredientes. Marca los que ya
              comiste —aunque te faltara algo— y usa {'Consumir seleccionados'}:
              se descuenta del inventario solo lo que haya (nunca quedan negativos).
              La papelera los quita sin descontar.
            </Text>
            {seleccion.map(renderItem)}
          </>
        )}
      </ScrollView>

      {seleccion.length > 0 ? (
        <View style={[styles.footer, { paddingBottom: Spacing.md + insets.bottom }]}>
          <Button
            title={consumiendo ? 'Consumiendo...' : numMarcadas > 0 ? `Consumir seleccionados (${numMarcadas})` : 'Consumir seleccionados'}
            onPress={handleConsumir}
            disabled={numMarcadas === 0 || consumiendo}
            style={styles.submitButton}
          />
        </View>
      ) : null}

      {consumiendo && (
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
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  hint: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
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
  checkboxContainer: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  nombreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  itemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  itemNombre: {
    flex: 1,
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemNombreConsumida: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  itemDetail: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  faltantesContainer: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  faltantesTitulo: {
    fontSize: FontSizes.caption,
    fontWeight: '700',
    color: '#D97706',
  },
  faltanteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  faltanTexto: {
    fontSize: FontSizes.caption,
    color: '#D97706',
  },
  ingredientesContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  ingredientesTitulo: {
    fontSize: FontSizes.caption,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ingredienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ingredienteTexto: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
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
