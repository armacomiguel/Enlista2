export interface Ingrediente {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: Unidad;
  comprado?: boolean;
  /** 'super' = está en la lista de súper (falta comprarlo). Sin campo o 'inventario' = está en el refri. */
  destino?: 'super' | 'inventario';
  /** Cuánto aportó cada platillo seleccionado (platilloId → cantidad). Solo usado por la sincronización. */
  aportes?: Record<string, number>;
}

export interface PlatilloIngrediente {
  nombre: string;
  cantidad: number;
  unidad: Unidad;
}

export interface Platillo {
  id: string;
  nombre: string;
  descripcion?: string;
  ingredientes: PlatilloIngrediente[];
  createdAt?: any;
  updatedAt?: any;
}

export interface ComidaElegida {
  id: string;
  platilloId: string;
  fechaAgregada?: any;
}

export type Unidad = 'pza' | 'tza' | 'gr' | 'kg';
