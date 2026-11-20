import { create } from 'zustand';
import { Ingrediente, Unidad } from '@/lib/types';
import * as inventarioService from '@/lib/inventario-service';

interface InventarioState {
  ingredientes: Ingrediente[];
  loading: boolean;
  error: string | null;
  fetchIngredientes: () => Promise<void>;
  subscribeToUpdates: () => () => void;
  createIngrediente: (data: {
    nombre: string;
    cantidad: number;
    unidad: Unidad;
    comprado?: boolean;
    destino?: 'super' | 'inventario';
  }) => Promise<string>;
  updateIngrediente: (
    id: string,
    data: {
      nombre: string;
      cantidad: number;
      unidad: Unidad;
      comprado?: boolean;
    }
  ) => Promise<void>;
  toggleComprado: (id: string, comprado: boolean) => Promise<void>;
  deleteIngrediente: (id: string) => Promise<void>;
  deleteTodo: () => Promise<void>;
  completarLista: () => Promise<number>;
}

export const useInventarioStore = create<InventarioState>((set, get) => ({
  ingredientes: [],
  loading: false,
  error: null,

  fetchIngredientes: async () => {
    set({ loading: true, error: null });
    try {
      const ingredientes = await inventarioService.getIngredientes();
      set({ ingredientes, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error al cargar ingredientes', loading: false });
    }
  },

  subscribeToUpdates: () => {
    return inventarioService.subscribeToInventario((ingredientes) => {
      set({ ingredientes });
    });
  },

  createIngrediente: async (data) => {
    set({ loading: true, error: null });
    try {
      const id = await inventarioService.createIngrediente(data);
      await get().fetchIngredientes();
      return id;
    } catch (error: any) {
      set({ error: error.message || 'Error al crear ingrediente', loading: false });
      throw error;
    }
  },

  updateIngrediente: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await inventarioService.updateIngrediente(id, data);
      await get().fetchIngredientes();
    } catch (error: any) {
      set({ error: error.message || 'Error al actualizar ingrediente', loading: false });
      throw error;
    }
  },

  toggleComprado: async (id, comprado) => {
    try {
      await inventarioService.toggleIngredienteComprado(id, comprado);
    } catch (error: any) {
      set({ error: error.message || 'Error al actualizar estado' });
      throw error;
    }
  },

  deleteIngrediente: async (id) => {
    set({ loading: true, error: null });
    try {
      await inventarioService.deleteIngrediente(id);
      set((state) => ({
        ingredientes: state.ingredientes.filter((i) => i.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error al eliminar ingrediente', loading: false });
      throw error;
    }
  },

  deleteTodo: async () => {
    set({ loading: true, error: null });
    try {
      await inventarioService.deleteTodosIngredientes();
      // Solo se vació el refri; la lista de súper se conserva
      set((state) => ({
        ingredientes: state.ingredientes.filter((i) => i.destino === 'super'),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error al vaciar inventario', loading: false });
      throw error;
    }
  },

  completarLista: async () => {
    try {
      return await inventarioService.completarListaSuper();
    } catch (error: any) {
      set({ error: error.message || 'Error al completar la lista' });
      throw error;
    }
  },
}));
