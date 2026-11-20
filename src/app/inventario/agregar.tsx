import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { IngredienteForm } from '@/components/IngredienteForm';

export default function AgregarIngredienteScreen() {
  const { destino } = useLocalSearchParams<{ destino?: string }>();
  return <IngredienteForm destino={destino === 'super' ? 'super' : 'inventario'} />;
}
