import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Docente, RegistroAip, FechaEspecial } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
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

interface FirestoreErrorInfo {
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Function to validate connection on start
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'docentes', 'test_connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Teachers collection
const DOCENTES_COLL = 'docentes';

export async function getDocentesOnce(): Promise<Docente[]> {
  try {
    const querySnapshot = await getDocs(collection(db, DOCENTES_COLL));
    const list: Docente[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Docente);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, DOCENTES_COLL);
    return [];
  }
}

export function subscribeDocentes(
  onUpdate: (docentes: Docente[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    collection(db, DOCENTES_COLL),
    (snapshot) => {
      const list: Docente[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Docente);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, DOCENTES_COLL);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  );
}

export async function saveDocenteToFirebase(docente: Docente): Promise<void> {
  const path = `${DOCENTES_COLL}/${docente.dni}`;
  try {
    await setDoc(doc(db, DOCENTES_COLL, docente.dni), docente);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDocenteFromFirebase(dni: string): Promise<void> {
  const path = `${DOCENTES_COLL}/${dni}`;
  try {
    await deleteDoc(doc(db, DOCENTES_COLL, dni));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// AIP Records collection
const REGISTROS_AIP_COLL = 'registros_aip';

export function subscribeRegistrosAip(
  onUpdate: (registros: RegistroAip[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    collection(db, REGISTROS_AIP_COLL),
    (snapshot) => {
      const list: RegistroAip[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as RegistroAip);
      });
      // Sort by creation time or date
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, REGISTROS_AIP_COLL);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  );
}

export async function saveRegistroAipToFirebase(registro: RegistroAip): Promise<void> {
  const path = `${REGISTROS_AIP_COLL}/${registro.id}`;
  try {
    await setDoc(doc(db, REGISTROS_AIP_COLL, registro.id), registro);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteRegistroAipFromFirebase(id: string): Promise<void> {
  const path = `${REGISTROS_AIP_COLL}/${id}`;
  try {
    await deleteDoc(doc(db, REGISTROS_AIP_COLL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Special Dates collection (Fechas Especiales / Justificaciones AIP)
const FECHAS_ESPECIALES_COLL = 'fechas_especiales';

export function subscribeFechasEspeciales(
  onUpdate: (fechas: FechaEspecial[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    collection(db, FECHAS_ESPECIALES_COLL),
    (snapshot) => {
      const list: FechaEspecial[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as FechaEspecial);
      });
      // Sort by date ascending
      list.sort((a, b) => a.fecha.localeCompare(b.fecha));
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, FECHAS_ESPECIALES_COLL);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  );
}

export async function saveFechaEspecialToFirebase(fecha: FechaEspecial): Promise<void> {
  const path = `${FECHAS_ESPECIALES_COLL}/${fecha.id}`;
  try {
    await setDoc(doc(db, FECHAS_ESPECIALES_COLL, fecha.id), fecha);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFechaEspecialFromFirebase(id: string): Promise<void> {
  const path = `${FECHAS_ESPECIALES_COLL}/${id}`;
  try {
    await deleteDoc(doc(db, FECHAS_ESPECIALES_COLL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}


