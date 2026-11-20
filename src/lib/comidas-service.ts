import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase-config';
import { ComidaElegida } from './types';

function getCollectionPath() {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');
  return `users/${user.uid}/comidas`;
}

type ComidaDocLike = {
  id: string;
  data: () => Record<string, any>;
};

function toComida(d: ComidaDocLike): ComidaElegida {
  const data = d.data();
  return {
    id: d.id,
    platilloId: typeof data.platilloId === 'string' ? data.platilloId : '',
    fechaAgregada: data.createdAt?.toDate?.() || null,
  };
}

export function subscribeToComidas(
  callback: (comidas: ComidaElegida[]) => void
): Unsubscribe {
  const q = query(collection(db, getCollectionPath()), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map(toComida));
    },
    (error) => {
      console.error('Error en la suscripción a comidas:', error);
    }
  );
}

export async function getComidas(): Promise<ComidaElegida[]> {
  try {
    const q = query(collection(db, getCollectionPath()), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toComida);
  } catch (error) {
    console.error('Error al obtener comidas:', error);
    throw error;
  }
}

export async function addComida(platilloId: string): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, getCollectionPath()), {
      platilloId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al agregar comida:', error);
    throw error;
  }
}

export async function removeComida(id: string): Promise<void> {
  try {
    const docRef = doc(db, getCollectionPath(), id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error al quitar comida:', error);
    throw error;
  }
}
