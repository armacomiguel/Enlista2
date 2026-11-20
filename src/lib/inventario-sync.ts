import { Ingrediente, PlatilloIngrediente, Unidad } from './types';

export type OperacionSync =
  | { tipo: 'crear'; nombre: string; cantidad: number; unidad: Unidad }
  | { tipo: 'sumar'; id: string; cantidad: number; aportes: Record<string, number> };

/**
 * Calcula las operaciones para reflejar un platillo seleccionado en la LISTA DE SÚPER.
 * - Coincidencia por nombre (sin mayúsculas/espacios) Y unidad: la cantidad se SUMA.
 * - Cada platillo aporta su cantidad una sola vez (mapa `aportes` por platilloId):
 *   desmarcar y volver a marcar no infla la cantidad; editar la receta ajusta el delta.
 * - Si no existe con ese nombre+unidad, se crea como artículo nuevo de la lista.
 * - Dentro de un mismo platillo, repeticiones del mismo ingrediente se acumulan.
 * Puro: no toca Firebase, para poder probarse y reutilizarse aparte.
 */
export function calcularSincronizacionListaSuper(
  pendientes: Ingrediente[],
  platilloId: string,
  ingredientes: PlatilloIngrediente[]
): OperacionSync[] {
  // Agrega la receta por clave nombre+unidad
  const receta = new Map<string, { nombre: string; cantidad: number; unidad: Unidad }>();
  for (const ing of ingredientes) {
    const nombre = ing.nombre.trim();
    if (!nombre) continue;
    const clave = `${nombre.toLowerCase()}|${ing.unidad}`;
    const prev = receta.get(clave);
    receta.set(
      clave,
      prev ? { ...prev, cantidad: prev.cantidad + ing.cantidad } : { nombre, cantidad: ing.cantidad, unidad: ing.unidad }
    );
  }

  const porClave = new Map<string, Ingrediente>();
  for (const ex of pendientes) {
    const clave = `${ex.nombre.trim().toLowerCase()}|${ex.unidad}`;
    if (!porClave.has(clave)) porClave.set(clave, ex);
  }

  const ops: OperacionSync[] = [];
  for (const [clave, ing] of receta) {
    const pendiente = porClave.get(clave);
    if (!pendiente) {
      ops.push({ tipo: 'crear', nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad });
      continue;
    }

    const aportePrevio = pendiente.aportes?.[platilloId] ?? 0;
    const delta = ing.cantidad - aportePrevio;
    if (delta === 0) continue; // ya aportado igual antes (re-check) → no duplica

    const aportes = { ...(pendiente.aportes ?? {}), [platilloId]: ing.cantidad };
    ops.push({
      tipo: 'sumar',
      id: pendiente.id,
      cantidad: Math.max(0, pendiente.cantidad + delta),
      aportes,
    });
  }

  return ops;
}

/**
 * Dados los ingredientes de una receta y el inventario (refri real), devuelve
 * lo que FALTA para poder armar el platillo (con la cantidad en déficit).
 * - Solo cuenta el refri: los artículos en lista de súper (destino: 'super') se ignoran.
 * - Coincidencia por nombre (sin mayúsculas/espacios) Y unidad.
 * - Suma stock de partidas duplicadas del mismo nombre+unidad.
 * Lista vacía = el platillo se puede armar.
 */
export function calcularFaltantesParaArmar(
  ingredientesReceta: PlatilloIngrediente[],
  inventario: Ingrediente[]
): PlatilloIngrediente[] {
  const stock = new Map<string, number>();
  for (const ing of inventario) {
    if (ing.destino === 'super') continue; // lo pendiente de comprar no está en el refri
    const clave = `${ing.nombre.trim().toLowerCase()}|${ing.unidad}`;
    stock.set(clave, (stock.get(clave) ?? 0) + ing.cantidad);
  }

  const requerido = new Map<string, { nombre: string; cantidad: number; unidad: Unidad }>();
  for (const ing of ingredientesReceta) {
    const nombre = ing.nombre.trim();
    if (!nombre) continue;
    const clave = `${nombre.toLowerCase()}|${ing.unidad}`;
    const prev = requerido.get(clave);
    requerido.set(
      clave,
      prev ? { ...prev, cantidad: prev.cantidad + ing.cantidad } : { nombre, cantidad: ing.cantidad, unidad: ing.unidad }
    );
  }

  const faltantes: PlatilloIngrediente[] = [];
  for (const [clave, req] of requerido) {
    const disponible = stock.get(clave) ?? 0;
    if (disponible < req.cantidad) {
      faltantes.push({ nombre: req.nombre, cantidad: req.cantidad - disponible, unidad: req.unidad });
    }
  }
  return faltantes;
}
