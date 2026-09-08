import React, { useState, useEffect, useMemo } from "react";
import { 
  RegistroAip, 
  Docente, 
  InformeMensualData, 
  InformeActividad, 
  TareaDescriptiva,
  BeneficiariosSelection,
  FechaEspecial
} from "../types";
import { 
  getDefaultInformeData, 
  buildAipActivityFromRecords, 
  createEmptyActivity,
  formatNumeroInforme,
  getBeneficiariosLabel,
  MESES_OPTIONS, 
  getMonthName 
} from "../utils/monthlyReportTemplates";
import { doesSpecialDateOverlapMonth } from "../utils/dateRangeUtils";
import { generateWordDocument } from "../utils/wordGenerator";
import { SCHOOL_LOGO_PATH } from "../assets/schoolLogo";
import { 
  FileSpreadsheet, 
  Download, 
  Sparkles, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Eye, 
  Edit3, 
  Layers, 
  Users,
  GraduationCap,
  HeartHandshake,
  UserCheck,
  CheckSquare,
  Square,
  Wand2,
  Loader2,
  Eraser,
  Hash,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  BookOpen
} from "lucide-react";

interface MonthlyReportModuleProps {
  registros: RegistroAip[];
  docentes: Docente[];
  fechasEspeciales?: FechaEspecial[];
  onOpenPdfReportModal: () => void;
  onNavigateToCalendario?: () => void;
}

