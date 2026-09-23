import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { SensorReading } from './types/telemetry';

const app = initializeApp(firebaseConfig);

/* CRITICAL: The app will break without this line */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection to Firestore as mandated by skill guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline.');
    }
    return false;
  }
}

// Save a sensor reading to Firestore
export async function saveReadingToFirestore(reading: SensorReading): Promise<void> {
  const path = 'sensor_readings';
  try {
    const readingRef = doc(db, path, reading.id);
    const payload = {
      id: reading.id,
      timestamp: reading.timestamp,
      timeLabel: reading.timeLabel,
      soilMoisture: reading.soilMoisture,
      dhtTemp: reading.dhtTemp,
      dhtHumidity: reading.dhtHumidity,
      rainSensor: reading.rainSensor,
      rainAnalog: reading.rainAnalog,
      pumpActive: reading.pumpActive,
      createdAt: new Date(reading.timestamp).toISOString(),
    };
    await setDoc(readingRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${reading.id}`);
  }
}

// Fetch historical readings from Firestore on boot
export async function fetchHistoricalReadings(limitCount: number = 35): Promise<SensorReading[]> {
  const path = 'sensor_readings';
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const list: SensorReading[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: data.id || docSnap.id,
        timestamp: data.timestamp,
        timeLabel: data.timeLabel,
        soilMoisture: data.soilMoisture,
        dhtTemp: data.dhtTemp,
        dhtHumidity: data.dhtHumidity,
        rainSensor: Boolean(data.rainSensor),
        rainAnalog: Number(data.rainAnalog),
        pumpActive: Boolean(data.pumpActive),
        createdAt: data.createdAt,
      });
    });
    // Reverse to chronological ascending order
    return list.reverse();
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Real-time listener callback
export function subscribeToReadings(
  onUpdate: (readings: SensorReading[]) => void,
  limitCount: number = 35
) {
  const path = 'sensor_readings';
  const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: SensorReading[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: data.id || docSnap.id,
          timestamp: data.timestamp,
          timeLabel: data.timeLabel,
          soilMoisture: data.soilMoisture,
          dhtTemp: data.dhtTemp,
          dhtHumidity: data.dhtHumidity,
          rainSensor: Boolean(data.rainSensor),
          rainAnalog: Number(data.rainAnalog),
          pumpActive: Boolean(data.pumpActive),
          createdAt: data.createdAt,
        });
      });
      onUpdate(list.reverse());
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
