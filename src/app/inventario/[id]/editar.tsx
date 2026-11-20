import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IngredienteForm } from '@/components/IngredienteForm';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { Ingrediente } from '@/lib/types';
import { getIngredienteById } from '@/lib/inventario-service';

export default function EditarIngredienteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [ingrediente, setIngrediente] = useState<Ingrediente | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIngrediente = async () => {
      if (!id) return;
      try {
        const data = await getIngredienteById(id);
        setIngrediente(data);
      } catch (error) {
        console.error('Error al cargar ingrediente:', error);
      } finally {
        setLoading(false);
      }
    };
    loadIngrediente();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!ingrediente) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.errorText}>Ingrediente no encontrado</Text>
      </View>
    );
  }

  return <IngredienteForm ingrediente={ingrediente} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
});
