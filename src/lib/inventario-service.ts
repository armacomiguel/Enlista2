import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase-config';
import { Ingrediente, Unidad, PlatilloIngrediente } from './types';
import { calcularSincronizacionListaSuper } from './inventario-sync';

type IngredienteDocLike = {
  id: string;
  data: () => Record<string, any>;
};

function getCollectionPath() {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');
  return `users/${user.uid}/inventario`;
}

const UNIDADES_VALIDAS: Unidad[] = ['pza', 'tza', 'gr', 'kg'];

function toIngrediente(d: IngredienteDocLike): Ingrediente {
  const data = d.data();
  const unidad: Unidad = UNIDADES_VALIDAS.includes(data.unidad) ? data.unidad : 'pza';
  const ing: Ingrediente = {
    id: d.id,
    nombre: typeof data.nombre === 'string' ? data.nombre : '',
    cantidad: typeof data.cantidad === 'number' ? data.cantidad : 0,
    unidad,
    comprado: Boolean(data.comprado),
    // Docs antiguos sin `destino` se consideran inventario (refri real)
    destino: data.destino === 'super' ? 'super' : 'inventario',
  };
  if (data.aportes && typeof data.aportes === 'object') {
    const parsed: Record<string, number> = {};
    for (const [k, v] of Object.entries(data.aportes)) {
      if (typeof v === 'number') parsed[k] = v;
    }
    ing.aportes = parsed;
  }
  return ing;
}

export function subscribeToInventario(
  callback: (ingredientes: Ingrediente[]) => void
): Unsubscribe {
  const q = query(collection(db, getCollectionPath()), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map(toIngrediente));
    },
    (error) => {
      console.error('Error en la suscripción al inventario:', error);
    }
  );
}

export async function getIngredientes(): Promise<Ingrediente[]> {
  try {
    const q = query(collection(db, getCollectionPath()), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toIngrediente);
  } catch (error) {
    console.error('Error al obtener ingredientes:', error);
    throw error;
  }
}

