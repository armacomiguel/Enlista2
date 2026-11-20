import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { Platillo, PlatilloIngrediente, Unidad } from '@/lib/types';
import { usePlatillosStore } from '@/store/platillos-store';

interface PlatilloFormProps {
  platillo?: Platillo;
}

const UNIDADES: { value: Unidad; label: string }[] = [
  { value: 'pza', label: 'Pza' },
  { value: 'tza', label: 'Tza' },
  { value: 'gr', label: 'gr' },
  { value: 'kg', label: 'kg' },
];

export function PlatilloForm({ platillo }: PlatilloFormProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createPlatillo, updatePlatillo, loading } = usePlatillosStore();

  const [nombre, setNombre] = useState(platillo?.nombre || '');
  const [ingredientes, setIngredientes] = useState<PlatilloIngrediente[]>(
    platillo?.ingredientes || []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Índice del ingrediente con sus campos visibles; los demás se muestran colapsados
  const [expandido, setExpandido] = useState<number | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (ingredientes.length === 0) {
      newErrors.ingredientes = 'Agrega al menos un ingrediente';
    } else {
      ingredientes.forEach((ing, index) => {
        if (!ing.nombre.trim()) {
          newErrors[`ingrediente_${index}_nombre`] = 'Nombre requerido';
        }
        if (ing.cantidad <= 0) {
          newErrors[`ingrediente_${index}_cantidad`] = 'Cantidad inválida';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const data = {
        nombre: nombre.trim(),
        ingredientes: ingredientes.map((ing) => ({
          ...ing,
          nombre: ing.nombre.trim(),
        })),
      };

      if (platillo) {
        await updatePlatillo(platillo.id, data);
      } else {
        await createPlatillo(data);
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el platillo');
    }
  };

  const addIngrediente = () => {
    const newIndex = ingredientes.length;
    setIngredientes([...ingredientes, { nombre: '', cantidad: 0, unidad: 'pza' }]);
    // El anterior se colapsa: solo el nuevo queda editable
    setExpandido(newIndex);
  };

  const removeIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
    setExpandido((prev) => {
      if (prev === null) return null;
      if (prev > index) return prev - 1;
      if (prev === index) return null;
      return prev;
    });
  };

  const updateIngrediente = (
    index: number,
    field: keyof PlatilloIngrediente,
    value: string | number | Unidad
  ) => {
    const updated = [...ingredientes];
    updated[index] = { ...updated[index], [field]: value };
    setIngredientes(updated);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {platillo ? 'Editar Platillo' : 'Crear Platillo'}
        </Text>
      </View>

      <View style={styles.body}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <Card style={styles.formCard}>
            <Input
              label="Nombre del platillo *"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Tacos de pastor"
              containerStyle={styles.input}
            />
            {errors.nombre ? <Text style={styles.errorText}>{errors.nombre}</Text> : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredientes *</Text>
            </View>
            {errors.ingredientes ? (
              <Text style={styles.errorText}>{errors.ingredientes}</Text>
            ) : null}

            {ingredientes.map((ingrediente, index) => {
              const isOpen = expandido === index;
              const tieneError = Boolean(
                errors[`ingrediente_${index}_nombre`] ||
                  errors[`ingrediente_${index}_cantidad`]
              );
              return (
                <Card key={index} style={styles.ingredienteCard}>
                  <TouchableOpacity
                    style={styles.ingredienteHeader}
                    onPress={() => setExpandido(isOpen ? null : index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.ingredienteNumber}>#{index + 1}</Text>
                    {!isOpen ? (
                      <Text
                        style={[
                          styles.ingredienteResumen,
                          !ingrediente.nombre.trim() && styles.ingredienteResumenVacio,
                        ]}
                        numberOfLines={1}
                      >
                        {ingrediente.nombre.trim() || 'Sin nombre'} ·{' '}
                        {ingrediente.cantidad} {ingrediente.unidad}
                      </Text>
                    ) : null}
                    {isOpen ? null : tieneError ? (
                      <Ionicons name="alert-circle" size={18} color={Colors.error} />
                    ) : null}
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.textSecondary}
                    />
                    <TouchableOpacity onPress={() => removeIngrediente(index)}>
                      <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {isOpen ? (
                    <>
                      <Input
                        label="Nombre *"
                        value={ingrediente.nombre}
                        onChangeText={(text) => updateIngrediente(index, 'nombre', text)}
                        placeholder="Ej: Carne de cerdo"
                        containerStyle={styles.input}
                      />
                      {errors[`ingrediente_${index}_nombre`] ? (
                        <Text style={styles.errorText}>
                          {errors[`ingrediente_${index}_nombre`]}
                        </Text>
                      ) : null}

                      <View style={styles.row}>
                        <View style={styles.cantidadContainer}>
                          <Input
                            label="Cantidad *"
                            value={ingrediente.cantidad.toString()}
                            onChangeText={(text) => {
                              const num = parseFloat(text) || 0;
                              updateIngrediente(index, 'cantidad', num);
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                            containerStyle={styles.input}
                          />
                          {errors[`ingrediente_${index}_cantidad`] ? (
                            <Text style={styles.errorText}>
                              {errors[`ingrediente_${index}_cantidad`]}
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.unidadContainer}>
                          <Text style={styles.label}>Unidad</Text>
                          <View style={styles.unidadButtons}>
                            {UNIDADES.map((unidad) => (
                              <TouchableOpacity
                                key={unidad.value}
                                style={[
                                  styles.unidadButton,
                                  ingrediente.unidad === unidad.value && styles.unidadButtonActive,
                                ]}
                                onPress={() => updateIngrediente(index, 'unidad', unidad.value)}
                              >
                                <Text
                                  style={[
                                    styles.unidadText,
                                    ingrediente.unidad === unidad.value && styles.unidadTextActive,
                                  ]}
                                >
                                  {unidad.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                    </>
                  ) : null}
                </Card>
              );
            })}
          </Card>
        </ScrollView>

        {/* FAB: siempre visible; flota en la zona de scroll, encima del footer */}
        <TouchableOpacity
          onPress={addIngrediente}
          style={styles.fab}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Agregar ingrediente"
        >
          <Ionicons name="add" size={28} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      <View style={[styles.footer, { paddingBottom: Spacing.md + insets.bottom }]}>
        <Button
          title={loading ? 'Guardando...' : platillo ? 'Guardar cambios' : 'Crear platillo'}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        />
      </View>

      {loading && (
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
  content: {
    padding: Spacing.md,
    paddingBottom: 96, // espacio para que el FAB no tape el último ingrediente
  },
  body: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 5,
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
  formCard: {
    marginBottom: Spacing.md,
  },
  input: {
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  ingredienteCard: {
    backgroundColor: Colors.surfaceLight,
    marginBottom: Spacing.sm,
  },
  ingredienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ingredienteNumber: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  ingredienteResumen: {
    flex: 1,
    fontSize: FontSizes.caption,
    color: Colors.textPrimary,
  },
  ingredienteResumenVacio: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cantidadContainer: {
    flex: 1,
  },
  unidadContainer: {
    flex: 1.5,
  },
  label: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  unidadButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  unidadButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unidadButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unidadText: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  unidadTextActive: {
    color: Colors.surface,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.caption,
    marginBottom: Spacing.sm,
    marginTop: -Spacing.xs,
  },
  footer: {
    padding: Spacing.md,
    paddingBottom: Spacing.md,
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
