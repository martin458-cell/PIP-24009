import { FechaEspecial } from "./types";

/**
 * Calendario Oficial de Fechas Especiales, Feriados y Jornadas de Gestión 2026
 * I.E.P.M. N° 24009 "Túpac Amaru II" - Puquio, Lucanas, Ayacucho
 * Estas fechas justifican formalmente la no asistencia y no concurrencia del docente al AIP.
 */
export const INITIAL_FECHAS_ESPECIALES: FechaEspecial[] = [
  // --- MARZO 2026 ---
  {
    id: "fe-2026-03-02",
    fecha: "2026-03-02",
    fechaFin: "2026-03-06",
    esRango: true,
    diasRango: 5,
    titulo: "I Semana de Gestión Escolar 2026 (Planificación Institucional)",
    tipo: "Semana de Gestión",
    sinActividadAip: true,
    motivoJustificacion: "Justifica la no asistencia al AIP por desarrollo de la I Semana de Gestión Escolar 2026 (Planificación Curricular, PAT y PEI) dispuesta por el MINEDU, sin atención a estudiantes.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-03-05",
    fecha: "2026-03-05",
    titulo: "Mantenimiento Técnico e Inventario Inicial del Aula de Innovación",
    tipo: "Mantenimiento AIP",
    sinActividadAip: true,
    motivoJustificacion: "Justifica la no atención en el AIP por labores exclusivas de mantenimiento preventivo, actualización de sistemas operativos y verificación de conectividad de equipos informáticos.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-03-16",
    fecha: "2026-03-16",
    titulo: "Buen Inicio del Año Escolar 2026 (Acto de Bienvenida)",
    tipo: "Actividad Institucional",
    sinActividadAip: true,
    motivoJustificacion: "Justifica la no concurrencia al AIP por ceremonia protocolar, integración comunitaria y recepción a los estudiantes en patio central durante la jornada escolar.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },

  // --- ABRIL 2026 ---
  {
    id: "fe-2026-04-02",
    fecha: "2026-04-02",
    titulo: "Jueves Santo (Feriado Nacional)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional oficial según D.L. N° 713 por conmemoración de Semana Santa. Suspensión total de actividades académicas y administrativas.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-04-03",
    fecha: "2026-04-03",
    titulo: "Viernes Santo (Feriado Nacional)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional oficial por Semana Santa. Suspensión total de labores pedagógicas e ingreso al AIP.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-04-24",
    fecha: "2026-04-24",
    titulo: "Jornada de Trabajo Colegiado y Capacitación Docente",
    tipo: "Jornada Pedagógica",
    sinActividadAip: true,
    motivoJustificacion: "Reunión colegiada de docentes para análisis de avances curriculares y evaluación diagnóstica. Sesiones regulares en AIP reprogramadas.",
    activo: true,
    turno: "tarde",
    docentesAfectados: "Todos los docentes"
  },

  // --- MAYO 2026 ---
  {
    id: "fe-2026-05-01",
    fecha: "2026-05-01",
    titulo: "Día del Trabajo (Feriado Nacional)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional no laborable por el Día Internacional de los Trabajadores. Justifica la no asistencia de docentes y estudiantes al AIP.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-05-08",
    fecha: "2026-05-08",
    titulo: "Homenaje y Actuación por el Día de la Madre",
    tipo: "Actividad Institucional",
    sinActividadAip: true,
    motivoJustificacion: "Actividad institucional de confraternidad y presentación artístico-cultural por el Día de la Madre. No se programan sesiones en el aula tecnológica.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-05-29",
    fecha: "2026-05-29",
    titulo: "I Simulacro Nacional Multipeligro Escolar 2026",
    tipo: "Actividad Institucional",
    sinActividadAip: true,
    motivoJustificacion: "Ejecución del Simulacro Nacional Multipeligro y acciones de soporte socioemocional y evaluación de daños dispuestas por INDECI y MINEDU.",
    activo: true,
    turno: "mañana",
    docentesAfectados: "Todos los docentes"
  },

  // --- JUNIO 2026 ---
  {
    id: "fe-2026-06-07",
    fecha: "2026-06-07",
    titulo: "Batalla de Arica y Día de la Bandera (Feriado Cívico)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional en conmemoración de la Batalla de Arica y Renovación del Juramento de Fidelidad a la Bandera Nacional.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-06-19",
    fecha: "2026-06-19",
    titulo: "Capacitación Docente en Inteligencia Artificial y Recursos TIC",
    tipo: "Capacitación Docente",
    sinActividadAip: true,
    motivoJustificacion: "Taller interno de alfabetización digital y uso pedagógico de herramientas TIC en el AIP para el personal docente, sin concurrencia de alumnos.",
    activo: true,
    turno: "tarde",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-06-29",
    fecha: "2026-06-29",
    titulo: "Día de San Pedro y San Pablo (Feriado Nacional)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional religioso según calendario oficial. Justifica la no asistencia al AIP por suspensión general de labores.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },

  // --- JULIO 2026 ---
  {
    id: "fe-2026-07-06",
    fecha: "2026-07-06",
    titulo: "Día del Maestro (Día No Laborable Magisterial)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Día no laborable para el magisterio nacional con goce de remuneraciones según Resolución Ministerial del sector educación.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-07-23",
    fecha: "2026-07-23",
    titulo: "Día de la Fuerza Aérea del Perú - José Abelardo Quiñones",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional oficial según Ley N° 31822. Suspensión de labores escolares.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-07-27",
    fecha: "2026-07-27",
    fechaFin: "2026-08-07",
    esRango: true,
    diasRango: 12,
    titulo: "Vacaciones Escolares de Medio Año & II Semana de Gestión",
    tipo: "Vacaciones",
    sinActividadAip: true,
    motivoJustificacion: "Periodo oficial de vacaciones escolares intermedias para los estudiantes y desarrollo de la II Semana de Gestión institucional del I Semestre según Calendarización Escolar 2026 del MINEDU. Justifica plenamente la no atención de sesiones presenciales en el Aula de Innovación Pedagógica (AIP).",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-07-28",
    fecha: "2026-07-28",
    titulo: "Fiestas Patrias - Día de la Proclamación de la Independencia",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional patrio por el Aniversario de la Independencia del Perú.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-07-29",
    fecha: "2026-07-29",
    titulo: "Fiestas Patrias - Gran Parada y Desfile Cívico Militar",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional patrio en honor a las Fuerzas Armadas y Policía Nacional del Perú.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },

  // --- AGOSTO 2026 ---
  {
    id: "fe-2026-08-06",
    fecha: "2026-08-06",
    titulo: "Batalla de Junín (Feriado Nacional)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional en conmemoración de la heroica gesta de la Batalla de Junín según Ley N° 31530.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-08-14",
    fecha: "2026-08-14",
    titulo: "II Simulacro Nacional Multipeligro Escolar 2026",
    tipo: "Actividad Institucional",
    sinActividadAip: true,
    motivoJustificacion: "Ejecución obligatoria del simulacro multipeligro en turnos correspondientes, alterando el horario normal de clases en AIP.",
    activo: true,
    turno: "mañana",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-08-30",
    fecha: "2026-08-30",
    titulo: "Santa Rosa de Lima, Patrona de las Américas y la PNP",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional conmemorativo religioso en honor a Santa Rosa de Lima.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },

  // --- SETIEMBRE 2026 ---
  {
    id: "fe-2026-09-23",
    fecha: "2026-09-23",
    titulo: "Día de la Primavera, la Juventud y el Estudiante",
    tipo: "Actividad Institucional",
    sinActividadAip: true,
    motivoJustificacion: "Jornada deportiva, artística y recreativa de integración escolar institucional. No se desarrollan sesiones pedagógicas en sala de cómputo.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },

  // --- OCTUBRE 2026 ---
  {
    id: "fe-2026-10-08",
    fecha: "2026-10-08",
    titulo: "Combate de Angamos (Día de Miguel Grau y la Marina de Guerra)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional en homenaje al Almirante Miguel Grau Seminario y conmemoración del Combate de Angamos.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-10-23",
    fecha: "2026-10-23",
    titulo: "Feria Escolar Institucional de Ciencia y Tecnología (EUREKA)",
    tipo: "Actividad Institucional",
    sinActividadAip: true,
    motivoJustificacion: "Exposición general de proyectos científicos y tecnológicos de los estudiantes en áreas comunes. Uso de equipos AIP para presentación pública de proyectos.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },

  // --- NOVIEMBRE 2026 ---
  {
    id: "fe-2026-11-01",
    fecha: "2026-11-01",
    titulo: "Día de Todos los Santos (Feriado Nacional)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional de carácter cívico y religioso. Suspensión de labores escolares.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-11-04",
    fecha: "2026-11-04",
    titulo: "Día Central del Aniversario Institucional I.E.P.M. N° 24009 'Túpac Amaru II'",
    tipo: "Actividad Institucional",
    sinActividadAip: true,
    motivoJustificacion: "Celebración del Aniversario Institucional de nuestra casa de estudios. Desfile cívico escolar, romería y sesión solemne con asistencia de la comunidad educativa en pleno.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-11-06",
    fecha: "2026-11-06",
    titulo: "III Simulacro Nacional Multipeligro Escolar 2026",
    tipo: "Actividad Institucional",
    sinActividadAip: true,
    motivoJustificacion: "Desarrollo del último ejercicio de simulacro nacional multipeligro y acciones de contingencia y resiliencia escolar.",
    activo: true,
    turno: "mañana",
    docentesAfectados: "Todos los docentes"
  },

  // --- DICIEMBRE 2026 ---
  {
    id: "fe-2026-12-08",
    fecha: "2026-12-08",
    titulo: "Día de la Inmaculada Concepción (Feriado Nacional)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional en honor a la Inmaculada Concepción. No hay concurrencia a la institución.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-12-09",
    fecha: "2026-12-09",
    titulo: "Batalla de Ayacucho (Feriado Cívico Regional y Nacional)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional oficial por la conmemoración de la capitulación y Batalla de Ayacucho, día histórico en nuestra región.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-12-21",
    fecha: "2026-12-21",
    titulo: "Semana de Gestión 3 & Evaluación de Metas y Cierre de SIAGIE",
    tipo: "Semana de Gestión",
    sinActividadAip: true,
    motivoJustificacion: "Jornada de balance de cierre de año escolar 2026, consolidación de calificaciones en SIAGIE y elaboración del Informe de Gestión Anual (IGA).",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  },
  {
    id: "fe-2026-12-25",
    fecha: "2026-12-25",
    titulo: "Navidad del Señor (Feriado Nacional)",
    tipo: "Feriado Calendario",
    sinActividadAip: true,
    motivoJustificacion: "Feriado nacional oficial por Natividad. Suspensión total de actividades.",
    activo: true,
    turno: "ambos",
    docentesAfectados: "Todos los docentes"
  }
];

export const TIPOS_FECHA_ESPECIAL_CONFIG: Record<string, { label: string; badgeClass: string; bgSoft: string; borderClass: string; textColor: string }> = {
  "Feriado Calendario": {
    label: "Feriado Calendario",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    bgSoft: "bg-red-50/70",
    borderClass: "border-red-200",
    textColor: "text-red-700"
  },
  "Semana de Gestión": {
    label: "Semana de Gestión",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
    bgSoft: "bg-purple-50/70",
    borderClass: "border-purple-200",
    textColor: "text-purple-700"
  },
  "Vacaciones": {
    label: "Vacaciones",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
    bgSoft: "bg-teal-50/70",
    borderClass: "border-teal-200",
    textColor: "text-teal-800"
  },
  "Jornada Pedagógica": {
    label: "Jornada Pedagógica",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    bgSoft: "bg-blue-50/70",
    borderClass: "border-blue-200",
    textColor: "text-blue-700"
  },
  "Actividad Institucional": {
    label: "Actividad Institucional",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    bgSoft: "bg-amber-50/70",
    borderClass: "border-amber-200",
    textColor: "text-amber-800"
  },
  "Mantenimiento AIP": {
    label: "Mantenimiento AIP",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
    bgSoft: "bg-cyan-50/70",
    borderClass: "border-cyan-200",
    textColor: "text-cyan-800"
  },
  "Capacitación Docente": {
    label: "Capacitación Docente",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bgSoft: "bg-emerald-50/70",
    borderClass: "border-emerald-200",
    textColor: "text-emerald-800"
  },
  "Suspensión de Labores": {
    label: "Suspensión de Labores",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
    bgSoft: "bg-rose-50/70",
    borderClass: "border-rose-200",
    textColor: "text-rose-800"
  },
  "Otro": {
    label: "Otro",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    bgSoft: "bg-slate-50",
    borderClass: "border-slate-200",
    textColor: "text-slate-700"
  }
};
