import { create } from 'zustand';
import { ComidaElegida } from '@/lib/types';
import * as comidasService from '@/lib/comidas-service';

interface ComidasState {
  comidas: ComidaElegida[];
  loading: boolean;
  error: string | null;
  fetchComidas: () => Promise<void>;
  subscribeToUpdates: () => () => void;
  addComida: (platilloId: string) => Promise<string>;
  removeComida: (id: string) => Promise<void>;
}

export const useComidasStore = create<ComidasState>((set, get) => ({
  comidas: [],
  loading: false,
  error: null,

  fetchComidas: async () => {
    set({ loading: true, error: null });
    try {
      const comidas = await comidasService.getComidas();
      set({ comidas, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error al cargar comidas', loading: false });
    }
  },

  subscribeToUpdates: () => {
    return comidasService.subscribeToComidas((comidas) => {
      set({ comidas });
    });
  },

  addComida: async (platilloId) => {
    // Evita duplicados si el platillo ya está seleccionado
    const existente = get().comidas.find((c) => c.platilloId === platilloId);
    if (existente) return existente.id;
    try {
      const id = await comidasService.addComida(platilloId);
      return id;
    } catch (error: any) {
      set({ error: error.message || 'Error al agregar comida' });
      throw error;
    }
  },

  removeComida: async (id) => {
    try {
      await comidasService.removeComida(id);
      set((state) => ({
        comidas: state.comidas.filter((c) => c.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error al quitar comida' });
      throw error;
    }
  },
}));
