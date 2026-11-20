import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlatilloForm } from '@/components/PlatilloForm';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { Platillo } from '@/lib/types';
import { getPlatilloById } from '@/lib/platillos-service';

export default function EditarPlatilloScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [platillo, setPlatillo] = useState<Platillo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlatillo = async () => {
      if (!id) return;
      try {
        const data = await getPlatilloById(id);
        setPlatillo(data);
      } catch (error) {
        console.error('Error al cargar platillo:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPlatillo();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!platillo) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.errorText}>Platillo no encontrado</Text>
      </View>
    );
  }

  return <PlatilloForm platillo={platillo} />;
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
