import { BeneficiariosSelection, InformeActividad, InformeMensualData, RegistroAip } from "../types";

export const MESES_OPTIONS = [
  { value: 0, label: "Enero" },
  { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" },
  { value: 5, label: "Junio" },
  { value: 6, label: "Julio" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Setiembre" },
  { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" },
  { value: 11, label: "Diciembre" },
];

export function getMonthName(monthIndex: number): string {
  return MESES_OPTIONS.find((m) => m.value === monthIndex)?.label || "Mes";
}

export function formatNumeroInforme(correlativo: number, year: number = 2026): string {
  const pad = String(correlativo).padStart(3, "0");
  return `INFORME N° ${pad}-${year}-GRA/DREA/UGEL-IEPM N° 24009-“TAII”-PIP`;
}

export function getBeneficiariosLabel(checks: BeneficiariosSelection): string {
  if (checks.ambos || (checks.profesores && checks.estudiantes)) {
    if (checks.padres) {
      return "Docentes, Estudiantes y Padres de Familia de la I.E.P.M. N° 24009 “Túpac Amaru II”";
    }
    return "Docentes y Estudiantes de la I.E.P.M. N° 24009 “Túpac Amaru II”";
  }
  
  const items: string[] = [];
  if (checks.profesores) items.push("Docentes de la Institución Educativa");
  if (checks.estudiantes) items.push("Estudiantes de 1° a 6° grado de primaria");
  if (checks.padres) items.push("Padres de Familia de la Institución Educativa");

  if (items.length === 0) return "Comunidad Educativa de la I.E.P.M. N° 24009";
  return items.join(" y ");
}

export function createEmptyActivity(numero: number): InformeActividad {
  const defaultChecks: BeneficiariosSelection = {
    profesores: true,
    estudiantes: true,
    ambos: true,
    padres: false,
  };

  return {
    id: `act-${Date.now()}-${numero}`,
    numero,
    titulo: `Actividad ${String(numero).padStart(2, "0")}`,
    objetivo: "",
    descripcionTexto: "",
    beneficiariosChecks: defaultChecks,
    metasBeneficiarios: getBeneficiariosLabel(defaultChecks),
    mediosVerificacion: "Fichas de Asistencia Anexo 1, fotografías y sesiones con TIC",
    tareas: [],
  };
}

export function getDefaultInformeData(month: number = new Date().getMonth(), year: number = 2026): InformeMensualData {
  const monthName = getMonthName(month);
  const correlativo = month + 1;

  const defaultChecks: BeneficiariosSelection = {
    profesores: true,
    estudiantes: true,
    ambos: true,
    padres: false,
  };

  return {
    id: `inf-${year}-${String(month + 1).padStart(2, "0")}`,
    numeroCorrelativo: correlativo,
    numeroInforme: formatNumeroInforme(correlativo, year),
    directorNombre: "Mag. Félix Venegas Guerrero",
    directorCargo: "Director de la I.E.P.M. N° 24009 “Túpac Amaru II”",
    remitenteNombre: "Prof. Martin Herick Cahuana Mendoza",
    remitenteCargo: "Profesor de Innovación Pedagógica - PIP",
    asunto: `Informe mensual de actividades pedagógicas y tecnológicas desarrolladas en el AIP correspondiente al mes de ${monthName} de ${year}`,
    referencia: "R.V.M. N° 097-2020-MINEDU / Plan Anual de Trabajo AIP 2026",
    lugar: "Puquio, Lucanas",
    fechaTexto: `30 de ${monthName.toLowerCase()} de ${year}`,
    mes: month,
    ano: year,
    introduccion: `Tengo el agrado de dirigirme a su digno despacho para hacerle llegar mis cordiales saludos y a la vez informarle detalladamente sobre las actividades y acciones pedagógicas desarrolladas como Docente de Innovación Pedagógica (PIP) de nuestra Institución Educativa correspondientes al mes de ${monthName} de ${year}, el cual se detalla a continuación:`,
    actividades: [
      {
        id: "act-1",
        numero: 1,
        titulo: "Capacitación y Formación Docente en Integración de TIC e Inteligencia Artificial",
        objetivo: "Fortalecer las competencias digitales de la plana docente para la integración efectiva de herramientas interactivas e IA pedagógica en la planificación curricular.",
        descripcionTexto: "",
        beneficiariosChecks: {
          profesores: true,
          estudiantes: false,
          ambos: false,
          padres: false,
        },
        tareas: [],
        metasBeneficiarios: "Plana docente completa de los grados de 1° a 6° de primaria",
        mediosVerificacion: "Listas de asistencia a colegiados, fichas de seguimiento y productos didácticos elaborados",
      },
      {
        id: "act-2",
        numero: 2,
        titulo: "Acompañamiento y Desarrollo de Sesiones en el Aula de Innovación Pedagógica (AIP)",
        objetivo: "Garantizar el acceso equitativo y dinámico de los estudiantes y docentes al Aula de Innovación, promoviendo el aprendizaje interactivo en las diversas áreas curriculares.",
        descripcionTexto: "",
        beneficiariosChecks: {
          profesores: true,
          estudiantes: true,
          ambos: true,
          padres: false,
        },
        tareas: [],
        metasBeneficiarios: "Estudiantes de 1° a 6° grado y docentes de aula",
        mediosVerificacion: "Ficha Oficial de Asistencia de Docentes al AIP (Anexo 1), Libro Diario y sesiones de aprendizaje",
      },
      {
        id: "act-3",
        numero: 3,
        titulo: "Mantenimiento Técnico Preventivo y Operatividad del Equipamiento Tecnológico del AIP",
        objetivo: "Asegurar la plena operatividad, seguridad e higiene de los equipos de cómputo, laptops, proyector y red para el normal desarrollo de las sesiones.",
        descripcionTexto: "",
        beneficiariosChecks: {
          profesores: true,
          estudiantes: true,
          ambos: true,
          padres: false,
        },
        tareas: [],
        metasBeneficiarios: "Comunidad escolar de la I.E.P.M. N° 24009 “Túpac Amaru II”",
        mediosVerificacion: "Ficha de control de inventario de equipos y registro de incidencias técnicas",
      },
      {
        id: "act-4",
        numero: 4,
        titulo: "Promoción, Difusión y Sensibilización de Recursos Digitales en la Comunidad Educativa",
        objetivo: "Incentivar la adopción formativa de entornos virtuales de aprendizaje y orientar a padres y docentes sobre el uso ético y seguro de las TIC.",
        descripcionTexto: "",
        beneficiariosChecks: {
          profesores: true,
          estudiantes: true,
          ambos: true,
          padres: true,
        },
        tareas: [],
        metasBeneficiarios: "Docentes, estudiantes y padres de familia de la I.E.P.M. N° 24009",
        mediosVerificacion: "Repositorio digital institucional, comunicados técnicos y material informativo",
      },
    ],
    logros: [
      "[Asistencia y Sesiones Docentes en AIP] Participación y asistencia continua de los docentes de aula al AIP con sus secciones, desarrollando sesiones interactivas con laptops y software educativo.",
      "[Asistencia y Sesiones Docentes en AIP] Incremento en la presentación previa y articulación de las sesiones de aprendizaje con recursos TIC en las áreas de Matemática y Comunicación.",
      "[Actividades y Soporte PIP] Cumplimiento del plan de trabajo mensual del PIP, ejecutando talleres colegiados sobre integración curricular de TIC e Inteligencia Artificial pedagógica.",
      "[Actividades y Soporte PIP] Mantenimiento preventivo, limpieza técnica y operatividad del 100% de las computadoras y laptops XO del Aula de Innovación.",
    ],
    dificultades: [
      "[Asistencia y Sesiones Docentes en AIP] Cruces fortuitos de horario y dificultades de algunos docentes para asistir en su turno asignado debido a feriados y actividades extracurriculares imprevistas.",
      "[Asistencia y Sesiones Docentes en AIP] Brechas en la competencia digital de ciertos docentes para el diseño autónomo de fichas interactivas antes de ingresar con los alumnos al AIP.",
      "[Actividades y Soporte PIP] Fluctuaciones e intermitencia en el servicio de internet institucional en horas de alta demanda de las sesiones escolares.",
      "[Actividades y Soporte PIP] Tiempo limitado en las reuniones colegiadas de interaprendizaje docente para profundizar en robótica educativa y plataformas de IA.",
    ],
    sugerencias: [
      "[Asistencia y Sesiones Docentes en AIP] Implementar un cronograma de reprogramación de turnos del AIP para los docentes que se vean afectados por feriados o semanas de gestión.",
      "[Asistencia y Sesiones Docentes en AIP] Fomentar que los docentes entreguen sus sesiones con recursos TIC con 24 horas de antelación para preparar el software respectivo.",
      "[Actividades y Soporte PIP] Coordinar con la Dirección y la UGEL Lucanas para la optimización del ancho de banda y la dotación de suministros de mantenimiento informático.",
      "[Actividades y Soporte PIP] Continuar con los microtalleres prácticos quincenales de interaprendizaje sobre Inteligencia Artificial aplicada a la educación básica regular.",
    ],
    conclusiones: [
      "El Aula de Innovación Pedagógica se consolida como un espacio neurálgico para la dinamización de los aprendizajes y motivación de los estudiantes de la IEPM 24009.",
      "El trabajo colaborativo entre el PIP y los docentes de aula permite elevar la calidad de las experiencias pedagógicas integrando recursos TIC pertinentes.",
    ],
    incluirResumenAip: true,
    incluirFechasEspeciales: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates an automatic activity based on real AIP records of the given month and year
 */
export function buildAipActivityFromRecords(registros: RegistroAip[], monthNum: number, yearNum: number): InformeActividad {
  const targetYearStr = String(yearNum);
  const targetMonthStr = String(monthNum + 1).padStart(2, "0");

  const monthRecords = registros.filter((r) => {
    return r.fecha.startsWith(`${targetYearStr}-${targetMonthStr}`);
  });

  const totalSesiones = monthRecords.length;
  const totalEstudiantes = monthRecords.reduce((sum, r) => sum + (r.estudiantesAsistentes || 0), 0);
  const conSesion = monthRecords.filter((r) => r.presentoSesion).length;
  const uniqueDocentes = Array.from(new Set(monthRecords.map((r) => r.docenteNombre)));

  // Area distribution
  const areaCounts: Record<string, number> = {};
  monthRecords.forEach((r) => {
    const a = r.area || "Otras áreas";
    areaCounts[a] = (areaCounts[a] || 0) + 1;
  });

  const topAreas = Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([area, count]) => `${area} (${count} sesiones)`)
    .join(", ");

  const tareas: { id: string; subtitulo: string; detalle: string }[] = [
    {
      id: "aip-auto-1",
      subtitulo: "Atención y Concurrencia de Sesiones Pedagógicas",
      detalle: `Durante el presente mes se atendieron un total de ${totalSesiones} sesiones pedagógicas programadas en el Aula de Innovación, beneficiando a ${totalEstudiantes} estudiantes de diferentes grados y secciones con asistencia de ${uniqueDocentes.length} docentes de aula.`,
    },
    {
      id: "aip-auto-2",
      subtitulo: "Áreas Curriculares con Mayor Demanda TIC",
      detalle: topAreas 
        ? `Las áreas curriculares trabajadas con mayor frecuencia fueron: ${topAreas}.`
        : "Se cubrieron diversas áreas del Currículo Nacional, priorizando Matemática y Comunicación.",
    },
    {
      id: "aip-auto-3",
      subtitulo: "Cumplimiento y Planificación Docente",
      detalle: `De las ${totalSesiones} sesiones realizadas, el ${totalSesiones > 0 ? Math.round((conSesion / totalSesiones) * 100) : 0}% (${conSesion} sesiones) contó con la presentación formal de la sesión de aprendizaje con inclusión de tecnologías de la información.`,
    },
    {
      id: "aip-auto-4",
      subtitulo: "Registro en el Libro Diario Oficial (Anexo 1)",
      detalle: "Se llevó al día el registro de control de asistencia de docentes al AIP según la normativa de la UGEL y el Ministerio de Educación, verificando los recursos utilizados y temas tratados.",
    }
  ];

  return {
    id: `act-aip-${Date.now()}`,
    numero: 2,
    titulo: `Acompañamiento y Desarrollo de Sesiones en el Aula de Innovación Pedagógica (AIP)`,
    objetivo: `Facilitar el uso de las tecnologías educativas y dinamizar el aprendizaje de los estudiantes en los diferentes grados y secciones de la institución.`,
    tareas,
    metasBeneficiarios: `${totalEstudiantes} estudiantes de primaria y ${uniqueDocentes.length} docentes de aula`,
    mediosVerificacion: `Ficha Oficial de Asistencia de Docentes al AIP (Anexo 1), Libro Diario y sesiones de aprendizaje`,
  };
}
