import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, getDocs, collection, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Docente, RegistroAip, FechaEspecial, AuthUser, SecurityConfig } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export { onAuthStateChanged };

// Google Auth Provider configured for institutional selection
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const DEFAULT_ADMIN_EMAIL = "martinherickcahuanamendoza@gmail.com";
export const DEFAULT_INSTITUTIONAL_PIN = "AIP24009";

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  id: "seguridad",
  institutionalPin: DEFAULT_INSTITUTIONAL_PIN,
  whitelistedEmails: [
    DEFAULT_ADMIN_EMAIL,
    "director@iepm24009.edu.pe",
    "subdireccion@iepm24009.edu.pe",
    "aip24009puquio@gmail.com"
  ],
  allowOnlyWhitelistedGoogle: true,
  adminEmail: DEFAULT_ADMIN_EMAIL,
  updatedAt: new Date().toISOString()
};

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

// -------------------------------------------------------------
// Security Configuration & Authorization Helpers
// -------------------------------------------------------------
const CONFIG_COLL = 'configuracion_sistema';
const SECURITY_DOC_ID = 'seguridad';

export function subscribeSecurityConfig(
  onUpdate: (config: SecurityConfig) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    doc(db, CONFIG_COLL, SECURITY_DOC_ID),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SecurityConfig);
      } else {
        // Seed default security config
        saveSecurityConfigToFirebase(DEFAULT_SECURITY_CONFIG).catch((e) => {
          console.warn("Could not save initial security config:", e);
        });
        onUpdate(DEFAULT_SECURITY_CONFIG);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${CONFIG_COLL}/${SECURITY_DOC_ID}`);
      if (onError) onError(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

export async function saveSecurityConfigToFirebase(config: SecurityConfig): Promise<void> {
  const path = `${CONFIG_COLL}/${SECURITY_DOC_ID}`;
  try {
    await setDoc(doc(db, CONFIG_COLL, SECURITY_DOC_ID), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Firebase Google Login
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

// Firebase Sign Out
export async function signOutFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

// Evaluate whether a Google user is authorized to enter the school platform
export function evaluateGoogleAuthorization(
  user: { email: string | null; displayName: string | null; photoURL?: string | null; uid: string },
  docentesList: Docente[],
  securityConfig: SecurityConfig
): { isAuthorized: boolean; authUser?: AuthUser; rejectionReason?: string } {
  const email = (user.email || "").toLowerCase().trim();

  if (!email) {
    return {
      isAuthorized: false,
      rejectionReason: "La cuenta no proporciona una dirección de correo electrónico válida."
    };
  }

  // 1. Super Administrator Check (Prof. Martin Herick Cahuana Mendoza / PIP)
  if (email === DEFAULT_ADMIN_EMAIL.toLowerCase() || email === securityConfig.adminEmail.toLowerCase()) {
    return {
      isAuthorized: true,
      authUser: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "Prof. Martin Herick Cahuana Mendoza",
        photoURL: user.photoURL || null,
        role: "admin",
        cargo: "Profesor de Innovación Pedagógica - PIP / Administrador",
        especialidad: "Profesor de Innovación Pedagógica - PIP",
        authMethod: "google",
        loginAt: new Date().toISOString()
      }
    };
  }

  // 2. Direct Whitelist check
  const isWhitelisted = securityConfig.whitelistedEmails.some(
    (w) => w.toLowerCase().trim() === email
  );

  // 3. Match against registered teachers by email
  const matchedDocente = docentesList.find(
    (d) => d.correo && d.correo.toLowerCase().trim() === email
  );

  if (matchedDocente) {
    return {
      isAuthorized: true,
      authUser: {
        uid: user.uid,
        email: user.email,
        displayName: matchedDocente.apellidosNombres,
        photoURL: user.photoURL || null,
        role: "docente",
        dni: matchedDocente.dni,
        cargo: `Docente de Aula (${matchedDocente.grado} "${matchedDocente.seccion}")`,
        especialidad: matchedDocente.especialidad,
        grado: matchedDocente.grado,
        seccion: matchedDocente.seccion,
        authMethod: "google",
        loginAt: new Date().toISOString()
      }
    };
  }

  if (isWhitelisted) {
    return {
      isAuthorized: true,
      authUser: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split("@")[0],
        photoURL: user.photoURL || null,
        role: "directivo",
        cargo: "Personal Directivo / Autorizado I.E. 24009",
        authMethod: "google",
        loginAt: new Date().toISOString()
      }
    };
  }

  // 4. Institutional Domain check (@iepm24009.edu.pe)
  if (email.endsWith("@iepm24009.edu.pe")) {
    return {
      isAuthorized: true,
      authUser: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split("@")[0],
        photoURL: user.photoURL || null,
        role: "docente",
        cargo: "Docente Institucional (Correo Oficial)",
        authMethod: "google",
        loginAt: new Date().toISOString()
      }
    };
  }

  // Unauthorized Third Party Blocked
  return {
    isAuthorized: false,
    rejectionReason: `La cuenta (${email}) no está registrada en el padrón institucional de la I.E.P.M. N° 24009 Túpac Amaru II (Puquio). Por estrictas políticas de privacidad, terceros tienen el acceso denegado.`
  };
}

// Evaluate institutional credential access (DNI + Institutional Key)
export function evaluateInstitutionalCredentialAccess(
  dni: string,
  pin: string,
  docentesList: Docente[],
  securityConfig: SecurityConfig
): { success: boolean; authUser?: AuthUser; errorMessage?: string } {
  const cleanDni = (dni || "").trim();
  const cleanPin = (pin || "").trim();

  if (!cleanDni || !cleanPin) {
    return {
      success: false,
      errorMessage: "Ingrese el DNI y la Clave Institucional AIP para continuar."
    };
  }

  const targetPin = (securityConfig.institutionalPin || DEFAULT_INSTITUTIONAL_PIN).trim();
  if (cleanPin !== targetPin) {
    return {
      success: false,
      errorMessage: "Clave de Acceso Institucional AIP incorrecta. Solicite la clave vigente al Profesor de Innovación Pedagógica (PIP)."
    };
  }

  // Check if DNI matches Master Admin / PIP
  if (cleanDni === "24009" || cleanDni === "ADMIN" || cleanDni === "0361493") {
    return {
      success: true,
      authUser: {
        uid: `admin_${cleanDni}`,
        email: DEFAULT_ADMIN_EMAIL,
        displayName: "Prof. Martin Herick Cahuana Mendoza",
        photoURL: null,
        role: "admin",
        dni: cleanDni,
        cargo: "Profesor de Innovación Pedagógica - PIP / Administrador",
        especialidad: "Profesor de Innovación Pedagógica - PIP",
        authMethod: "institutional_cred",
        loginAt: new Date().toISOString()
      }
    };
  }

  // Check if DNI matches any teacher in registered teachers directory
  const matchedDocente = docentesList.find((d) => d.dni.trim() === cleanDni);
  if (matchedDocente) {
    return {
      success: true,
      authUser: {
        uid: `docente_${matchedDocente.dni}`,
        email: matchedDocente.correo,
        displayName: matchedDocente.apellidosNombres,
        photoURL: null,
        role: "docente",
        dni: matchedDocente.dni,
        cargo: `Docente de Aula (${matchedDocente.grado} "${matchedDocente.seccion}")`,
        especialidad: matchedDocente.especialidad,
        grado: matchedDocente.grado,
        seccion: matchedDocente.seccion,
        authMethod: "institutional_cred",
        loginAt: new Date().toISOString()
      }
    };
  }

  return {
    success: false,
    errorMessage: `El DNI ${cleanDni} no figura en el padrón de personal docente de la I.E.P.M. N° 24009 Túpac Amaru II. Si acaba de incorporarse, solicite su registro previo al Administrador del AIP.`
  };
}