export default function MonthlyReportModule({
  registros,
  docentes,
  fechasEspeciales = [],
  onOpenPdfReportModal,
  onNavigateToCalendario,
}: MonthlyReportModuleProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = 2026;

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeSubView, setActiveSubView] = useState<"editor" | "preview">("editor");
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  // AI Generation states
  const [generatingObjectiveIdx, setGeneratingObjectiveIdx] = useState<number | null>(null);
  const [generatingTasksIdx, setGeneratingTasksIdx] = useState<number | null>(null);
  const [isGeneratingAllObjectives, setIsGeneratingAllObjectives] = useState(false);
  const [isGeneratingBalance, setIsGeneratingBalance] = useState(false);
  const [generatingBalanceTarget, setGeneratingBalanceTarget] = useState<"todos" | "logros" | "dificultades" | "sugerencias" | null>(null);
  const [balanceFilter, setBalanceFilter] = useState<"todos" | "asistencia" | "actividad">("todos");
  const [aiNotification, setAiNotification] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Load from localStorage or create default for chosen month/year
  const storageKey = `iepm_informe_mensual_${selectedYear}_${selectedMonth}`;

  const [reportData, setReportData] = useState<InformeMensualData>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.actividades) {
          // ensure numeroCorrelativo exists
          if (!parsed.numeroCorrelativo) {
            parsed.numeroCorrelativo = currentMonth + 1;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read saved report", e);
    }
    return getDefaultInformeData(currentMonth, currentYear);
  });

  // Auto-dismiss AI notifications after 5 seconds
  useEffect(() => {
    if (aiNotification) {
      const t = setTimeout(() => setAiNotification(null), 5000);
      return () => clearTimeout(t);
    }
  }, [aiNotification]);

  // When month or year changes, switch or load draft
  const handleMonthYearChange = (newMonth: number, newYear: number) => {
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    const key = `iepm_informe_mensual_${newYear}_${newMonth}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.actividades) {
          if (!parsed.numeroCorrelativo) {
            parsed.numeroCorrelativo = newMonth + 1;
          }
          setReportData(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not read saved report", e);
    }
    // If not found, load defaults for that month
    setReportData(getDefaultInformeData(newMonth, newYear));
  };

  // Auto-save to localStorage whenever reportData changes
  useEffect(() => {
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(reportData));
        setSaveStatus("saved");
      } catch (e) {
        console.warn("Could not auto-save report:", e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [reportData, storageKey]);

  // Records for current selected month
  const targetYearStr = String(selectedYear);
  const targetMonthStr = String(selectedMonth + 1).padStart(2, "0");
  const monthRecords = registros.filter((r) => r.fecha.startsWith(`${targetYearStr}-${targetMonthStr}`));
  const totalSesionesMes = monthRecords.length;

  // Fechas Especiales for current selected month (which justify absence in AIP)
  const monthSpecialDates = useMemo(() => {
    if (!fechasEspeciales || fechasEspeciales.length === 0) return [];
    return fechasEspeciales
      .filter((f) => {
        if (!f.fecha) return false;
        return doesSpecialDateOverlapMonth(f, selectedYear, selectedMonth);
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [fechasEspeciales, selectedYear, selectedMonth]);

  // Handlers for modifying report data
  const handleResetToDefault = () => {
    if (window.confirm("¿Desea restablecer este informe a la plantilla oficial sugerida por el MINEDU/AIP? Se reiniciarán las actividades actuales del mes.")) {
      const defaultData = getDefaultInformeData(selectedMonth, selectedYear);
      setReportData(defaultData);
      setAiNotification({
        message: "Informe restablecido con la estructura oficial del MINEDU.",
        type: "info",
      });
    }
  };

  // Reset/Clear all activity descriptions to leave them completely empty
  const handleClearActivityDescriptions = () => {
    if (window.confirm("¿Desea vaciar los campos de descripción y objetivos de todas las actividades para redactar desde cero lo realizado en el mes?")) {
      const cleared = reportData.actividades.map((a) => ({
        ...a,
        descripcionTexto: "",
        objetivo: "",
        tareas: [],
      }));
      setReportData({ ...reportData, actividades: cleared });
      setAiNotification({
        message: "Campos de descripción vaciados. Redacte sus acciones y presione 'Proponer Objetivo con IA'.",
        type: "info",
      });
    }
  };

  // Report number changer
  const handleCorrelativoChange = (newNum: number) => {
    const formatted = formatNumeroInforme(newNum, selectedYear);
    setReportData({
      ...reportData,
      numeroCorrelativo: newNum,
      numeroInforme: formatted,
    });
  };

  // Smart feature: Synchronize with real AIP records
  const handleSyncWithAip = () => {
    const aipAct = buildAipActivityFromRecords(registros, selectedMonth, selectedYear);
    
    // Check if there is already an AIP activity
    const existingIndex = reportData.actividades.findIndex(
      (a) => a.titulo.toLowerCase().includes("aula de innovación") || a.numero === 2
    );

    let updatedActs = [...reportData.actividades];
    if (existingIndex >= 0) {
      aipAct.numero = updatedActs[existingIndex].numero;
      updatedActs[existingIndex] = aipAct;
    } else {
      aipAct.numero = updatedActs.length + 1;
      updatedActs.push(aipAct);
    }

    setReportData({
      ...reportData,
      actividades: updatedActs,
      incluirResumenAip: true,
      updatedAt: new Date().toISOString(),
    });

    setAiNotification({
      message: `Datos sincronizados con ${totalSesionesMes} sesiones del Libro Diario AIP (Anexo 1).`,
      type: "success",
    });
  };

  // Activity management
  const handleAddActivity = () => {
    const newNum = reportData.actividades.length + 1;
    const newAct = createEmptyActivity(newNum);

    setReportData({
      ...reportData,
      actividades: [...reportData.actividades, newAct],
    });
  };

  const handleUpdateActivity = (index: number, updated: Partial<InformeActividad>) => {
    const acts = [...reportData.actividades];
    acts[index] = { ...acts[index], ...updated };
    setReportData({ ...reportData, actividades: acts });
  };

  const handleDeleteActivity = (index: number) => {
    if (reportData.actividades.length <= 1) {
      alert("El informe debe contener al menos una actividad.");
      return;
    }
    const filtered = reportData.actividades.filter((_, i) => i !== index);
    const renumbered = filtered.map((act, i) => ({ ...act, numero: i + 1 }));
    setReportData({ ...reportData, actividades: renumbered });
  };

  const handleMoveActivity = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= reportData.actividades.length) return;

    const acts = [...reportData.actividades];
    const temp = acts[index];
    acts[index] = acts[newIndex];
    acts[newIndex] = temp;

    const renumbered = acts.map((act, i) => ({ ...act, numero: i + 1 }));
    setReportData({ ...reportData, actividades: renumbered });
  };

  // Preset PIP activity templates
  const handleAddPresetActivity = (tipo: "vacio" | "capacitacion" | "mantenimiento" | "acompanamiento" | "robotica") => {
    const newNum = reportData.actividades.length + 1;
    let newAct: InformeActividad;
    
    if (tipo === "capacitacion") {
      newAct = {
        id: `act-cap-${Date.now()}`,
        numero: newNum,
        titulo: "Capacitación y Fortalecimiento de Competencias Digitales Docentes",
        objetivo: "Desarrollar capacidades en los docentes sobre el aprovechamiento pedagógico de recursos TIC e Inteligencia Artificial en el proceso de enseñanza-aprendizaje.",
        descripcionTexto: "Talleres colegiados y asesoramiento individualizado a los docentes de primaria en el diseño de sesiones interactivas, uso de recursos multimedia y plataformas educativas.",
        beneficiariosChecks: { profesores: true, estudiantes: false, ambos: false, padres: false },
        metasBeneficiarios: "Plana docente del nivel primario (1° a 6° grado)",
        mediosVerificacion: "Listas de asistencia colegiada, productos digitales elaborados",
        tareas: [
          { id: `t1-${Date.now()}`, subtitulo: "Taller Colegiado TIC", detalle: "Orientación práctica sobre integración de recursos digitales y herramientas de IA en las unidades de aprendizaje." },
          { id: `t2-${Date.now()}`, subtitulo: "Asesoramiento Personalizado", detalle: "Acompañamiento a docentes en la preparación de fichas interactivas y presentaciones multimedia." }
        ]
      };
    } else if (tipo === "mantenimiento") {
      newAct = {
        id: `act-mant-${Date.now()}`,
        numero: newNum,
        titulo: "Mantenimiento Técnico, Operatividad y Soporte del Equipamiento AIP",
        objetivo: "Garantizar la disponibilidad, operatividad técnica y correcto funcionamiento de las computadoras, laptops XO, proyector multimedia y conectividad en el aula de innovación.",
        descripcionTexto: "Revisión técnica periódica de software y hardware, desinfección de periféricos, mantenimiento preventivo de laptops XO y verificación de conectividad de red.",
        beneficiariosChecks: { profesores: true, estudiantes: true, ambos: true, padres: false },
        metasBeneficiarios: "Comunidad educativa de la IEPM N° 24009",
        mediosVerificacion: "Fichas de inventario técnico y bitácora de mantenimiento",
        tareas: [
          { id: `t1-${Date.now()}`, subtitulo: "Mantenimiento de Laptops XO", detalle: "Revisión preventiva de software, calibración de baterías y actualización de actividades educativas." },
          { id: `t2-${Date.now()}`, subtitulo: "Operatividad de Red y Proyector", detalle: "Configuración y verificación del punto de acceso a internet y operatividad del proyector multimedia." }
        ]
      };
    } else if (tipo === "acompanamiento") {
      newAct = {
        id: `act-acomp-${Date.now()}`,
        numero: newNum,
        titulo: "Acompañamiento Pedagógico y Monitoreo en el Aula de Innovación",
        objetivo: "Asistir y orientar a los docentes y estudiantes durante el desarrollo de las sesiones pedagógicas programadas en el AIP.",
        descripcionTexto: "Apoyo técnico-pedagógico directo en el aula de innovación a los docentes que asisten con sus secciones según el horario establecido en el Libro Diario Oficial.",
        beneficiariosChecks: { profesores: true, estudiantes: true, ambos: true, padres: false },
        metasBeneficiarios: "Docentes de aula y estudiantes de 1° a 6° grado",
        mediosVerificacion: "Libro Diario Oficial Anexo 1 debidamente firmado",
        tareas: [
          { id: `t1-${Date.now()}`, subtitulo: "Asistencia en Sesión", detalle: "Soporte inmediato a los alumnos y docentes en el encendido, acceso y manejo de aplicaciones interactivas." }
        ]
      };
    } else if (tipo === "robotica") {
      newAct = {
        id: `act-rob-${Date.now()}`,
        numero: newNum,
        titulo: "Proyectos de Ciudadanía Digital, Pensamiento Computacional y Robótica",
        objetivo: "Fomentar el uso seguro, crítico y ético de la tecnología y desarrollar el pensamiento lógico a través de proyectos colaborativos y robótica educativa.",
        descripcionTexto: "Desarrollo de dinámicas participativas sobre seguridad en internet, cuidado de la identidad digital y armado guiado con kits de robótica educativa.",
        beneficiariosChecks: { profesores: false, estudiantes: true, ambos: false, padres: false },
        metasBeneficiarios: "Estudiantes del III, IV y V ciclo de primaria",
        mediosVerificacion: "Fotografías de proyectos construidos y fichas de trabajo de los estudiantes",
        tareas: [
          { id: `t1-${Date.now()}`, subtitulo: "Seguridad Digital", detalle: "Sensibilización sobre el cuidado de datos personales y búsqueda responsable de información en internet." }
        ]
      };
    } else {
      newAct = createEmptyActivity(newNum);
    }

    setReportData({
      ...reportData,
      actividades: [...reportData.actividades, newAct],
    });
    setAiNotification({
      message: `Se incorporó "${newAct.titulo}" a las actividades del mes.`,
      type: "success",
    });
  };

  // Specific Tasks / Actions inside an Activity
  const handleAddTask = (actIdx: number) => {
    const act = reportData.actividades[actIdx];
    const currentTasks = act.tareas || [];
    const newTask: TareaDescriptiva = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subtitulo: "Acción ejecutada",
      detalle: "",
    };
    handleUpdateActivity(actIdx, { tareas: [...currentTasks, newTask] });
  };

  const handleUpdateTask = (actIdx: number, taskIdx: number, updated: Partial<TareaDescriptiva>) => {
    const act = reportData.actividades[actIdx];
    const currentTasks = [...(act.tareas || [])];
    currentTasks[taskIdx] = { ...currentTasks[taskIdx], ...updated };
    handleUpdateActivity(actIdx, { tareas: currentTasks });
  };

  const handleDeleteTask = (actIdx: number, taskIdx: number) => {
    const act = reportData.actividades[actIdx];
    const currentTasks = (act.tareas || []).filter((_, i) => i !== taskIdx);
    handleUpdateActivity(actIdx, { tareas: currentTasks });
  };

  // Beneficiaries checkbox toggler
  const handleToggleBeneficiario = (
    actIdx: number,
    field: "profesores" | "estudiantes" | "ambos" | "padres"
  ) => {
    const act = reportData.actividades[actIdx];
    const current = act.beneficiariosChecks || {
      profesores: true,
      estudiantes: true,
      ambos: true,
      padres: false,
    };

    const next: BeneficiariosSelection = { ...current };

    if (field === "ambos") {
      const willCheck = !current.ambos;
      next.ambos = willCheck;
      next.profesores = willCheck;
      next.estudiantes = willCheck;
    } else if (field === "profesores") {
      next.profesores = !current.profesores;
      next.ambos = next.profesores && next.estudiantes;
    } else if (field === "estudiantes") {
      next.estudiantes = !current.estudiantes;
      next.ambos = next.profesores && next.estudiantes;
    } else if (field === "padres") {
      next.padres = !current.padres;
    }

    const newLabel = getBeneficiariosLabel(next);
    handleUpdateActivity(actIdx, {
      beneficiariosChecks: next,
      metasBeneficiarios: newLabel,
    });
  };

  // AI: Propose Objective for a single activity
  const handleProposeObjective = async (actIdx: number) => {
    const act = reportData.actividades[actIdx];
    if (!act) return;

    const descToUse = act.descripcionTexto?.trim() || act.tareas?.map(t => `${t.subtitulo}: ${t.detalle}`).join(". ");
    
    if (!descToUse && !act.titulo) {
      setAiNotification({
        message: "Por favor escriba primero en la 'Descripción de Actividades Realizadas' lo que desarrolló en el mes.",
        type: "info",
      });
      return;
    }

    setGeneratingObjectiveIdx(actIdx);
    try {
      const res = await fetch("/api/ai/generate-objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: act.titulo,
          descripcion: descToUse,
          beneficiarios: act.metasBeneficiarios,
          mes: getMonthName(selectedMonth),
        }),
      });

      const data = await res.json();
      if (data.objetivo) {
        handleUpdateActivity(actIdx, { objetivo: data.objetivo });
        setAiNotification({
          message: `Objetivo propuesto por IA para la Actividad ${act.numero}. Puede ajustarlo o editarlo directamente.`,
          type: "success",
        });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error("Error generating objective:", err);
      setAiNotification({
        message: "No se pudo conectar con el servicio de IA. Verifique su red o intente nuevamente.",
        type: "error",
      });
    } finally {
      setGeneratingObjectiveIdx(null);
    }
  };

  // AI: Propose Objectives for all activities
  const handleProposeAllObjectives = async () => {
    setIsGeneratingAllObjectives(true);
    let updatedActs = [...reportData.actividades];
    let count = 0;

    for (let i = 0; i < updatedActs.length; i++) {
      const act = updatedActs[i];
      const descToUse = act.descripcionTexto?.trim() || act.tareas?.map(t => `${t.subtitulo}: ${t.detalle}`).join(". ");
      if (descToUse || act.titulo) {
        try {
          const res = await fetch("/api/ai/generate-objectives", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              titulo: act.titulo,
              descripcion: descToUse,
              beneficiarios: act.metasBeneficiarios,
              mes: getMonthName(selectedMonth),
            }),
          });
          const data = await res.json();
          if (data.objetivo) {
            updatedActs[i] = { ...updatedActs[i], objetivo: data.objetivo };
            count++;
          }
        } catch (e) {
          console.warn(`Could not generate objective for act ${i + 1}`, e);
        }
      }
    }

    setReportData({ ...reportData, actividades: updatedActs });
    setIsGeneratingAllObjectives(false);
    setAiNotification({
      message: `Se redactaron objetivos pedagógicos con IA para ${count} actividades. Puede editarlos según su criterio.`,
      type: "success",
    });
  };

  // AI & Smart helper: Generate/Structure specific actions for an activity
  const handleGenerateTasksWithAi = (actIdx: number) => {
    const act = reportData.actividades[actIdx];
    if (!act) return;

    setGeneratingTasksIdx(actIdx);
    setTimeout(() => {
      const text = act.descripcionTexto?.trim() || "";
      let newTasks: TareaDescriptiva[] = [];

      if (text.length > 0) {
        // Split text by line breaks or punctuated sentences
        const lines = text
          .split(/\n|(?<=[.!?])\s+/)
          .map((l) => l.trim())
          .filter((l) => l.length > 6);

        if (lines.length > 0) {
          newTasks = lines.slice(0, 4).map((line, idx) => {
            const clean = line.replace(/^[-•*]\s*/, "");
            const parts = clean.split(/:\s*|-|\u2013/);
            if (parts.length > 1 && parts[0].length < 35) {
              return {
                id: `task-${Date.now()}-${idx}`,
                subtitulo: parts[0].trim(),
                detalle: parts.slice(1).join(": ").trim(),
              };
            }
            return {
              id: `task-${Date.now()}-${idx}`,
              subtitulo: `Acción N° ${idx + 1}`,
              detalle: clean,
            };
          });
        }
      }

      if (newTasks.length === 0) {
        // Fallback structured tasks based on activity context
        newTasks = [
          {
            id: `task-${Date.now()}-1`,
            subtitulo: "Coordinación y Planificación",
            detalle: `Coordinación pedagógica y técnica para la ejecución de las actividades correspondientes a ${act.titulo.toLowerCase()}.`,
          },
          {
            id: `task-${Date.now()}-2`,
            subtitulo: "Ejecución y Acompañamiento en el AIP",
            detalle: `Desarrollo de las sesiones programadas, brindando soporte continuo a ${act.metasBeneficiarios.toLowerCase() || "los participantes"}.`,
          },
          {
            id: `task-${Date.now()}-3`,
            subtitulo: "Sistematización y Evidencias",
            detalle: "Registro diario en el Libro Anexo 1, recopilación de evidencias fotográficas y verificación de productos digitales.",
          },
        ];
      }

      handleUpdateActivity(actIdx, { tareas: newTasks });
      setGeneratingTasksIdx(null);
      setAiNotification({
        message: `Se estructuraron ${newTasks.length} acciones realizadas para la Actividad ${act.numero}. Puede modificarlas o añadir más.`,
        type: "success",
      });
    }, 300);
  };

  // AI: Automatically Redact Logros, Dificultades y Sugerencias evaluating both axes:
  // 1. Asistencia de los docentes y sus sesiones curriculares en el AIP
  // 2. Actividades y acciones planificadas realizadas por el PIP
  const handleGenerateBalanceWithAi = async (targetSection: "todos" | "logros" | "dificultades" | "sugerencias" = "todos") => {
    setIsGeneratingBalance(true);
    setGeneratingBalanceTarget(targetSection);
    try {
      const statsInfo = {
        totalSesiones: totalSesionesMes,
        totalEstudiantes: monthRecords.reduce((s, r) => s + (r.estudiantesAsistentes || 0), 0),
        docentesAtendidos: Array.from(new Set(monthRecords.map((r) => r.docenteNombre))).length,
        pctConSesion: totalSesionesMes > 0 ? Math.round((monthRecords.filter((r) => r.presentoSesion).length / totalSesionesMes) * 100) : 0,
      };

      // Mapeo detallado de asistencia y sesiones por docente en el AIP
      const attendanceMap = new Map<string, { count: number; areas: Set<string>; grados: Set<string> }>();
      monthRecords.forEach((r) => {
        const docName = r.docenteNombre || "Docente";
        const item = attendanceMap.get(docName) || { count: 0, areas: new Set(), grados: new Set() };
        item.count++;
        if (r.area) item.areas.add(r.area);
        if (r.grado) item.grados.add(`${r.grado} ${r.seccion || ""}`.trim());
        attendanceMap.set(docName, item);
      });

      const docentesAsistieronDetalle = Array.from(attendanceMap.entries()).map(([nombre, d]) => 
        `${nombre} (${d.count} ${d.count === 1 ? "sesión" : "sesiones"} en ${Array.from(d.areas).join(", ") || "TIC"}, ${Array.from(d.grados).join(", ") || ""})`
      );

      // Docentes de aula de la IE que no registraron visitas al AIP en el mes (excluyendo PIP y Director)
      const regularTeachers = (docentes || []).filter((d) => 
        !d.especialidad?.toLowerCase().includes("pip") && 
        !d.grado?.toLowerCase().includes("director")
      );
      const docentesSinVisita = regularTeachers
        .filter((d) => {
          const dniMatch = monthRecords.some((r) => r.docenteDni === d.dni);
          const nameMatch = monthRecords.some((r) => 
            (r.docenteNombre || "").toLowerCase().includes((d.apellidosNombres || "").toLowerCase())
          );
          return !dniMatch && !nameMatch;
        })
        .map((d) => `${d.apellidosNombres} (${d.grado || "Grado"} "${d.seccion || ""}")`);

      // Distribución de áreas curriculares en el AIP
      const areaCountMap: Record<string, number> = {};
      monthRecords.forEach((r) => {
        if (r.area) areaCountMap[r.area] = (areaCountMap[r.area] || 0) + 1;
      });
      const resumenAreas = Object.entries(areaCountMap)
        .map(([area, count]) => `${area}: ${count} ${count === 1 ? "sesión" : "sesiones"}`)
        .join(", ");

      // Recursos informáticos / software utilizados
      const recursosSet = new Set<string>();
      monthRecords.forEach((r) => {
        if (r.recurso) recursosSet.add(r.recurso);
      });
      const resumenRecursos = Array.from(recursosSet).slice(0, 8).join(", ");

      const res = await fetch("/api/ai/generate-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actividades: reportData.actividades,
          beneficiariosGlobales: getBeneficiariosLabel(reportData.beneficiariosGlobales),
          mes: getMonthName(selectedMonth),
          ano: selectedYear,
          estadisticasAip: statsInfo,
          seccion: targetSection,
          docentesDetalle: {
            totalDocentesColegio: docentes.length,
            docentesAtendidos: statsInfo.docentesAtendidos,
            docentesAsistieronDetalle,
            docentesSinVisita,
            resumenAreas,
            resumenRecursos,
          },
          fechasEspecialesMes: monthSpecialDates.map((f) => ({
            fecha: (f.fechaFin && f.fechaFin !== f.fecha) ? `${f.fecha} al ${f.fechaFin} (${f.diasRango || ''} días)` : f.fecha,
            titulo: f.titulo,
            tipo: f.tipo,
            motivoJustificacion: f.motivoJustificacion,
          })),
        }),
      });

      const data = await res.json();
      if (data.logros || data.dificultades || data.sugerencias) {
        setReportData((prev) => {
          const next = { ...prev };
          if (targetSection === "todos" || targetSection === "logros") {
            if (data.logros) next.logros = data.logros;
          }
          if (targetSection === "todos" || targetSection === "dificultades") {
            if (data.dificultades) next.dificultades = data.dificultades;
          }
          if (targetSection === "todos" || targetSection === "sugerencias") {
            if (data.sugerencias) next.sugerencias = data.sugerencias;
          }
          return next;
        });

        const targetLabel = 
          targetSection === "logros" ? "Logros alcanzados" :
          targetSection === "dificultades" ? "Dificultades" :
          targetSection === "sugerencias" ? "Sugerencias de mejora" :
          "Los 3 puntos (Logros, Dificultades y Sugerencias)";

        setAiNotification({
          message: `Evaluación con IA completada para ${targetLabel} considerando la asistencia de docentes en el AIP y las actividades realizadas.`,
          type: "success",
        });
      } else {
        throw new Error(data.error || "Respuesta inválida del servidor");
      }
    } catch (err: any) {
      console.error("Error generating balance:", err);
      setAiNotification({
        message: "Ocurrió un error al redactar el balance con IA.",
        type: "error",
      });
    } finally {
      setIsGeneratingBalance(false);
      setGeneratingBalanceTarget(null);
    }
  };

  // Balance (Logros, Dificultades, Sugerencias) management
  const handleAddBalanceItem = (type: "logros" | "dificultades" | "sugerencias", defaultCategory?: "asistencia" | "actividad") => {
    const currentList = reportData[type] || [];
    const prefix = defaultCategory === "asistencia" 
      ? "[Asistencia y Sesiones Docentes en AIP] " 
      : defaultCategory === "actividad"
      ? "[Actividades y Soporte PIP] "
      : "";
    const typeLabel = type === "logros" ? "Logros" : type === "dificultades" ? "Dificultades" : "Sugerencias";
    const textPrompt = prompt(`Ingrese un nuevo punto para ${typeLabel}:`, prefix);
    if (textPrompt && textPrompt.trim()) {
      setReportData({
        ...reportData,
        [type]: [...currentList, textPrompt.trim()],
      });
    }
  };

  const handleUpdateBalanceItem = (type: "logros" | "dificultades" | "sugerencias", index: number, value: string) => {
    const currentList = [...reportData[type]];
    currentList[index] = value;
    setReportData({ ...reportData, [type]: currentList });
  };

  const handleDeleteBalanceItem = (type: "logros" | "dificultades" | "sugerencias", index: number) => {
    const currentList = reportData[type].filter((_, i) => i !== index);
    setReportData({ ...reportData, [type]: currentList });
  };

  // Export to Microsoft Word (.docx)
  const handleExportWord = async () => {
    setIsExportingWord(true);
    try {
      const blob = await generateWordDocument(reportData, monthRecords, monthSpecialDates);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const monthLabel = getMonthName(selectedMonth);
      a.download = `Informe_Mensual_${monthLabel}_${selectedYear}_PIP_IEPM_24009.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error al exportar Word:", e);
      alert("Error al generar el documento Word: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* AI Notification Toast */}
      {aiNotification && (
        <div 
          className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-xl border flex items-start gap-3 transition-all animate-slideUp ${
            aiNotification.type === "success" 
              ? "bg-emerald-950 text-emerald-100 border-emerald-700" 
              : aiNotification.type === "error"
              ? "bg-rose-950 text-rose-100 border-rose-700"
              : "bg-slate-900 text-slate-100 border-slate-700"
          }`}
        >
          {aiNotification.type === "success" ? (
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : aiNotification.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs leading-relaxed font-medium">
            {aiNotification.message}
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-16 sm:w-16 sm:h-20 bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex items-center justify-center shrink-0 shadow-xs">
            <img src={SCHOOL_LOGO_PATH} alt="Insignia 24009" className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold uppercase tracking-wider font-mono mb-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              Módulo Oficial de Gestión Pedagógica (PIP)
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              Elaborador de Informe Mensual de Actividades
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl mt-1">
              Configure el número de informe, redacte sus actividades del mes con propuesta de objetivos por IA, seleccione beneficiarios por checks y genere automáticamente el balance pedagógico editable para descargar en Word (.docx con membrete institucional).
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSyncWithAip}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Importa el total de sesiones, alumnos atendidos y áreas del AIP de este mes"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Sincronizar AIP ({totalSesionesMes})</span>
          </button>

          <button
            type="button"
            onClick={handleExportWord}
            disabled={isExportingWord}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1E36] hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg"
          >
            {isExportingWord ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generando Word...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-blue-400" />
                <span>Descargar en Word (.docx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Mode Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month & Year pickers & Number selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 font-mono">Mes:</span>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthYearChange(parseInt(e.target.value, 10), selectedYear)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
            >
              {MESES_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 font-mono">Año:</span>
            <select
              value={selectedYear}
              onChange={(e) => handleMonthYearChange(selectedMonth, parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Save Status Badge */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
            {saveStatus === "saving" ? (
              <span className="text-amber-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Guardando borrador...
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Guardado en el portal
              </span>
            )}
          </div>
        </div>

        {/* View Switcher & Action buttons */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSubView("editor")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === "editor"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Editor de Actividades</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView("preview")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === "preview"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-purple-600" />
              <span>Vista Previa del Documento</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Restablecer a plantilla oficial"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeSubView === "editor" ? (
        <div className="space-y-6">
          {/* Section 1: Header / Institutional Data & Número de Informe Picker */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Encabezado Oficial y Número de Informe
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Selección de número correlativo y datos de remisión
              </span>
            </div>

            {/* Número de informe selector card */}
            <div className="p-4 bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-mono font-black text-sm shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                      Elegir Número de Informe
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Seleccione el correlativo numérico mensual o escriba su numeración personalizada
                    </p>
                  </div>
                </div>

                {/* Quick correlative pills */}
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase font-mono text-slate-400 px-1">N°:</span>
                  <select
                    value={reportData.numeroCorrelativo || selectedMonth + 1}
                    onChange={(e) => handleCorrelativoChange(parseInt(e.target.value, 10))}
                    className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-black text-blue-900 outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>
                        Informe N° {String(n).padStart(2, "0")} ({MESES_OPTIONS[n - 1]?.label || `Mes ${n}`})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5">
                    <button
                      type="button"
                      onClick={() => handleCorrelativoChange(Math.max(1, (reportData.numeroCorrelativo || 1) - 1))}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-black text-slate-700 cursor-pointer"
                      title="Anterior"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCorrelativoChange((reportData.numeroCorrelativo || 1) + 1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-black text-slate-700 cursor-pointer"
                      title="Siguiente"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Full editable text representation */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Código y Denominación Oficial Completa del Informe (Editable)
                </label>
                <input
                  type="text"
                  value={reportData.numeroInforme}
                  onChange={(e) => setReportData({ ...reportData, numeroInforme: e.target.value })}
                  className="w-full bg-white border border-blue-300 rounded-xl px-3.5 py-2 font-mono font-black text-xs text-[#0B1E36] outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  placeholder="INFORME N° 001-2026-GRA/DREA/UGEL-IEPM N° 24009-“TAII”-PIP"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Director(a) Destinatario(a) (A)
                </label>
                <input
                  type="text"
                  value={reportData.directorNombre}
                  onChange={(e) => setReportData({ ...reportData, directorNombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Docente PIP Emisor (DE)
                </label>
                <input
                  type="text"
                  value={reportData.remitenteNombre}
                  onChange={(e) => setReportData({ ...reportData, remitenteNombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Lugar y Fecha
                </label>
                <input
                  type="text"
                  value={`${reportData.lugar}, ${reportData.fechaTexto}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(",");
                    setReportData({
                      ...reportData,
                      lugar: parts[0]?.trim() || reportData.lugar,
                      fechaTexto: parts[1]?.trim() || reportData.fechaTexto,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Asunto del Informe
                </label>
                <input
                  type="text"
                  value={reportData.asunto}
                  onChange={(e) => setReportData({ ...reportData, asunto: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Párrafo de Introducción / Saludo Formal
              </label>
              <textarea
                rows={2}
                value={reportData.introduccion}
                onChange={(e) => setReportData({ ...reportData, introduccion: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 2: Activities Builder with Empty Description, Checkboxes for Beneficiaries, and AI Objectives */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  I. Descripción de las Actividades Realizadas ({reportData.actividades.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingrese las actividades ejecutadas en el mes, active los beneficiarios mediante checks y presione <span className="font-bold text-purple-700">Proponer Objetivo con IA</span>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearActivityDescriptions}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  title="Vaciar las descripciones de actividades para empezar desde cero"
                >
                  <Eraser className="w-3.5 h-3.5 text-slate-500" />
                  <span>Vaciar Descripciones</span>
                </button>

                <button
                  type="button"
                  onClick={handleProposeAllObjectives}
                  disabled={isGeneratingAllObjectives}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-black transition-all cursor-pointer shadow-2xs"
                  title="Formula objetivos pedagógicos con IA para todas las actividades que tengan descripción"
                >
                  {isGeneratingAllObjectives ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-700" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 text-purple-700" />
                  )}
                  <span>Proponer Todos los Objetivos (IA)</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddActivity}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#D92323] border border-red-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Actividad</span>
                </button>
              </div>
            </div>

            {/* Activities List */}
            <div className="space-y-6">
              {reportData.actividades.map((act, actIdx) => {
                const checks = act.beneficiariosChecks || {
                  profesores: true,
                  estudiantes: true,
                  ambos: true,
                  padres: false,
                };

                const isGeneratingThisObjective = generatingObjectiveIdx === actIdx;

                return (
                  <div
                    key={act.id}
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 hover:border-slate-300 transition-all shadow-2xs"
                  >
                    {/* Activity Card Header */}
                    <div className="bg-white p-4 border-b border-slate-200/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-[#D92323] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          {String(act.numero).padStart(2, "0")}
                        </span>
                        <input
                          type="text"
                          value={act.titulo}
                          onChange={(e) => handleUpdateActivity(actIdx, { titulo: e.target.value })}
                          className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                          placeholder="Título de la Actividad (Ej: Talleres de Capacitación Docente / Sesiones en AIP)"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveActivity(actIdx, "up")}
                          disabled={actIdx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Mover arriba"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveActivity(actIdx, "down")}
                          disabled={actIdx === reportData.actividades.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Mover abajo"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(actIdx)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer ml-1"
                          title="Eliminar actividad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Activity Body */}
                    <div className="p-4 sm:p-5 space-y-5">
                      {/* Checkboxes for Beneficiaries: Profesores, Estudiantes, Ambos, Padres de Familia */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span>Selección de Beneficiarios (Active con Check):</span>
                          </label>
                          <span className="text-[10px] text-slate-400 italic">
                            Haga clic en los checks para activar los destinatarios de esta actividad
                          </span>
                        </div>

                        {/* 4 Checks: Profesores, Estudiantes, Ambos, Padres */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {/* Profesores */}
                          <button
                            type="button"
                            onClick={() => handleToggleBeneficiario(actIdx, "profesores")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                              checks.profesores
                                ? "bg-blue-50 border-blue-300 text-blue-900 shadow-2xs"
                                : "bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {checks.profesores ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="block text-xs leading-none">Profesores</span>
                              <span className="text-[9px] text-slate-400 font-normal">Plana docente</span>
                            </div>
                          </button>

                          {/* Estudiantes */}
                          <button
                            type="button"
                            onClick={() => handleToggleBeneficiario(actIdx, "estudiantes")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                              checks.estudiantes
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs"
                                : "bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {checks.estudiantes ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="block text-xs leading-none">Estudiantes</span>
                              <span className="text-[9px] text-slate-400 font-normal">1° a 6° grado</span>
                            </div>
                          </button>

                          {/* Ambos (Docentes y Estudiantes) */}
                          <button
                            type="button"
                            onClick={() => handleToggleBeneficiario(actIdx, "ambos")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                              checks.ambos
                                ? "bg-purple-50 border-purple-300 text-purple-900 shadow-2xs"
                                : "bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {checks.ambos ? (
                              <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="block text-xs leading-none">Ambos</span>
                              <span className="text-[9px] text-slate-400 font-normal">Docentes + Niños</span>
                            </div>
                          </button>

                          {/* Padres de Familia */}
                          <button
                            type="button"
                            onClick={() => handleToggleBeneficiario(actIdx, "padres")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                              checks.padres
                                ? "bg-amber-50 border-amber-300 text-amber-900 shadow-2xs"
                                : "bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {checks.padres ? (
                              <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="block text-xs leading-none">Padres de Familia</span>
                              <span className="text-[9px] text-slate-400 font-normal">APAFA / Familias</span>
                            </div>
                          </button>
                        </div>

                        {/* Cobertura text output */}
                        <div>
                          <input
                            type="text"
                            value={act.metasBeneficiarios || ""}
                            onChange={(e) => handleUpdateActivity(actIdx, { metasBeneficiarios: e.target.value })}
                            className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                            placeholder="Texto resultante de beneficiarios (editable)..."
                          />
                        </div>
                      </div>

                      {/* 1. Descripción de Actividades Realizadas en el Mes */}
                      <div className="space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#D92323]" />
                            Descripción General de Actividades Realizadas en el Mes
                          </label>
                          <span className="text-[10px] text-slate-400">
                            Escriba libremente lo ejecutado; la IA usará este texto para formular el objetivo
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={act.descripcionTexto || ""}
                          onChange={(e) => handleUpdateActivity(actIdx, { descripcionTexto: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 leading-relaxed shadow-2xs placeholder:text-slate-400 placeholder:italic"
                          placeholder="Campo en blanco para agregar las actividades realizadas en el mes (Ejemplo: Se realizaron 3 sesiones de trabajo colegiado con los docentes sobre el uso de recursos multimedia y Canva, se orientó en el diseño de fichas interactivas y se dio soporte técnico a 12 computadoras del aula de innovación...)"
                        />
                      </div>

                      {/* 2. Descripción de las Acciones Realizadas (Mis Acciones / Tareas Incorporadas) */}
                      <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                          <div>
                            <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                              <span>Descripción de las Acciones Realizadas ({act.tareas?.length || 0})</span>
                            </h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Incorpore sus acciones específicas que se desglosarán con viñetas en la columna oficial del Word.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleGenerateTasksWithAi(actIdx)}
                              disabled={generatingTasksIdx === actIdx}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                              title="Desglosa el texto redactado arriba en acciones estructuradas"
                            >
                              {generatingTasksIdx === actIdx ? (
                                <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-purple-600" />
                              )}
                              <span>Desglosar con IA</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAddTask(actIdx)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Incorporar Mi Actividad</span>
                            </button>
                          </div>
                        </div>

                        {/* List of specific tasks */}
                        {act.tareas && act.tareas.length > 0 ? (
                          <div className="space-y-2.5">
                            {act.tareas.map((task, taskIdx) => (
                              <div
                                key={task.id || taskIdx}
                                className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2 shadow-2xs group hover:border-blue-400 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                      {taskIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={task.subtitulo}
                                      onChange={(e) => handleUpdateTask(actIdx, task.id, { subtitulo: e.target.value })}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                                      placeholder="Denominación de la acción (Ej: Capacitación docente, Mantenimiento técnico...)"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(actIdx, task.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Eliminar esta acción"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <textarea
                                  rows={2}
                                  value={task.detalle}
                                  onChange={(e) => handleUpdateTask(actIdx, task.id, { detalle: e.target.value })}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none focus:border-blue-500 leading-relaxed placeholder:text-slate-400"
                                  placeholder="Detalle descriptivo de lo ejecutado en esta acción..."
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-3 px-4 bg-white/70 border border-dashed border-slate-200 rounded-xl">
                            <p className="text-[11px] text-slate-500">
                              No hay acciones desglosadas aún. Puede hacer clic en{" "}
                              <strong className="text-blue-700 font-bold">+ Incorporar Mi Actividad</strong> para añadir tareas específicas o redactar arriba y presionar{" "}
                              <strong className="text-purple-700 font-bold">Desglosar con IA</strong>.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 3. Objective Field with Automatic AI proposal */}
                      <div className="space-y-1.5 bg-gradient-to-r from-purple-50/60 via-white to-blue-50/40 p-3.5 rounded-xl border border-purple-200/80 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                            <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                            <span>Objetivo de la Actividad (Generado por IA / Editable):</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleProposeObjective(actIdx)}
                            disabled={isGeneratingThisObjective}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                            title="Genera automáticamente un objetivo pedagógico con base en su descripción"
                          >
                            {isGeneratingThisObjective ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Generando...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-purple-200" />
                                <span>Proponer Objetivo con IA</span>
                              </>
                            )}
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={act.objetivo}
                          onChange={(e) => handleUpdateActivity(actIdx, { objetivo: e.target.value })}
                          className="w-full bg-white border border-purple-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 leading-relaxed placeholder:text-slate-400 placeholder:italic"
                          placeholder="Presione 'Proponer Objetivo con IA' o escriba directamente el objetivo..."
                        />
                      </div>

                      {/* 3. Evidencias / Medios de verificación */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Medios de Verificación / Evidencias
                          </label>
                          <input
                            type="text"
                            value={act.mediosVerificacion || ""}
                            onChange={(e) => handleUpdateActivity(actIdx, { mediosVerificacion: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                            placeholder="Ej: Fichas de Asistencia Anexo 1, registro fotográfico y sesiones TIC"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Estado de Ejecución
                          </label>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Ejecutado al 100% en el periodo</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: AIP Statistics Synchronizer Card */}
          <div className="bg-gradient-to-r from-purple-50 via-white to-blue-50 border border-purple-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  Cuadro Estadístico del Uso del AIP ({getMonthName(selectedMonth)} {selectedYear})
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Calculado en tiempo real con las sesiones ingresadas en el Libro Diario Oficial (Anexo 1)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportData.incluirResumenAip}
                    onChange={(e) => setReportData({ ...reportData, incluirResumenAip: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Incluir en el Documento Word</span>
                </label>

                <button
                  type="button"
                  onClick={onOpenPdfReportModal}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  Ver Ficha Anexo 1
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Sesiones Atendidas</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{totalSesionesMes}</span>
                <span className="text-[10px] text-slate-400">En el mes</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Estudiantes Atendidos</span>
                <span className="text-lg font-black text-blue-700 mt-0.5 block">
                  {monthRecords.reduce((s, r) => s + (r.estudiantesAsistentes || 0), 0)}
                </span>
                <span className="text-[10px] text-slate-400">Total asistencias</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Docentes Participantes</span>
                <span className="text-lg font-black text-purple-700 mt-0.5 block">
                  {Array.from(new Set(monthRecords.map((r) => r.docenteNombre))).length}
                </span>
                <span className="text-[10px] text-slate-400">Docentes únicos</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Sesión Presentada</span>
                <span className="text-lg font-black text-emerald-700 mt-0.5 block">
                  {totalSesionesMes > 0
                    ? `${Math.round((monthRecords.filter((r) => r.presentoSesion).length / totalSesionesMes) * 100)}%`
                    : "0%"}
                </span>
                <span className="text-[10px] text-slate-400">Cumplimiento TIC</span>
              </div>
            </div>
          </div>

          {/* Section 3: Justificación de Fechas Especiales sin Atención en el AIP */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Justificación de Fechas sin Actividad en el AIP
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    monthSpecialDates.length > 0 
                      ? "bg-amber-50 text-amber-800 border-amber-200" 
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {monthSpecialDates.length} {monthSpecialDates.length === 1 ? "fecha registrada" : "fechas registradas"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Feriados calendario, semanas de gestión y contingencias que justifican la no asistencia del docente al AIP en el mes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportData.incluirFechasEspeciales !== false}
                    onChange={(e) => setReportData({ ...reportData, incluirFechasEspeciales: e.target.checked })}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Incluir tabla en el informe Word</span>
                </label>

                {onNavigateToCalendario && (
                  <button
                    type="button"
                    onClick={onNavigateToCalendario}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>Ir al Calendario AIP</span>
                    <ExternalLink className="w-3 h-3 text-amber-600 ml-0.5" />
                  </button>
                )}
              </div>
            </div>

            {monthSpecialDates.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        <th className="py-2.5 px-3 w-12 text-center">N°</th>
                        <th className="py-2.5 px-3 w-28">Fecha</th>
                        <th className="py-2.5 px-4">Motivo / Denominación</th>
                        <th className="py-2.5 px-3 w-36">Tipo</th>
                        <th className="py-2.5 px-4">Justificación Oficial MINEDU / AIP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {monthSpecialDates.map((fechaEsp, fIdx) => (
                        <tr key={fechaEsp.id || fIdx} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                            {fIdx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {fechaEsp.fechaFin && fechaEsp.fechaFin !== fechaEsp.fecha
                                ? `${fechaEsp.fecha} al ${fechaEsp.fechaFin}`
                                : fechaEsp.fecha}
                            </span>
                            {fechaEsp.fechaFin && fechaEsp.fechaFin !== fechaEsp.fecha && (
                              <span className="block text-[10px] text-amber-700 font-bold mt-0.5">
                                {fechaEsp.diasRango ? `${fechaEsp.diasRango} días` : "Periodo"}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-slate-900 block">{fechaEsp.titulo}</span>
                            {fechaEsp.turno && fechaEsp.turno !== "ambos" && (
                              <span className="text-[10px] text-slate-400">Turno: {fechaEsp.turno}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {fechaEsp.tipo}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 text-xs leading-relaxed">
                            {fechaEsp.motivoJustificacion || "Sin atención en el aula de innovación pedagógica (AIP)."}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950">
                      No hay fechas especiales registradas para {getMonthName(selectedMonth)} {selectedYear}.
                    </p>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Si durante este mes hubo feriados, semanas de gestión escolar o jornadas pedagógicas donde no hubo atención en el AIP, agréguelos en el calendario para que se justifique la no asistencia del docente en el informe.
                    </p>
                  </div>
                </div>

                {onNavigateToCalendario && (
                  <button
                    type="button"
                    onClick={onNavigateToCalendario}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-2xs transition-all"
                  >
                    + Registrar en Calendario
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section: Balance General with AI Generation (Logros, Dificultades, Sugerencias) */}
          {(() => {
            let balanceCount = 1;
            if (reportData.incluirResumenAip && totalSesionesMes > 0) balanceCount++;
            if (reportData.incluirFechasEspeciales !== false && monthSpecialDates.length > 0) balanceCount++;
            balanceCount++;
            const roms = ["I", "II", "III", "IV", "V", "VI", "VII"];
            const balanceRoman = roms[balanceCount - 1] || "IV";

            const getItemCategory = (text: string) => {
              const lower = text.toLowerCase();
              if (lower.startsWith("[asistencia") || lower.includes("docente") && lower.includes("aip")) {
                return "asistencia";
              }
              if (lower.startsWith("[actividad") || lower.includes("pip") || lower.includes("soporte")) {
                return "actividad";
              }
              return "general";
            };

            const cleanTextForDisplay = (text: string) => {
              if (text.startsWith("[") && text.includes("]")) {
                const end = text.indexOf("]");
                return { tag: text.substring(0, end + 1), content: text.substring(end + 1).trim() };
              }
              return { tag: null, content: text };
            };

            return (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      {balanceRoman}. Balance General de la Experiencia en el Mes
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluación de los 3 puntos oficiales: <strong>Logros alcanzados</strong>, <strong>Dificultades</strong> y <strong>Sugerencias de mejora</strong>.
                    </p>
                  </div>

                  {/* AI Trigger Button for Balance */}
                  <button
                    type="button"
                    onClick={() => handleGenerateBalanceWithAi("todos")}
                    disabled={isGeneratingBalance}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg self-start sm:self-auto"
                  >
                    {isGeneratingBalance && (generatingBalanceTarget === "todos" || !generatingBalanceTarget) ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Evaluando los 3 Puntos con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>Evaluar los 3 Puntos con IA (2 Ejes)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Evaluation Dimensions Banner */}
                <div className="bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Evaluación integral con IA en los 3 puntos del Balance:</span>
                    </div>
                    
                    {/* Visual Filter Pills */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase font-mono">Ver:</span>
                      <button
                        type="button"
                        onClick={() => setBalanceFilter("todos")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          balanceFilter === "todos"
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setBalanceFilter("asistencia")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          balanceFilter === "asistencia"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-blue-700 hover:bg-blue-50"
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        <span>Asistencia AIP</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBalanceFilter("actividad")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          balanceFilter === "actividad"
                            ? "bg-purple-600 text-white shadow-2xs"
                            : "text-purple-700 hover:bg-purple-50"
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>Actividades PIP</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5">
                      <Users className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-black text-blue-900 uppercase text-[11px] flex items-center gap-1.5">
                          <span>Eje 1: Asistencia de Docentes y Actividades en el AIP</span>
                          <span className="bg-blue-200/70 text-blue-900 px-1.5 py-0.2 rounded font-mono text-[10px]">
                            {totalSesionesMes} sesiones
                          </span>
                        </p>
                        <p className="text-blue-800 text-[11px] leading-relaxed mt-0.5">
                          Evalúa la concurrencia regular ({Array.from(new Set(monthRecords.map((r) => r.docenteNombre))).length} docentes atendidos), puntualidad, cumplimiento de sesiones presentadas ({totalSesionesMes > 0 ? Math.round((monthRecords.filter((r) => r.presentoSesion).length / totalSesionesMes) * 100) : 0}%) y justificación de feriados/fechas sin atención.
                        </p>
                      </div>
                    </div>

                    <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 flex items-start gap-2.5">
                      <Layers className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-black text-purple-900 uppercase text-[11px] flex items-center gap-1.5">
                          <span>Eje 2: Actividades Realizadas por el PIP</span>
                          <span className="bg-purple-200/70 text-purple-900 px-1.5 py-0.2 rounded font-mono text-[10px]">
                            {reportData.actividades.length} actividades
                          </span>
                        </p>
                        <p className="text-purple-800 text-[11px] leading-relaxed mt-0.5">
                          Evalúa las actividades programadas en el plan mensual, capacitaciones colegiadas en TIC e IA, soporte técnico de computadoras/laptops XO y mantenimiento preventivo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Column 1: Logros */}
                  <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          1. Logros Alcanzados ({reportData.logros?.length || 0})
                        </h4>
                        
                        {/* Individual Column AI Button */}
                        <button
                          type="button"
                          onClick={() => handleGenerateBalanceWithAi("logros")}
                          disabled={isGeneratingBalance}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-2xs"
                          title="Evaluar y redactar solo Logros Alcanzados con IA"
                        >
                          {isGeneratingBalance && generatingBalanceTarget === "logros" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-emerald-200" />
                          )}
                          <span>IA Logros</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-emerald-100 pt-2">
                        <span className="text-[10px] text-slate-500 font-mono">Agregar:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAddBalanceItem("logros", "asistencia")}
                            className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                            title="Agregar logro de Asistencia Docente en AIP"
                          >
                            + Asistencia
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBalanceItem("logros", "actividad")}
                            className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                            title="Agregar logro de Actividad PIP"
                          >
                            + Actividad
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBalanceItem("logros")}
                            className="p-1 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 cursor-pointer"
                            title="Agregar logro general"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {(reportData.logros || [])
                        .map((logro, lIdx) => ({ logro, lIdx, cat: getItemCategory(logro) }))
                        .filter(({ cat }) => balanceFilter === "todos" || cat === balanceFilter)
                        .map(({ logro, lIdx, cat }) => {
                        const { tag, content } = cleanTextForDisplay(logro);
                        return (
                          <div key={lIdx} className="bg-white p-3 rounded-xl border border-emerald-100 text-xs space-y-1.5 shadow-2xs group">
                            <div className="flex items-center justify-between gap-2">
                              {tag ? (
                                <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider ${
                                  cat === "asistencia" 
                                    ? "bg-blue-100 text-blue-800 border border-blue-200" 
                                    : "bg-purple-100 text-purple-800 border border-purple-200"
                                }`}>
                                  {cat === "asistencia" ? "👥 Asistencia Docente" : "💻 Actividades PIP"}
                                </span>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteBalanceItem("logros", lIdx)}
                                className="text-slate-300 hover:text-red-500 p-0.5 cursor-pointer shrink-0 transition-all ml-auto"
                                title="Eliminar este punto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={logro}
                              onChange={(e) => handleUpdateBalanceItem("logros", lIdx, e.target.value)}
                              className="w-full text-slate-800 text-xs bg-slate-50/50 p-2 rounded-lg border border-slate-100 focus:bg-white focus:border-emerald-300 outline-none resize-y leading-relaxed"
                              placeholder="Redacte o modifique el logro alcanzado..."
                            />
                          </div>
                        );
                      })}
                      {(!reportData.logros || reportData.logros.length === 0) && (
                        <p className="text-xs italic text-slate-400 text-center py-4">
                          Presione "Evaluar los 3 Puntos con IA" o use los botones superiores.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Dificultades */}
                  <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-600" />
                          2. Dificultades ({reportData.dificultades?.length || 0})
                        </h4>

                        {/* Individual Column AI Button */}
                        <button
                          type="button"
                          onClick={() => handleGenerateBalanceWithAi("dificultades")}
                          disabled={isGeneratingBalance}
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-2xs"
                          title="Evaluar y redactar solo Dificultades con IA"
                        >
                          {isGeneratingBalance && generatingBalanceTarget === "dificultades" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-amber-200" />
                          )}
                          <span>IA Dificultades</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-amber-100 pt-2">
                        <span className="text-[10px] text-slate-500 font-mono">Agregar:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAddBalanceItem("dificultades", "asistencia")}
                            className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                            title="Agregar dificultad de Asistencia Docente en AIP"
                          >
                            + Asistencia
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBalanceItem("dificultades", "actividad")}
                            className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                            title="Agregar dificultad de Actividad PIP"
                          >
                            + Actividad
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBalanceItem("dificultades")}
                            className="p-1 bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 cursor-pointer"
                            title="Agregar dificultad general"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {(reportData.dificultades || [])
                        .map((dif, dIdx) => ({ dif, dIdx, cat: getItemCategory(dif) }))
                        .filter(({ cat }) => balanceFilter === "todos" || cat === balanceFilter)
                        .map(({ dif, dIdx, cat }) => {
                        const { tag } = cleanTextForDisplay(dif);
                        return (
                          <div key={dIdx} className="bg-white p-3 rounded-xl border border-amber-100 text-xs space-y-1.5 shadow-2xs group">
                            <div className="flex items-center justify-between gap-2">
                              {tag ? (
                                <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider ${
                                  cat === "asistencia" 
                                    ? "bg-blue-100 text-blue-800 border border-blue-200" 
                                    : "bg-purple-100 text-purple-800 border border-purple-200"
                                }`}>
                                  {cat === "asistencia" ? "👥 Asistencia Docente" : "💻 Actividades PIP"}
                                </span>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteBalanceItem("dificultades", dIdx)}
                                className="text-slate-300 hover:text-red-500 p-0.5 cursor-pointer shrink-0 transition-all ml-auto"
                                title="Eliminar este punto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={dif}
                              onChange={(e) => handleUpdateBalanceItem("dificultades", dIdx, e.target.value)}
                              className="w-full text-slate-800 text-xs bg-slate-50/50 p-2 rounded-lg border border-slate-100 focus:bg-white focus:border-amber-300 outline-none resize-y leading-relaxed"
                              placeholder="Redacte o modifique la dificultad encontrada..."
                            />
                          </div>
                        );
                      })}
                      {(!reportData.dificultades || reportData.dificultades.length === 0) && (
                        <p className="text-xs italic text-slate-400 text-center py-4">
                          Presione "Evaluar los 3 Puntos con IA" o use los botones superiores.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Sugerencias */}
                  <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          3. Sugerencias de Mejora ({reportData.sugerencias?.length || 0})
                        </h4>

                        {/* Individual Column AI Button */}
                        <button
                          type="button"
                          onClick={() => handleGenerateBalanceWithAi("sugerencias")}
                          disabled={isGeneratingBalance}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-2xs"
                          title="Evaluar y redactar solo Sugerencias con IA"
                        >
                          {isGeneratingBalance && generatingBalanceTarget === "sugerencias" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-blue-200" />
                          )}
                          <span>IA Sugerencias</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-blue-100 pt-2">
                        <span className="text-[10px] text-slate-500 font-mono">Agregar:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAddBalanceItem("sugerencias", "asistencia")}
                            className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                            title="Agregar sugerencia de Asistencia Docente en AIP"
                          >
                            + Asistencia
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBalanceItem("sugerencias", "actividad")}
                            className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200 rounded text-[10px] font-bold cursor-pointer transition-all"
                            title="Agregar sugerencia de Actividad PIP"
                          >
                            + Actividad
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBalanceItem("sugerencias")}
                            className="p-1 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-emerald-100 cursor-pointer"
                            title="Agregar sugerencia general"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {(reportData.sugerencias || [])
                        .map((sug, sIdx) => ({ sug, sIdx, cat: getItemCategory(sug) }))
                        .filter(({ cat }) => balanceFilter === "todos" || cat === balanceFilter)
                        .map(({ sug, sIdx, cat }) => {
                        const { tag } = cleanTextForDisplay(sug);
                        return (
                          <div key={sIdx} className="bg-white p-3 rounded-xl border border-blue-100 text-xs space-y-1.5 shadow-2xs group">
                            <div className="flex items-center justify-between gap-2">
                              {tag ? (
                                <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider ${
                                  cat === "asistencia" 
                                    ? "bg-blue-100 text-blue-800 border border-blue-200" 
                                    : "bg-purple-100 text-purple-800 border border-purple-200"
                                }`}>
                                  {cat === "asistencia" ? "👥 Asistencia Docente" : "💻 Actividades PIP"}
                                </span>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteBalanceItem("sugerencias", sIdx)}
                                className="text-slate-300 hover:text-red-500 p-0.5 cursor-pointer shrink-0 transition-all ml-auto"
                                title="Eliminar este punto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={sug}
                              onChange={(e) => handleUpdateBalanceItem("sugerencias", sIdx, e.target.value)}
                              className="w-full text-slate-800 text-xs bg-slate-50/50 p-2 rounded-lg border border-slate-100 focus:bg-white focus:border-blue-300 outline-none resize-y leading-relaxed"
                              placeholder="Redacte o modifique la sugerencia de mejora..."
                            />
                          </div>
                        );
                      })}
                      {(!reportData.sugerencias || reportData.sugerencias.length === 0) && (
                        <p className="text-xs italic text-slate-400 text-center py-4">
                          Presione "Redactar Balance con IA" o haga clic en los botones para agregar una sugerencia.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* Section: Live A4 Document Preview (Formatted like formal paper) */
        <div className="bg-slate-200/70 p-4 sm:p-8 rounded-3xl flex justify-center overflow-x-auto shadow-inner">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-8 sm:p-12 text-slate-900 text-xs font-sans min-w-[720px] space-y-6 border border-slate-200">
            
            {/* Paper Institutional Header with Crest */}
            <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-800">
              <div className="w-16 h-20 shrink-0 p-1 flex items-center justify-center">
                <img 
                  src={SCHOOL_LOGO_PATH} 
                  alt="Insignia Oficial 24009" 
                  className="max-h-full max-w-full object-contain filter drop-shadow-xs" 
                />
              </div>
              <div className="flex-1 text-center space-y-1">
                <p className="text-[10px] uppercase italic font-serif text-slate-500 tracking-wider">
                  “Año del Bicentenario, de la consolidación de nuestra Independencia, y de la conmemoración de las heroicas batallas de Junín y Ayacucho”
                </p>
                <h1 className="text-base sm:text-lg font-black text-[#0B1E36] tracking-tight">
                  INSTITUCIÓN EDUCATIVA PRIMARIA DE MENORES N° 24009 “TÚPAC AMARU II”
                </h1>
                <p className="text-xs font-black text-[#D92323] uppercase tracking-widest font-mono">
                  AULA DE INNOVACIÓN PEDAGÓGICA (AIP) • PUQUIO, LUCANAS, AYACUCHO
                </p>
              </div>
              <div className="w-16 h-20 shrink-0 hidden sm:flex items-center justify-center p-1 opacity-0 pointer-events-none">
                {/* Spacer for symmetry */}
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-2">
              <h2 className="text-sm sm:text-base font-black uppercase underline decoration-2 underline-offset-4 tracking-wide text-slate-900">
                {reportData.numeroInforme}
              </h2>
            </div>

            {/* Document Memorandum Header Table */}
            <div className="border border-slate-300 text-xs divide-y divide-slate-300">
              <div className="grid grid-cols-4 p-2">
                <span className="font-black text-slate-900 col-span-1">A</span>
                <span className="col-span-3 text-slate-800">
                  : <strong>{reportData.directorNombre.toUpperCase()}</strong>
                  <br />
                  <span className="text-[11px] text-slate-600 italic font-medium">{reportData.directorCargo}</span>
                </span>
              </div>

              <div className="grid grid-cols-4 p-2">
                <span className="font-black text-slate-900 col-span-1">DE</span>
                <span className="col-span-3 text-slate-800">
                  : <strong>{reportData.remitenteNombre.toUpperCase()}</strong>
                  <br />
                  <span className="text-[11px] text-slate-600 italic font-medium">{reportData.remitenteCargo}</span>
                </span>
              </div>

              <div className="grid grid-cols-4 p-2">
                <span className="font-black text-slate-900 col-span-1">ASUNTO</span>
                <span className="col-span-3 font-bold text-slate-800">: {reportData.asunto}</span>
              </div>

              <div className="grid grid-cols-4 p-2">
                <span className="font-black text-slate-900 col-span-1">REFERENCIA</span>
                <span className="col-span-3 text-slate-700">: {reportData.referencia}</span>
              </div>

              <div className="grid grid-cols-4 p-2">
                <span className="font-black text-slate-900 col-span-1">FECHA</span>
                <span className="col-span-3 text-slate-800">: {reportData.lugar}, {reportData.fechaTexto}</span>
              </div>
            </div>

            {/* Greeting paragraph */}
            <p className="text-xs leading-relaxed text-justify text-slate-800 pt-2 indent-8">
              {reportData.introduccion}
            </p>

            {/* Section I Table */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-black uppercase text-[#0B1E36] tracking-wider">
                I. DESCRIPCIÓN DE LAS ACTIVIDADES REALIZADAS
              </h3>

              <div className="border border-slate-400 rounded overflow-hidden text-[11px]">
                <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-400 font-black text-slate-800 divide-x divide-slate-400 text-center py-2">
                  <div className="col-span-4 uppercase">Actividad N° y Objetivo</div>
                  <div className="col-span-8 uppercase">Descripción de las Acciones Realizadas</div>
                </div>

                <div className="divide-y divide-slate-300">
                  {reportData.actividades.map((act) => (
                    <div key={act.id} className="grid grid-cols-12 divide-x divide-slate-300">
                      {/* Left Cell */}
                      <div className="col-span-4 p-3 bg-slate-50/40 space-y-2">
                        <p className="font-black text-slate-900 leading-snug">
                          <span className="text-[#D92323]">Actividad {String(act.numero).padStart(2, "0")}: </span>
                          {act.titulo}
                        </p>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          <strong className="text-slate-800">Objetivo: </strong>
                          {act.objetivo || "Por definir"}
                        </p>
                        {act.metasBeneficiarios && (
                          <p className="text-[9.5px] text-slate-500">
                            <strong>Beneficiarios: </strong>
                            {act.metasBeneficiarios}
                          </p>
                        )}
                        {act.mediosVerificacion && (
                          <p className="text-[9.5px] text-slate-500">
                            <strong>Evidencias: </strong>
                            {act.mediosVerificacion}
                          </p>
                        )}
                      </div>

                      {/* Right Cell */}
                      <div className="col-span-8 p-3 space-y-2 bg-white">
                        {act.descripcionTexto && act.descripcionTexto.trim().length > 0 ? (
                          act.descripcionTexto.split("\n").filter(l => l.trim().length > 0).map((line, lIdx) => (
                            <div key={lIdx} className="flex items-start gap-2 text-justify">
                              <span className="text-slate-400 font-bold mt-0.5">•</span>
                              <p className="text-[11px] leading-relaxed text-slate-800">
                                {line.replace(/^[-•*]\s*/, "")}
                              </p>
                            </div>
                          ))
                        ) : act.tareas && act.tareas.length > 0 ? (
                          act.tareas.map((task) => (
                            <div key={task.id} className="flex items-start gap-2 text-justify">
                              <span className="text-slate-400 font-bold mt-0.5">•</span>
                              <p className="text-[11px] leading-relaxed text-slate-800">
                                <strong className="text-slate-900">{task.subtitulo}: </strong>
                                {task.detalle}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="italic text-slate-400">Sin descripción de acciones registradas aún.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic section numbering helper calculation for preview */}
            {(() => {
              let secCount = 1;
              const toRomanPreview = (n: number) => {
                const roms = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                return roms[n - 1] || String(n);
              };

              const aipSectionTitle = reportData.incluirResumenAip && totalSesionesMes > 0
                ? `${toRomanPreview(++secCount)}. CUADRO ESTADÍSTICO DE ASISTENCIA AL AULA DE INNOVACIÓN (AIP)`
                : null;

              const specialDatesSectionTitle = reportData.incluirFechasEspeciales !== false && monthSpecialDates.length > 0
                ? `${toRomanPreview(++secCount)}. JUSTIFICACIÓN DE FECHAS SIN ATENCIÓN EN EL AIP (FERIADOS Y DÍAS DE GESTIÓN)`
                : null;

              const balanceSectionTitle = `${toRomanPreview(++secCount)}. BALANCE GENERAL DE LA EXPERIENCIA EN EL MES`;

              return (
                <>
                  {/* Optional AIP Table */}
                  {aipSectionTitle && (
                    <div className="space-y-2 pt-3">
                      <h3 className="text-xs font-black uppercase text-[#0B1E36] tracking-wider">
                        {aipSectionTitle}
                      </h3>

                      <div className="border border-slate-400 rounded overflow-hidden text-[11px]">
                        <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-400 font-black text-slate-800 divide-x divide-slate-400 text-center py-1.5">
                          <div className="col-span-5">Indicador de Gestión AIP</div>
                          <div className="col-span-3">Valor del Mes</div>
                          <div className="col-span-4">Detalle / Evidencia</div>
                        </div>

                        <div className="divide-y divide-slate-300 text-xs">
                          <div className="grid grid-cols-12 divide-x divide-slate-300 p-2">
                            <div className="col-span-5 font-medium">Sesiones de Aprendizaje Desarrolladas</div>
                            <div className="col-span-3 font-bold text-center">{totalSesionesMes} sesiones</div>
                            <div className="col-span-4 text-slate-600 text-[10px]">Libro Diario Oficial Anexo 1</div>
                          </div>

                          <div className="grid grid-cols-12 divide-x divide-slate-300 p-2">
                            <div className="col-span-5 font-medium">Estudiantes Beneficiados</div>
                            <div className="col-span-3 font-bold text-center">
                              {monthRecords.reduce((s, r) => s + (r.estudiantesAsistentes || 0), 0)} alumnos
                            </div>
                            <div className="col-span-4 text-slate-600 text-[10px]">Primaria de menores</div>
                          </div>

                          <div className="grid grid-cols-12 divide-x divide-slate-300 p-2">
                            <div className="col-span-5 font-medium">Docentes de Aula Participantes</div>
                            <div className="col-span-3 font-bold text-center">
                              {Array.from(new Set(monthRecords.map((r) => r.docenteNombre))).length} docentes
                            </div>
                            <div className="col-span-4 text-slate-600 text-[10px]">Acompañamiento en sesión</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Optional Special Dates / Absences Justification Table */}
                  {specialDatesSectionTitle && (
                    <div className="space-y-2 pt-3">
                      <h3 className="text-xs font-black uppercase text-[#0B1E36] tracking-wider">
                        {specialDatesSectionTitle}
                      </h3>

                      <div className="border border-slate-400 rounded overflow-hidden text-[11px]">
                        <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-400 font-black text-slate-800 divide-x divide-slate-400 text-center py-1.5">
                          <div className="col-span-1">N°</div>
                          <div className="col-span-2">FECHA</div>
                          <div className="col-span-4">DENOMINACIÓN / MOTIVO</div>
                          <div className="col-span-5">JUSTIFICACIÓN OFICIAL DE NO ASISTENCIA AL AIP</div>
                        </div>

                        <div className="divide-y divide-slate-300 text-xs">
                          {monthSpecialDates.map((fechaEsp, fIdx) => (
                            <div key={fechaEsp.id || fIdx} className="grid grid-cols-12 divide-x divide-slate-300 p-2">
                              <div className="col-span-1 font-mono font-bold text-center">{fIdx + 1}</div>
                              <div className="col-span-2 font-mono font-bold text-center text-slate-900">
                                {fechaEsp.fechaFin && fechaEsp.fechaFin !== fechaEsp.fecha
                                  ? `${fechaEsp.fecha} al ${fechaEsp.fechaFin}`
                                  : fechaEsp.fecha}
                                {fechaEsp.fechaFin && fechaEsp.fechaFin !== fechaEsp.fecha && (
                                  <span className="block text-[9px] text-amber-700 font-sans font-bold">
                                    ({fechaEsp.diasRango ? `${fechaEsp.diasRango}d` : "periodo"})
                                  </span>
                                )}
                              </div>
                              <div className="col-span-4 pl-2">
                                <span className="font-bold text-slate-900 block">{fechaEsp.titulo}</span>
                                <span className="text-[10px] text-slate-500 italic">Tipo: {fechaEsp.tipo}</span>
                              </div>
                              <div className="col-span-5 pl-2 text-slate-700 text-[10.5px] leading-relaxed">
                                {fechaEsp.motivoJustificacion || "Sin atención en el aula de innovación pedagógica (AIP)."}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Balance General Table */}
                  <div className="space-y-2 pt-3">
                    <h3 className="text-xs font-black uppercase text-[#0B1E36] tracking-wider">
                      {balanceSectionTitle}
                    </h3>

                    <div className="border border-slate-400 rounded overflow-hidden text-[11px]">
                      <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-400 font-black text-slate-800 divide-x divide-slate-400 text-center py-1.5">
                        <div>LOGROS ALCANZADOS</div>
                        <div>DIFICULTADES</div>
                        <div>SUGERENCIAS DE MEJORA</div>
                      </div>

                      <div className="grid grid-cols-3 divide-x divide-slate-300 p-3 gap-3 bg-white text-[10.5px]">
                        {(() => {
                          const renderBalanceItemPreview = (text: string) => {
                            if (text.startsWith("[") && text.includes("]")) {
                              const end = text.indexOf("]");
                              const tag = text.substring(0, end + 1);
                              const rest = text.substring(end + 1).trim();
                              const isAsistencia = tag.toLowerCase().includes("asistencia") || tag.toLowerCase().includes("docente");
                              return (
                                <span className="leading-relaxed">
                                  <strong className={isAsistencia ? "text-blue-900 font-bold" : "text-purple-900 font-bold"}>
                                    {tag}
                                  </strong>{" "}
                                  <span>{rest}</span>
                                </span>
                              );
                            }
                            return <span className="leading-relaxed">{text}</span>;
                          };

                          return (
                            <>
                              <div className="space-y-2">
                                {(reportData.logros || []).map((l, i) => (
                                  <p key={i} className="flex items-start gap-1.5 text-justify">
                                    <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                                    {renderBalanceItemPreview(l)}
                                  </p>
                                ))}
                                {(!reportData.logros || reportData.logros.length === 0) && (
                                  <p className="italic text-slate-400">Sin observaciones.</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                {(reportData.dificultades || []).map((d, i) => (
                                  <p key={i} className="flex items-start gap-1.5 text-justify">
                                    <span className="text-amber-600 font-bold shrink-0 mt-0.5">•</span>
                                    {renderBalanceItemPreview(d)}
                                  </p>
                                ))}
                                {(!reportData.dificultades || reportData.dificultades.length === 0) && (
                                  <p className="italic text-slate-400">Ninguna dificultad mayor.</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                {(reportData.sugerencias || []).map((s, i) => (
                                  <p key={i} className="flex items-start gap-1.5 text-justify">
                                    <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                                    {renderBalanceItemPreview(s)}
                                  </p>
                                ))}
                                {(!reportData.sugerencias || reportData.sugerencias.length === 0) && (
                                  <p className="italic text-slate-400">Continuar con el trabajo coordinado.</p>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Document Signature Footnote */}
            <div className="pt-14 flex justify-end">
              <div className="text-center w-64 border-t border-slate-800 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900 text-[11px]">{reportData.remitenteNombre.toUpperCase()}</p>
                <p className="text-[10px] text-slate-600">{reportData.remitenteCargo}</p>
                <p className="text-[9px] text-slate-500">I.E.P.M. N° 24009 “Túpac Amaru II” - Puquio</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
