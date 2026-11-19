import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
  enableNetwork,
  type Firestore,
} from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

/**
 * Konfigurasi resmi tunggal Firebase Cloud proyek ini.
 * Dipakai identik di semua lingkungan (Google AI Studio Preview, Vercel Website,
 * Laptop/PC, Web App Android, dan iPhone iOS) agar seluruh perangkat terhubung
 * ke satu pusat database Firestore yang sama persis.
 */
export const OFFICIAL_FIREBASE_CONFIG = {
  projectId: appletConfig.projectId || 'gold-card-583d0',
  appId: appletConfig.appId || '1:460079967969:web:793bcdcf47f9ee16f611a0',
  apiKey: appletConfig.apiKey || 'AIzaSyA2IomEIhhGVhEDHnXI8IBkKXjohSjz620',
  authDomain: appletConfig.authDomain || 'gold-card-583d0.firebaseapp.com',
  firestoreDatabaseId:
    (appletConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
    'ai-studio-simkamtibpondokp-0ca6cfda-fbeb-4a4d-91e1-25f2c74e35be',
  storageBucket: appletConfig.storageBucket || 'gold-card-583d0.firebasestorage.app',
  messagingSenderId: appletConfig.messagingSenderId || '460079967969',
  measurementId: appletConfig.measurementId || '',
};

const app = !getApps().length ? initializeApp(OFFICIAL_FIREBASE_CONFIG) : getApp();
export const FIRESTORE_DATABASE_ID = OFFICIAL_FIREBASE_CONFIG.firestoreDatabaseId;
export const FIREBASE_PROJECT_ID = OFFICIAL_FIREBASE_CONFIG.projectId;

let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    FIRESTORE_DATABASE_ID
  );
} catch {
  dbInstance = getFirestore(app, FIRESTORE_DATABASE_ID);
}

export const db: Firestore = dbInstance;
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

export function extractFirebaseErrorMessage(error: unknown): string {
  if (!error) return 'Unknown Firebase error';
  const errObj = error as { code?: string; message?: string };
  const msg = error instanceof Error ? error.message : String(errObj.message || error);
  if (errObj.code && !msg.includes(errObj.code)) {
    return `${msg} (${errObj.code})`;
  }
  return msg;
}

export function isFirestoreQuotaError(error: unknown): boolean {
  if (!error) return false;
  const code = (error as { code?: string })?.code;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    code === 'resource-exhausted' ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('resource-exhausted')
  );
}

export function isFirestorePermissionError(error: unknown): boolean {
  if (!error) return false;
  const code = (error as { code?: string })?.code;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    code === 'permission-denied' ||
    msg.toLowerCase().includes('missing or insufficient permissions') ||
    msg.toLowerCase().includes('permission-denied')
  );
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: extractFirebaseErrorMessage(error),
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
  console.warn('Firestore Operation Info: ', JSON.stringify(errInfo));
  return errInfo;
}

export interface FirestoreConnectionResult {
  ok: boolean;
  errorMessage?: string;
  quotaExceeded?: boolean;
  permissionDenied?: boolean;
}

export async function testFirestoreConnection(): Promise<FirestoreConnectionResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ok: false,
      errorMessage: 'Perangkat sedang offline (tidak ada koneksi internet).',
    };
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { ok: true };
  } catch (error) {
    const rawMsg = extractFirebaseErrorMessage(error);
    if (isFirestoreQuotaError(error)) {
      console.warn('Firestore daily free read quota reached; using offline cache until quota resets.');
      return {
        ok: false,
        quotaExceeded: true,
        errorMessage: rawMsg,
      };
    }
    if (isFirestorePermissionError(error)) {
      console.error('Firestore rules rejected access:', rawMsg);
      return {
        ok: false,
        permissionDenied: true,
        errorMessage: rawMsg,
      };
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline.');
    }
    return {
      ok: false,
      errorMessage: rawMsg,
    };
  }
}

export async function resyncFirestoreNetwork(): Promise<boolean> {
  try {
    await enableNetwork(db);
    return true;
  } catch {
    return false;
  }
}
