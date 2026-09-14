export interface Docente {
  dni: string; // Único identificador (8 dígitos)
  apellidosNombres: string;
  grado: string; // 1°, 2°, 3°, 4°, 5°, 6°, etc.
  seccion: string; // A, B, C, D, Única
  correo: string;
  celular: string; // 9 dígitos
  fechaNacimiento: string; // YYYY-MM-DD
  especialidad: string; // Especialidad académica (e.g. Educación Primaria, Matemática, etc.)
  condicion?: string; // Nombrado, Contratado, Designado, Encargado
  escala?: string; // I, II, III, IV, V, VI, VII, VIII, Sin Escala
  jornadaLaboral?: number; // 30, 40
}

export type CondicionType = "Nombrado" | "Contratado" | "Designado" | "Encargado";
export const CONDICIONES_LIST: CondicionType[] = ["Nombrado", "Contratado", "Designado", "Encargado"];

export type EscalaType = "I" | "II" | "III" | "IV" | "V" | "VI" | "VII" | "VIII" | "Sin Escala";
export const ESCALAS_LIST: EscalaType[] = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "Sin Escala"];

export type JornadaLaboralType = 30 | 40;
export const JORNADAS_LIST: JornadaLaboralType[] = [30, 40];

export type EspecialidadType = 
  | "Educación Inicial"
  | "Educación Primaria"
  | "Matemática"
  | "Comunicación"
  | "Ciencia y Tecnología"
  | "Personal Social"
  | "Educación Física"
  | "Arte y Cultura"
  | "Inglés"
  | "Educación Religiosa"
  | "Computación e Informática"
  | "Profesor de Innovación Pedagógica - PIP"
  | "Otra";

export const ESPECIALIDADES_LIST: EspecialidadType[] = [
  "Educación Inicial",
  "Educación Primaria",
  "Matemática",
  "Comunicación",
  "Ciencia y Tecnología",
  "Personal Social",
  "Educación Física",
  "Arte y Cultura",
  "Inglés",
  "Educación Religiosa",
  "Computación e Informática",
  "Profesor de Innovación Pedagógica - PIP",
  "Otra"
];

export const GRADOS_LIST = ["1°", "2°", "3°", "4°", "5°", "6°", "Inicial (3 años)", "Inicial (4 años)", "Inicial (5 años)", "Director", "SubDirectora (e)", "Sin aula a cargo", "Administrativo"];
export const SECCIONES_LIST = ["A", "B", "C", "D", "Única", "Sin sección a cargo"];

export interface RegistroAip {
  id: string; // Firebase gen ID
  docenteDni: string; // DNI del docente que registra ingreso
  docenteNombre: string; // Nombre completo guardado como instantánea
  fecha: string; // YYYY-MM-DD
  hora: number; // 1, 2, 3, 4, 5, 6
  area: string; // Matemática, Comunicación, Personal Social, Educación Religiosa, Educación Física, Arte, Ciencia y Tecnología, Tutoria
  tema: string;
  recurso: string;
  presentoSesion: boolean; // Sí / No
  grado: string;
  seccion: string;
  estudiantesAsistentes: number;
  observacion: string;
  createdAt: string; // ISO string or timestamp
}

export const AREAS_AIP_LIST = [
  "Matemática",
  "Comunicación",
  "Personal Social",
  "Educación Religiosa",
  "Educación Física",
  "Arte",
  "Ciencia y Tecnología",
  "Tutoria"
];

export const HORAS_AIP_LIST = [1, 2, 3, 4, 5, 6];

export interface HoraOption {
  value: number;
  label: string;
}

export const HORA_OPTIONS: HoraOption[] = [
  { value: 1.2, label: "1° y 2° Hora Pedagógica" },
  { value: 3.4, label: "3° y 4° Hora Pedagógica" },
  { value: 5.6, label: "5° y 6° Hora Pedagógica" }
];

export type ActiveTabType = "dashboard" | "docentes" | "aip" | "calendario" | "informe-mensual" | "reportes" | "metricas";

