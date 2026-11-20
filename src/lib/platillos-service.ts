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
} from 'firebase/firestore';
import { db } from './firebase-config';
import { Platillo, PlatilloIngrediente } from './types';

const COLLECTION_NAME = 'platillos';

export async function getPlatillos(): Promise<Platillo[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || null,
    })) as Platillo[];
  } catch (error) {
    console.error('Error al obtener platillos:', error);
    throw error;
  }
}

export async function getPlatilloById(id: string): Promise<Platillo | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.() || null,
        updatedAt: docSnap.data().updatedAt?.toDate?.() || null,
      } as Platillo;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener platillo:', error);
    throw error;
  }
}

export async function createPlatillo(data: {
  nombre: string;
  descripcion?: string;
  ingredientes: PlatilloIngrediente[];
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || '',
      ingredientes: data.ingredientes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al crear platillo:', error);
    throw error;
  }
}

export async function updatePlatillo(
  id: string,
  data: {
    nombre: string;
    descripcion?: string;
    ingredientes: PlatilloIngrediente[];
  }
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || '',
      ingredientes: data.ingredientes,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error al actualizar platillo:', error);
    throw error;
  }
}

export async function deletePlatillo(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error al eliminar platillo:', error);
    throw error;
  }
}
