import { create } from 'zustand';
import { Platillo, PlatilloIngrediente } from '@/lib/types';
import * as platillosService from '@/lib/platillos-service';

interface PlatillosState {
  platillos: Platillo[];
  loading: boolean;
  error: string | null;
  fetchPlatillos: () => Promise<void>;
  createPlatillo: (data: {
    nombre: string;
    descripcion?: string;
    ingredientes: PlatilloIngrediente[];
  }) => Promise<string>;
  updatePlatillo: (
    id: string,
    data: {
      nombre: string;
      descripcion?: string;
      ingredientes: PlatilloIngrediente[];
    }
  ) => Promise<void>;
  deletePlatillo: (id: string) => Promise<void>;
}

export const usePlatillosStore = create<PlatillosState>((set, get) => ({
  platillos: [],
  loading: false,
  error: null,

  fetchPlatillos: async () => {
    set({ loading: true, error: null });
    try {
      const platillos = await platillosService.getPlatillos();
      set({ platillos, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error al cargar platillos', loading: false });
    }
  },

  createPlatillo: async (data) => {
    set({ loading: true, error: null });
    try {
      const id = await platillosService.createPlatillo(data);
      await get().fetchPlatillos();
      return id;
    } catch (error: any) {
      set({ error: error.message || 'Error al crear platillo', loading: false });
      throw error;
    }
  },

  updatePlatillo: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await platillosService.updatePlatillo(id, data);
      await get().fetchPlatillos();
    } catch (error: any) {
      set({ error: error.message || 'Error al actualizar platillo', loading: false });
      throw error;
    }
  },

  deletePlatillo: async (id) => {
    set({ loading: true, error: null });
    try {
      await platillosService.deletePlatillo(id);
      set((state) => ({
        platillos: state.platillos.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error al eliminar platillo', loading: false });
      throw error;
    }
  },
}));
