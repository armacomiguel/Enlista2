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
import { Ingrediente, Unidad } from '@/lib/types';
import { useInventarioStore } from '@/store/inventario-store';

interface IngredienteFormProps {
  ingrediente?: Ingrediente;
  /** Solo al crear: a qué lista va el ingrediente (default: refri/inventario). */
  destino?: 'super' | 'inventario';
}

const UNIDADES: { value: Unidad; label: string }[] = [
  { value: 'pza', label: 'Pza' },
  { value: 'tza', label: 'Tza' },
  { value: 'gr', label: 'gr' },
  { value: 'kg', label: 'kg' },
];

export function IngredienteForm({ ingrediente, destino = 'inventario' }: IngredienteFormProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createIngrediente, updateIngrediente, loading } = useInventarioStore();

  const [nombre, setNombre] = useState(ingrediente?.nombre || '');
  const [cantidad, setCantidad] = useState(ingrediente?.cantidad?.toString() || '');
  const [unidad, setUnidad] = useState<Unidad>(ingrediente?.unidad || 'pza');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    const cant = parseFloat(cantidad);
    if (!cantidad || isNaN(cant) || cant <= 0) {
      newErrors.cantidad = 'Cantidad inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const data = {
        nombre: nombre.trim(),
        cantidad: parseFloat(cantidad),
        unidad,
      };

      if (ingrediente) {
        // Conservar el estado de compra al editar (el toggle vive en la lista)
        await updateIngrediente(ingrediente.id, {
          ...data,
          comprado: ingrediente.comprado,
        });
      } else {
        await createIngrediente({ ...data, destino });
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el ingrediente');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {ingrediente
            ? 'Editar Ingrediente'
            : destino === 'super'
              ? 'Agregar a Lista de Súper'
              : 'Agregar Ingrediente'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formCard}>
          <Input
            label="Nombre del ingrediente *"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Pan, Jamón, Queso"
            containerStyle={styles.input}
          />
          {errors.nombre ? <Text style={styles.errorText}>{errors.nombre}</Text> : null}

          <View style={styles.row}>
            <View style={styles.cantidadContainer}>
              <Input
                label="Cantidad *"
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
                placeholder="0"
                containerStyle={styles.input}
              />
              {errors.cantidad ? (
                <Text style={styles.errorText}>{errors.cantidad}</Text>
              ) : null}
            </View>

            <View style={styles.unidadContainer}>
              <Text style={styles.label}>Unidad</Text>
              <View style={styles.unidadButtons}>
                {UNIDADES.map((u) => (
                  <TouchableOpacity
                    key={u.value}
                    style={[
                      styles.unidadButton,
                      unidad === u.value && styles.unidadButtonActive,
                    ]}
                    onPress={() => setUnidad(u.value)}
                  >
                    <Text
                      style={[
                        styles.unidadText,
                        unidad === u.value && styles.unidadTextActive,
                      ]}
                    >
                      {u.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Spacing.md + insets.bottom }]}>
        <Button
          title={
            loading
              ? 'Guardando...'
              : ingrediente
                ? 'Guardar cambios'
                : destino === 'super'
                  ? 'Agregar a la lista'
                  : 'Agregar ingrediente'
          }
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
    paddingBottom: Spacing.md,
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