export async function getIngredienteById(id: string): Promise<Ingrediente | null> {
  try {
    const docRef = doc(db, getCollectionPath(), id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return toIngrediente(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error al obtener ingrediente:', error);
    throw error;
  }
}

export async function createIngrediente(data: {
  nombre: string;
  cantidad: number;
  unidad: Unidad;
  comprado?: boolean;
  destino?: 'super' | 'inventario';
  aportes?: Record<string, number>;
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, getCollectionPath()), {
      nombre: data.nombre.trim(),
      cantidad: data.cantidad,
      unidad: data.unidad,
      comprado: data.comprado || false,
      destino: data.destino || 'inventario',
      ...(data.aportes ? { aportes: data.aportes } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al crear ingrediente:', error);
    throw error;
  }
}

export async function updateIngrediente(
  id: string,
  data: {
    nombre: string;
    cantidad: number;
    unidad: Unidad;
    comprado?: boolean;
  }
): Promise<void> {
  try {
    const docRef = doc(db, getCollectionPath(), id);
    await updateDoc(docRef, {
      nombre: data.nombre.trim(),
      cantidad: data.cantidad,
      unidad: data.unidad,
      // Solo se escribe si viene explícitamente, para no perder el estado
      // al editar nombre/cantidad desde la pantalla de edición.
      ...(data.comprado !== undefined ? { comprado: data.comprado } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error al actualizar ingrediente:', error);
    throw error;
  }
}

export async function toggleIngredienteComprado(id: string, comprado: boolean): Promise<void> {
  try {
    const docRef = doc(db, getCollectionPath(), id);
    await updateDoc(docRef, {
      comprado,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error al actualizar estado de compra:', error);
    throw error;
  }
}

export async function deleteIngrediente(id: string): Promise<void> {
  try {
    const docRef = doc(db, getCollectionPath(), id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error al eliminar ingrediente:', error);
    throw error;
  }
}

/**
 * Elimina TODOS los ingredientes del INVENTARIO (refri) del usuario.
 * No toca la lista de súper (destino: 'super'), que se gestiona aparte.
 */
export async function deleteTodosIngredientes(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, getCollectionPath()));
    const delFridge = snapshot.docs.filter((d) => d.data().destino !== 'super');
    await Promise.all(delFridge.map((d) => deleteDoc(d.ref)));
  } catch (error) {
    console.error('Error al vaciar inventario:', error);
    throw error;
  }
}

/**
 * Refleja un platillo seleccionado en la LISTA DE SÚPER (no en el inventario):
 * - Ingredientes nuevos (nombre+unidad no existen en la lista) → se crean con comprado: false.
 * - Ingredientes que ya están pendientes → se SUMA la cantidad.
 * - Cada platillo aporta su cantidad una sola vez (mapa `aportes`): re-seleccionar
 *   el mismo platillo no infla la cantidad. Ver calcularSincronizacionListaSuper.
 * Regresa cuántas operaciones (creaciones + sumas) se aplicaron.
 */
export async function syncIngredientesAListaSuper(
  platilloId: string,
  ingredientes: PlatilloIngrediente[]
): Promise<number> {
  const todas = await getIngredientes();
  const pendientes = todas.filter((i) => i.destino === 'super');
  const ops = calcularSincronizacionListaSuper(pendientes, platilloId, ingredientes);

  await Promise.all(
    ops.map(async (op) => {
      if (op.tipo === 'crear') {
        await createIngrediente({
          nombre: op.nombre,
          cantidad: op.cantidad,
          unidad: op.unidad,
          comprado: false,
          destino: 'super',
          aportes: { [platilloId]: op.cantidad },
        });
      } else {
        // 'sumar': actualiza cantidad + aportes sin tocar nombre/unidad/comprado/destino
        const docRef = doc(db, getCollectionPath(), op.id);
        await updateDoc(docRef, {
          cantidad: op.cantidad,
          aportes: op.aportes,
          updatedAt: serverTimestamp(),
        });
      }
    })
  );

  return ops.length;
}

/**
 * "Completar lista de súper": los artículos marcados como comprados (comprado: true)
 * pasan al inventario (el refri real), como si acabaras de abastecerlo:
 * - Si ya existe un ingrediente con el mismo nombre+unidad en el refri, se suma su cantidad.
 * - Si no, el artículo cambia de destino a 'inventario' (conserva su doc, sin `aportes`).
 * - Los NO comprados permanecen en la lista para la próxima vuelta.
 * Regresa cuántos artículos pasaron al inventario.
 */
export async function completarListaSuper(): Promise<number> {
  const todas = await getIngredientes();
  const comprados = todas.filter((i) => i.destino === 'super' && i.comprado);
  const refri = todas.filter((i) => i.destino !== 'super');

  let movidos = 0;
  for (const item of comprados) {
    const clave = `${item.nombre.trim().toLowerCase()}|${item.unidad}`;
    const existente = refri.find(
      (f) => `${f.nombre.trim().toLowerCase()}|${f.unidad}` === clave
    );
    if (existente) {
      // Abastecer: sumar al refri y quitar el de la lista
      await updateDoc(doc(db, getCollectionPath(), existente.id), {
        cantidad: existente.cantidad + item.cantidad,
        comprado: false,
        updatedAt: serverTimestamp(),
      });
      await deleteDoc(doc(db, getCollectionPath(), item.id));
      existente.cantidad += item.cantidad; // por si hay más ítems con la misma clave
    } else {
      await updateDoc(doc(db, getCollectionPath(), item.id), {
        destino: 'inventario',
        comprado: false,
        aportes: {},
        updatedAt: serverTimestamp(),
      });
    }
    movidos++;
  }
  return movidos;
}

/**
 * "Comer" un platillo: descuenta sus ingredientes del INVENTARIO (refri real),
 * como en la vida real: si usas 3 huevos de una caja de 12, quedan 9; si el
 * stock llega a 0, se quita la partida. No toca la lista de súper.
 * Coincidencia por nombre (sin mayúsculas/espacios) y unidad.
 */
export async function consumirIngredientesDePlatillo(
  ingredientes: PlatilloIngrediente[]
): Promise<void> {
  const todas = await getIngredientes();
  const refri = todas.filter((i) => i.destino !== 'super');

  // Suma lo requerido por clave nombre+unidad (repeticiones dentro de la receta)
  const requerido = new Map<string, number>();
  for (const ing of ingredientes) {
    const nombre = ing.nombre.trim();
    if (!nombre) continue;
    const clave = `${nombre.toLowerCase()}|${ing.unidad}`;
    requerido.set(clave, (requerido.get(clave) ?? 0) + ing.cantidad);
  }

  for (const [clave, cantidad] of requerido) {
    let falta = cantidad;
    for (const partida of refri) {
      if (falta <= 0) break;
      const clavePartida = `${partida.nombre.trim().toLowerCase()}|${partida.unidad}`;
      if (clavePartida !== clave) continue;
      const usado = Math.min(partida.cantidad, falta);
      const restante = partida.cantidad - usado;
      if (restante <= 0) {
        await deleteDoc(doc(db, getCollectionPath(), partida.id));
      } else {
        await updateDoc(doc(db, getCollectionPath(), partida.id), {
          cantidad: restante,
          updatedAt: serverTimestamp(),
        });
      }
      partida.cantidad = restante; // refleja el descuento para otras lecturas
      falta -= usado;
    }
    // Si no alcanzó el stock (p. ej. carrera de datos), no se descuenta de más
  }
}