export interface SystemModule {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  iconName: "LayoutDashboard" | "Monitor" | "Users" | "BarChart3" | "FileText" | "Boxes" | "Laptop" | "CalendarCheck" | "BookOpen" | "QrCode" | "FolderArchive" | "FileSpreadsheet" | "Calendar";
  category: "Pedagógico" | "Administrativo" | "Gestión" | "Innovación";
  status: "activo" | "en_desarrollo" | "planificado";
  badge?: string;
  color: "red" | "blue" | "indigo" | "emerald" | "amber" | "purple";
  recordsCount?: number;
  routeTab: ActiveTabType;
}

export const DEFAULT_MODULES: SystemModule[] = [
  {
    id: "mod-dashboard",
    code: "MOD-01",
    name: "Panel de Control Central",
    shortDescription: "Consola directiva con indicadores clave, accesos rápidos y resumen de actividad en tiempo real.",
    iconName: "LayoutDashboard",
    category: "Gestión",
    status: "activo",
    color: "indigo",
    routeTab: "dashboard"
  },
  {
    id: "mod-aip",
    code: "MOD-02",
    name: "Aula de Innovación (AIP - Anexo 1)",
    shortDescription: "Registro diario de sesiones pedagógicas, asistencia de estudiantes, recursos TIC y Libro Oficial.",
    iconName: "Monitor",
    category: "Pedagógico",
    status: "activo",
    badge: "Anexo 1",
    color: "red",
    routeTab: "aip"
  },
  {
    id: "mod-docentes",
    code: "MOD-03",
    name: "Directorio de Personal Docente",
    shortDescription: "Fichero del personal docente, carpetas personales, especialidades, asignación de grados y carga masiva Excel.",
    iconName: "Users",
    category: "Administrativo",
    status: "activo",
    color: "blue",
    routeTab: "docentes"
  },
  {
    id: "mod-calendario",
    code: "MOD-04",
    name: "Calendario de Fechas Especiales",
    shortDescription: "Control de días no laborables, feriados, jornadas de gestión y fechas especiales que justifican la no asistencia docente al AIP.",
    iconName: "CalendarCheck",
    category: "Gestión",
    status: "activo",
    badge: "Justificaciones",
    color: "amber",
    routeTab: "calendario"
  },
  {
    id: "mod-informe-mensual",
    code: "MOD-05",
    name: "Informe Mensual de Actividades (PIP)",
    shortDescription: "Elaborador y estructurador dinámico del informe mensual oficial con descarga directa en Microsoft Word (.docx).",
    iconName: "FileSpreadsheet",
    category: "Pedagógico",
    status: "activo",
    badge: "Word Oficial",
    color: "blue",
    routeTab: "informe-mensual"
  },
  {
    id: "mod-reportes",
    code: "MOD-06",
    name: "Centro de Reportes & PDF Oficial",
    shortDescription: "Generación y exportación de fichas de asistencia por mes completo, semanas y personal en PDF.",
    iconName: "FileText",
    category: "Gestión",
    status: "activo",
    badge: "Oficial",
    color: "purple",
    routeTab: "reportes"
  },
  {
    id: "mod-metricas",
    code: "MOD-07",
    name: "Métricas & Monitoreo Escolar",
    shortDescription: "Gráficos de concurrencia, áreas curriculares más trabajadas y cobertura institucional.",
    iconName: "BarChart3",
    category: "Innovación",
    status: "activo",
    color: "emerald",
    routeTab: "metricas"
  }
];

// --- Tipos para el Calendario de Fechas Especiales & Justificación de Inasistencia AIP ---
export type TipoFechaEspecial = 
  | "Feriado Calendario" 
  | "Semana de Gestión" 
  | "Vacaciones" 
  | "Jornada Pedagógica" 
  | "Actividad Institucional" 
  | "Mantenimiento AIP" 
  | "Capacitación Docente" 
  | "Suspensión de Labores" 
  | "Otro";

