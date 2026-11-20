import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyD8Dpuj-toPmcrAgSa1fm_umoRD0Qa3MSg',
  authDomain: 'enlista-2469f.firebaseapp.com',
  projectId: 'enlista-2469f',
  storageBucket: 'enlista-2469f.appspot.com',
  messagingSenderId: '579535498112',
  appId: '1:579535498112:android:8b3782e480b8e68377af65',
};

const app = initializeApp(firebaseConfig);

// Custom React Native persistence manager for Firebase Auth
// Based on https://expo.fyi/firebase-js-auth-setup
const rnPersistence = {
  type: 'LOCAL' as const,
  async getItem(key: string) {
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
};

let auth: ReturnType<typeof getAuth>;
try {
  auth = getAuth(app);
} catch {
  auth = initializeAuth(app, {
    persistence: rnPersistence as any,
  });
}

const db = getFirestore(app);

export { app, auth, db };