export interface FechaEspecial {
  id: string;
  fecha: string; // YYYY-MM-DD (Fecha de inicio o fecha puntual)
  fechaFin?: string; // YYYY-MM-DD (Fecha de finalización si abarca periodo de varios días)
  esRango?: boolean; // Indica si es un periodo de varios días consecutivos
  diasRango?: number; // Total de días que comprende el periodo
  titulo: string; // Ej: "Feriado Nacional - Día del Trabajo", "Semana de Gestión 1", "Vacaciones Escolares"
  tipo: TipoFechaEspecial;
  sinActividadAip: boolean; // Si es true, no hay sesiones en el AIP
  motivoJustificacion: string; // Texto legal/pedagógico que justifica la no asistencia docente
  activo: boolean;
  turno?: "ambos" | "mañana" | "tarde";
  docentesAfectados?: string; // "Todos los docentes" o especificación
  createdAt?: string;
}

// --- Tipos para la Elaboración del Informe Mensual de Actividades ---
export interface TareaDescriptiva {
  id: string;
  subtitulo: string; // ej: "Talleres de Alfabetización Digital e IA"
  detalle: string; // texto explicativo de la acción
}

export interface BeneficiariosSelection {
  profesores: boolean;
  estudiantes: boolean;
  ambos: boolean;
  padres: boolean;
}

export interface InformeActividad {
  id: string;
  numero: number;
  titulo: string; // Nombre de la actividad
  objetivo: string; // Objetivo de la actividad
  descripcionTexto?: string; // Descripción libre de las actividades realizadas en el mes
  beneficiariosChecks?: BeneficiariosSelection; // Selección por checks (Profesores, Estudiantes, Ambos, Padres)
  tareas: TareaDescriptiva[]; // Acciones / descripción detallada con viñetas
  metasBeneficiarios: string; // ej: "Docentes y estudiantes de la institución"
  mediosVerificacion: string; // ej: "Fichas de Asistencia Anexo 1, fotografías, sesiones con TIC"
}

export interface InformeMensualData {
  id: string;
  numeroCorrelativo?: number; // ej: 1, 2, 3...
  numeroInforme: string; // ej: "005-2026-GRA/DREA/UGEL-IEPM N° 24009-“TAII”-PIP"
  directorNombre: string; // ej: "Mag. Félix Venegas Guerrero"
  directorCargo: string; // ej: "Director de la I.E.P.M. N° 24009 “Túpac Amaru II”"
  remitenteNombre: string; // ej: "Prof. Martin Herick Cahuana Mendoza"
  remitenteCargo: string; // ej: "Profesor de Innovación Pedagógica - PIP"
  asunto: string; // ej: "Informe mensual de actividades correspondiente al mes de Mayo de 2026"
  referencia: string; // ej: "R.V.M. N° 097-2020-MINEDU / Plan Anual de Trabajo AIP 2026"
  lugar: string; // ej: "Puquio, Lucanas"
  fechaTexto: string; // ej: "30 de mayo de 2026"
  mes: number; // 0..11
  ano: number; // 2026
  introduccion: string;
  actividades: InformeActividad[];
  logros: string[];
  dificultades: string[];
  sugerencias: string[];
  conclusiones: string[];
  incluirResumenAip: boolean;
  incluirFechasEspeciales?: boolean;
  updatedAt: string;
}

export function formatHoraAip(h: number): string {
  const match = HORA_OPTIONS.find((opt) => Math.abs(opt.value - h) < 0.01);
  return match ? match.label : `${h}° Hora Pedagógica`;
}

// Security & Authentication Types
export type UserRole = "admin" | "docente" | "directivo";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  dni?: string;
  cargo?: string;
  especialidad?: string;
  grado?: string;
  seccion?: string;
  authMethod: "google" | "institutional_cred";
  loginAt: string;
}

export interface SecurityConfig {
  id: string; // 'seguridad'
  adminUsername: string; // default: "admin"
  adminPassword: string; // default: "AIP24009"
  institutionalPin: string; // default: "AIP24009"
  whitelistedEmails: string[];
  allowOnlyWhitelistedGoogle: boolean;
  adminEmail: string;
  updatedAt: string;
}

