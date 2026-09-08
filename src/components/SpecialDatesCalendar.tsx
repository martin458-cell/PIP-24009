import React, { useState, useMemo } from "react";
import { 
  FechaEspecial, 
  TipoFechaEspecial, 
  RegistroAip,
  Docente 
} from "../types";
import { 
  INITIAL_FECHAS_ESPECIALES, 
  TIPOS_FECHA_ESPECIAL_CONFIG 
} from "../initialSpecialDates";
import {
  Calendar as CalendarIcon,
  CalendarCheck,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Download,
  Info,
  CalendarDays,
  List,
  Grid,
  Laptop
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { SCHOOL_LOGO_PNG_BASE64 } from "../assets/schoolLogo";
import {
  isDateInRange,
  isSpecialDateActiveOnDate,
  doesSpecialDateOverlapMonth,
  calculatePeriodDays,
  formatPeriodoDisplay
} from "../utils/dateRangeUtils";

interface SpecialDatesCalendarProps {
  fechasEspeciales: FechaEspecial[];
  onAddFecha: (fecha: FechaEspecial) => Promise<void> | void;
  onUpdateFecha: (fecha: FechaEspecial) => Promise<void> | void;
  onDeleteFecha: (id: string) => Promise<void> | void;
  onResetToDefaults?: () => Promise<void> | void;
  registrosAip: RegistroAip[];
  docentes: Docente[];
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"
];

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const PRESET_MOTIVOS = [
  { 
    titulo: "Semana de Gestión Escolar", 
    tipo: "Semana de Gestión" as TipoFechaEspecial, 
    just: "Desarrollo de jornadas colegiadas de gestión institucional, balance curricular y planificación institucional dispuesta por el MINEDU, sin concurrencia presencial de estudiantes al AIP.",
    esRango: true,
    diasDefecto: 5
  },
  { 
    titulo: "Vacaciones Escolares de Medio Año", 
    tipo: "Vacaciones" as TipoFechaEspecial, 
    just: "Periodo oficial de vacaciones escolares intermedias para estudiantes según la calendarización oficial del MINEDU. No hay sesiones presenciales en el Aula de Innovación Pedagógica (AIP).",
    esRango: true,
    diasDefecto: 12
  },
  { 
    titulo: "Feriado Nacional Calendario", 
    tipo: "Feriado Calendario" as TipoFechaEspecial, 
    just: "Feriado nacional no laborable según Decreto Legislativo N° 713. Justifica la no asistencia de docentes y estudiantes al AIP.",
    esRango: false,
    diasDefecto: 1
  },
  { 
    titulo: "Mantenimiento Técnico Preventivo del AIP", 
    tipo: "Mantenimiento AIP" as TipoFechaEspecial, 
    just: "Labores técnicas exclusivas de optimización, mantenimiento de equipos informáticos, XO, tabletas y configuración de red sin atención pedagógica en sala.",
    esRango: true,
    diasDefecto: 3
  },
  { 
    titulo: "Jornada Pedagógica y Trabajo Colegiado", 
    tipo: "Jornada Pedagógica" as TipoFechaEspecial, 
    just: "Reunión colegiada y capacitación interna de docentes. Las sesiones en el Aula de Innovación quedan reprogramadas.",
    esRango: false,
    diasDefecto: 1
  },
  { 
    titulo: "Suspensión de Labores por Disposición Oficial", 
    tipo: "Suspensión de Labores" as TipoFechaEspecial, 
    just: "Suspensión oficial de actividades lectivas por disposición de la superioridad (DRE Ayacucho / UGEL Lucanas) por contingencia o fuerza mayor.",
    esRango: true,
    diasDefecto: 2
  },
  { 
    titulo: "Aniversario Institucional I.E.P.M. N° 24009", 
    tipo: "Actividad Institucional" as TipoFechaEspecial, 
    just: "Celebración del Aniversario Institucional de nuestra casa de estudios con participación de la comunidad educativa en pleno.",
    esRango: false,
    diasDefecto: 1
  },
  { 
    titulo: "Capacitación Docente en TIC / AIP", 
    tipo: "Capacitación Docente" as TipoFechaEspecial, 
    just: "Capacitación y fortalecimiento de competencias digitales e inteligencia artificial educativa a la plana docente en el AIP.",
    esRango: false,
    diasDefecto: 1
  }
];

export default function SpecialDatesCalendar({
  fechasEspeciales,
  onAddFecha,
  onUpdateFecha,
  onDeleteFecha,
  onResetToDefaults,
  registrosAip,
  docentes
}: SpecialDatesCalendarProps) {
  // Current view year & month state
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(4); // Default to Mayo (index 4)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("TODOS");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFecha, setEditingFecha] = useState<FechaEspecial | null>(null);

  // Form state (supports single day or multi-day period range)
  const [formEsRango, setFormEsRango] = useState(false);
  const [formFechaInicio, setFormFechaInicio] = useState("");
  const [formFechaFin, setFormFechaFin] = useState("");
  const [formTitulo, setFormTitulo] = useState("");
  const [formTipo, setFormTipo] = useState<TipoFechaEspecial>("Semana de Gestión");
  const [formSinAip, setFormSinAip] = useState(true);
  const [formJustificacion, setFormJustificacion] = useState("");
  const [formTurno, setFormTurno] = useState<"ambos" | "mañana" | "tarde">("ambos");
  const [formDocentes, setFormDocentes] = useState("Todos los docentes");

  // Calculated duration of active form dates
  const periodoCalculado = useMemo(() => {
    if (!formEsRango) return null;
    return calculatePeriodDays(formFechaInicio, formFechaFin);
  }, [formEsRango, formFechaInicio, formFechaFin]);

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Open modal to create or edit (supports opening as single day or multi-day period)
  const handleOpenNew = (defaultDate?: string, asRange?: boolean, defaultType?: TipoFechaEspecial) => {
    const todayStr = defaultDate || `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
    setEditingFecha(null);
    setFormEsRango(Boolean(asRange));
    setFormFechaInicio(todayStr);
    
    // If asRange is true, calculate a sensible 5-day default period (e.g. 5 days for Semana de Gestión)
    if (asRange) {
      const [y, m, d] = todayStr.split("-").map(Number);
      const endD = new Date(y, m - 1, d + 4);
      const endYear = endD.getFullYear();
      const endMonth = String(endD.getMonth() + 1).padStart(2, "0");
      const endDay = String(endD.getDate()).padStart(2, "0");
      setFormFechaFin(`${endYear}-${endMonth}-${endDay}`);
    } else {
      setFormFechaFin(todayStr);
    }

    setFormTitulo("");
    setFormTipo(defaultType || (asRange ? "Semana de Gestión" : "Feriado Calendario"));
    setFormSinAip(true);
    setFormJustificacion(
      asRange
        ? "Periodo oficial dispuesto por el MINEDU / DRE Ayacucho. Durante estas fechas no se desarrollan sesiones pedagógicas presenciales en el Aula de Innovación Pedagógica (AIP)."
        : "Feriado nacional o actividad oficial que justifica la no asistencia de docentes y estudiantes al Aula de Innovación Pedagógica (AIP) según normativa vigente."
    );
    setFormTurno("ambos");
    setFormDocentes("Todos los docentes");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: FechaEspecial) => {
    setEditingFecha(f);
    const hasRange = Boolean(f.esRango || (f.fechaFin && f.fechaFin !== f.fecha));
    setFormEsRango(hasRange);
    setFormFechaInicio(f.fecha);
    setFormFechaFin(f.fechaFin || f.fecha);
    setFormTitulo(f.titulo);
    setFormTipo(f.tipo);
    setFormSinAip(f.sinActividadAip);
    setFormJustificacion(f.motivoJustificacion);
    setFormTurno(f.turno || "ambos");
    setFormDocentes(f.docentesAfectados || "Todos los docentes");
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: typeof PRESET_MOTIVOS[0]) => {
    setFormTitulo(preset.titulo);
    setFormTipo(preset.tipo);
    setFormJustificacion(preset.just);
    if (preset.esRango) {
      setFormEsRango(true);
      if (preset.diasDefecto && formFechaInicio) {
        const [y, m, d] = formFechaInicio.split("-").map(Number);
        const endDate = new Date(y, m - 1, d + (preset.diasDefecto - 1));
        const endYear = endDate.getFullYear();
        const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
        const endDay = String(endDate.getDate()).padStart(2, "0");
        setFormFechaFin(`${endYear}-${endMonth}-${endDay}`);
      }
    } else {
      setFormEsRango(false);
      setFormFechaFin(formFechaInicio);
    }
  };

  const handleAutoGenerateJustification = () => {
    let generated = "";
    if (formTipo === "Feriado Calendario") {
      generated = `Feriado oficial según calendario cívico nacional. Justifica de manera plena y formal la no concurrencia y no asistencia de los docentes al Aula de Innovación Pedagógica (AIP).`;
    } else if (formTipo === "Semana de Gestión") {
      generated = `Desarrollo de jornadas colegiadas de la Semana de Gestión Escolar dispuestas por la R.M. N° 587-MINEDU. La plana docente realiza balance curricular, planificación y trabajo colegiado institucional sin atención presencial de estudiantes en el AIP.`;
    } else if (formTipo === "Vacaciones") {
      generated = `Periodo oficial de vacaciones escolares según la Calendarización del Año Escolar emitida por el MINEDU. Durante este lapso no se brinda atención presencial en el Aula de Innovación Pedagógica (AIP), justificando plenamente la no asistencia de los docentes.`;
    } else if (formTipo === "Jornada Pedagógica") {
      generated = `Jornada institucional de trabajo colegiado y actualización curricular con la plana docente. La atención regular en el AIP queda debidamente justificada y reprogramada.`;
    } else if (formTipo === "Actividad Institucional") {
      generated = `Desarrollo de actividad oficial programada en el Plan Anual de Trabajo (PAT) de la I.E.P.M. N° 24009 "Túpac Amaru II", justificando la no utilización del AIP en dicha fecha o periodo.`;
    } else if (formTipo === "Mantenimiento AIP") {
      generated = `Jornada técnica de mantenimiento preventivo y correctivo, desinfección y actualización de software en el aula tecnológica. Justifica la no admisión de sesiones pedagógicas.`;
    } else if (formTipo === "Suspensión de Labores") {
      generated = `Suspensión oficial de actividades pedagógicas y labores escolares dispuesta por la superioridad (DRE Ayacucho / UGEL Lucanas) por contingencia o fuerza mayor.`;
    } else if (formTipo === "Capacitación Docente") {
      generated = `Taller institucional de capacitación pedagógica para docentes en competencias digitales e inteligencia artificial educativa en el AIP.`;
    } else {
      generated = `Actividad oficial institucional debidamente autorizada por la Dirección. Justifica la no asistencia docente al Aula de Innovación Pedagógica en la presente fecha o periodo.`;
    }
    setFormJustificacion(generated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFechaInicio || !formTitulo.trim()) {
      showToast("Por favor complete la fecha de inicio y el título o motivo.");
      return;
    }

    const effectiveEnd = formEsRango && formFechaFin ? formFechaFin : formFechaInicio;

    if (formEsRango && effectiveEnd < formFechaInicio) {
      showToast("La fecha de finalización no puede ser anterior a la fecha de inicio.");
      return;
    }

    const { totalDias } = calculatePeriodDays(formFechaInicio, effectiveEnd);

    const payload: FechaEspecial = {
      id: editingFecha ? editingFecha.id : `fe-${formFechaInicio}-${Date.now().toString(36)}`,
      fecha: formFechaInicio,
      fechaFin: effectiveEnd !== formFechaInicio ? effectiveEnd : undefined,
      esRango: formEsRango && effectiveEnd !== formFechaInicio,
      diasRango: totalDias > 1 ? totalDias : 1,
      titulo: formTitulo.trim(),
      tipo: formTipo,
      sinActividadAip: formSinAip,
      motivoJustificacion: formJustificacion.trim() || "Justifica la no asistencia al AIP por actividad o feriado oficial.",
      activo: true,
      turno: formTurno,
      docentesAfectados: formDocentes,
      createdAt: editingFecha?.createdAt || new Date().toISOString()
    };

    if (editingFecha) {
      await onUpdateFecha(payload);
      showToast("Registro actualizado con éxito.");
    } else {
      await onAddFecha(payload);
      showToast(
        formEsRango && totalDias > 1
          ? `Periodo de ${totalDias} días registrado exitosamente (evitando registros repetitivos).`
          : "Fecha especial registrada exitosamente."
      );
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Está seguro de eliminar esta fecha especial del calendario?")) {
      await onDeleteFecha(id);
      showToast("Fecha especial eliminada.");
    }
  };

  // Calendar calculations for the current month grid
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // Day of week for 1st day (0 = Sunday, 1 = Monday, etc.)
    // We want 0 = Monday, 6 = Sunday
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      fechas: FechaEspecial[];
      sesionesAip: RegistroAip[];
      isWeekend: boolean;
    }> = [];

    // Preceding empty slots from prev month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        fechas: [],
        sesionesAip: [],
        isWeekend: false
      });
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayDate = new Date(currentYear, currentMonth, d);
      const dayOfWeek = dayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Check if any special date is active on this day (supports single dates and ranges)
      const matchingFechas = fechasEspeciales.filter((f) => f.activo && isSpecialDateActiveOnDate(dateStr, f));
      const matchingSesiones = registrosAip.filter((r) => r.fecha === dateStr);

      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        fechas: matchingFechas,
        sesionesAip: matchingSesiones,
        isWeekend
      });
    }

    // Trailing empty slots to fill complete weeks (multiples of 7)
    const remainingSlots = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: false,
        fechas: [],
        sesionesAip: [],
        isWeekend: false
      });
    }

    return days;
  }, [currentYear, currentMonth, fechasEspeciales, registrosAip]);

  // Special dates for current month (supports dates or ranges that overlap this month)
  const monthSpecialDates = useMemo(() => {
    return fechasEspeciales
      .filter((f) => f.activo && doesSpecialDateOverlapMonth(f, currentYear, currentMonth))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [currentYear, currentMonth, fechasEspeciales]);

  // Statistics for the month
  const monthStats = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let weekdaysCount = 0;
    let weekdaysWithoutAipCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(currentYear, currentMonth, d);
      const dayOfWeek = dayDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        weekdaysCount++;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const hasSpecialNoAip = monthSpecialDates.some(
          (f) => f.sinActividadAip && isSpecialDateActiveOnDate(dateStr, f)
        );
        if (hasSpecialNoAip) {
          weekdaysWithoutAipCount++;
        }
      }
    }

    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const sessionsThisMonth = registrosAip.filter((r) => r.fecha.startsWith(monthPrefix)).length;

    return {
      diasLectivos: weekdaysCount,
      diasSinAipJustificados: weekdaysWithoutAipCount,
      sesionesEjecutadas: sessionsThisMonth,
      porcentajeJustificado: weekdaysCount > 0 ? Math.round((weekdaysWithoutAipCount / weekdaysCount) * 100) : 0
    };
  }, [currentYear, currentMonth, monthSpecialDates, registrosAip]);

  // Filtered list view dates
  const filteredDatesList = useMemo(() => {
    return fechasEspeciales
      .filter((f) => {
        const matchesSearch =
          f.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.motivoJustificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.fecha.includes(searchTerm) ||
          (f.fechaFin && f.fechaFin.includes(searchTerm));

        const matchesType =
          selectedTypeFilter === "TODOS" || f.tipo === selectedTypeFilter;

        return matchesSearch && matchesType;
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [fechasEspeciales, searchTerm, selectedTypeFilter]);

  // Export calendar to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Top Institutional Banner
    doc.setFillColor(11, 30, 54); // #0B1E36
    doc.rect(0, 0, 210, 26, "F");

    // Institutional red line
    doc.setFillColor(217, 35, 35);
    doc.rect(0, 26, 210, 1.5, "F");

    // Add School Crest
    try {
      doc.addImage(SCHOOL_LOGO_PNG_BASE64, "PNG", 12, 3.5, 17, 20);
    } catch (err) {
      console.warn("Logo no añadido a PDF de fechas especiales:", err);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.text("I.E.P.M. N° 24009 'TÚPAC AMARU II' - PUQUIO, LUCANAS", 116, 10.5, { align: "center" });

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.text(`CRONOGRAMA OFICIAL DE FECHAS ESPECIALES Y JUSTIFICACIONES AIP - AÑO ${currentYear}`, 116, 16.5, { align: "center" });

    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text("SISTEMA DE GESTIÓN PEDAGÓGICA • JUSTIFICACIONES DE ASISTENCIA MINEDU / PAT", 116, 22, { align: "center" });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.text(`Documento de sustento institucional para la justificación de no concurrencia pedagógica en el Aula de Innovación`, 14, 33);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString("es-PE")} | Total registros en cronograma: ${fechasEspeciales.length}`, 14, 38);

    const tableRows = fechasEspeciales.map((f, idx) => [
      String(idx + 1),
      f.fechaFin && f.fechaFin !== f.fecha
        ? `${f.fecha} al ${f.fechaFin} (${f.diasRango || ''}d)`
        : f.fecha,
      f.titulo,
      f.tipo,
      f.sinActividadAip ? "SÍ (Justificado)" : "NO",
      f.motivoJustificacion
    ]);

    autoTable(doc, {
      startY: 43,
      head: [["N°", "FECHA / PERIODO", "DENOMINACIÓN / MOTIVO", "TIPO", "SIN AIP", "JUSTIFICACIÓN OFICIAL MINEDU / PAT"]],
      body: tableRows,
      theme: "grid",
      headStyles: {
        fillColor: [217, 35, 35],
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold",
        halign: "center"
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        valign: "middle"
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 26, halign: "center", fontStyle: "bold" },
        2: { cellWidth: 40 },
        3: { cellWidth: 24 },
        4: { cellWidth: 16, halign: "center" },
        5: { cellWidth: 72 }
      }
    });

    doc.save(`Fechas_Especiales_AIP_${currentYear}_IEPM24009.pdf`);
    showToast("Documento PDF de justificaciones exportado correctamente.");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Header Banner - Institucional Renovado */}
      <div className="bg-gradient-to-br from-[#0B1E36] via-[#102540] to-[#1a385f] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/80">
        {/* Glow & subtle ambient shapes */}
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-48 h-48 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Left: Badge & Quick Status Indicators */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-black tracking-wider uppercase shadow-xs">
                <CalendarCheck className="w-4 h-4 text-amber-300" />
                <span>Control Institucional AIP • Justificaciones Oficiales</span>
              </div>
              <span className="text-xs text-slate-300 font-mono bg-white/10 px-2.5 py-1 rounded-full border border-white/10 font-bold">
                Año {currentYear}
              </span>
            </div>

            {/* Indicadores rápidos de calendario */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/10 font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Total registros: <strong className="text-white font-bold">{fechasEspeciales.length}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-200 border border-red-500/30 font-mono">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Sin atención AIP: <strong className="text-white font-bold">{fechasEspeciales.filter(f => f.sinActividadAip).length}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-500/30 font-mono">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Periodos (varios días): <strong className="text-white font-bold">{fechasEspeciales.filter(f => f.fechaFin && f.fechaFin !== f.fecha).length}</strong>
              </span>
            </div>
          </div>

          {/* Right: Reordered & Adjusted Professional Action Buttons */}
          <div className="flex flex-col sm:flex-row xl:flex-col items-stretch gap-2.5 shrink-0">
            {/* Primary Action Row: Main Creation Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenNew(undefined, false)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D92323] hover:bg-[#b51c1c] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-950/40 hover:scale-[1.02] active:scale-95 border border-red-400/40"
                title="Registrar una fecha especial individual (Feriado, Aniversario, etc.)"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Fecha Especial</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenNew(undefined, true, "Semana de Gestión")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-purple-950/40 hover:scale-[1.02] active:scale-95 border border-purple-400/30"
                title="Registrar un rango de varios días (Semana de Gestión, Vacaciones, etc.) sin repetir registros"
              >
                <CalendarDays className="w-4 h-4 text-purple-200" />
                <span>+ Registrar Periodo (Varios Días)</span>
              </button>
            </div>

            {/* Secondary Action Row: Export & Utilities */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/20 hover:border-cyan-400/60 shadow-sm group"
                title="Descargar cronograma oficial completo en PDF con escudo institucional"
              >
                <Printer className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                <span>Exportar PDF</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 font-mono font-bold ml-0.5">
                  OFICIAL
                </span>
              </button>

              {onResetToDefaults && (
                <button
                  type="button"
                  onClick={onResetToDefaults}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer border border-white/10"
                  title="Restablecer fechas estándar 2026 de MINEDU y Perú"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Restablecer 2026</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Month & Year Bar + View Mode Toggle */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black text-slate-800 uppercase tracking-wider min-w-[130px] text-center">
              {MESES[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              {MESES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        {/* View Switcher: Grid vs List */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-amber-600" />
              <span>Cuadrícula Mensual</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5 text-blue-600" />
              <span>Listado de Justificaciones ({fechasEspeciales.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Month Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">Días Hábiles</p>
            <CalendarDays className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-1 font-mono">{monthStats.diasLectivos}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Días de lunes a viernes en el mes</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-800 font-mono">Sin AIP (Justificados)</p>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-amber-950 mt-1 font-mono">{monthStats.diasSinAipJustificados}</p>
          <p className="text-[10px] text-amber-700 mt-0.5">Justifican inasistencia docente</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">Sesiones Realizadas</p>
            <Laptop className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-1 font-mono">{monthStats.sesionesEjecutadas}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Registros en el Libro Diario AIP</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">Total Registros Anual</p>
            <CalendarCheck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-1 font-mono">{fechasEspeciales.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Fechas especiales en el sistema</p>
        </div>
      </div>

      {/* Main View: Grid or List */}
      {viewMode === "grid" ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          {/* Instructions banner */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Haga clic en <strong>cualquier día del calendario</strong> para agregar o editar una fecha especial y registrar el sustento de justificación para la no asistencia docente.
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono shrink-0 hidden sm:flex">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Feriados
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Gestión
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Institucional
              </span>
            </div>
          </div>

          {/* Calendar Grid Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            {/* Days of week header */}
            <div className="grid grid-cols-7 bg-slate-100 text-center border-b border-slate-200 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700">
              {DIAS_SEMANA.map((dia, idx) => (
                <div key={dia} className={idx >= 5 ? "text-slate-400" : ""}>
                  {dia}
                </div>
              ))}
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-slate-100">
              {calendarDays.map((item, idx) => {
                const hasSpecialDates = item.fechas.length > 0;
                const hasAipSessions = item.sesionesAip.length > 0;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (item.isCurrentMonth) {
                        if (hasSpecialDates) {
                          handleOpenEdit(item.fechas[0]);
                        } else {
                          handleOpenNew(item.dateStr);
                        }
                      }
                    }}
                    className={`min-h-[105px] p-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                      !item.isCurrentMonth
                        ? "bg-slate-50/50 text-slate-300 opacity-60 pointer-events-none"
                        : item.isWeekend
                        ? "bg-slate-50/70 hover:bg-amber-50/40"
                        : hasSpecialDates
                        ? "bg-amber-50/40 hover:bg-amber-100/50"
                        : "bg-white hover:bg-blue-50/40"
                    }`}
                  >
                    {/* Day number and quick add pill */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black font-mono rounded-lg w-6 h-6 flex items-center justify-center ${
                          hasSpecialDates
                            ? "bg-amber-500 text-white shadow-2xs"
                            : item.isCurrentMonth && !item.isWeekend
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {item.dayNumber}
                      </span>

                      {item.isCurrentMonth && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors block">
                            <Plus className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Day contents: special dates & AIP sessions */}
                    <div className="space-y-1 mt-1 flex-1">
                      {item.fechas.map((f) => {
                        const typeConfig = TIPOS_FECHA_ESPECIAL_CONFIG[f.tipo] || TIPOS_FECHA_ESPECIAL_CONFIG["Otro"];
                        return (
                          <div
                            key={f.id}
                            className={`px-1.5 py-1 rounded-lg text-[10px] font-bold border leading-tight ${typeConfig.badgeClass} shadow-2xs`}
                            title={`${f.titulo}\nJustificación: ${f.motivoJustificacion}`}
                          >
                            <p className="truncate font-black">{f.titulo}</p>
                            {f.sinActividadAip && (
                              <span className="text-[8.5px] block font-mono font-medium opacity-90 truncate">
                                🚫 Sin AIP (Justificado)
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {hasAipSessions && (
                        <div className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-1 truncate font-mono">
                          <Laptop className="w-2.5 h-2.5 shrink-0" />
                          <span>{item.sesionesAip.length} ses. AIP</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom hint */}
                    {item.isCurrentMonth && hasSpecialDates && (
                      <div className="pt-1 text-right">
                        <span className="text-[8px] font-mono text-amber-700 font-bold uppercase tracking-wider">
                          Justificado
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Month's special dates list summary */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Fechas Especiales de {MESES[currentMonth]} {currentYear} ({monthSpecialDates.length})
            </h4>

            {monthSpecialDates.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                No hay fechas especiales registradas en {MESES[currentMonth]}. Todas las jornadas lectivas de lunes a viernes son hábiles para atención en AIP.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {monthSpecialDates.map((f) => {
                  const typeConfig = TIPOS_FECHA_ESPECIAL_CONFIG[f.tipo] || TIPOS_FECHA_ESPECIAL_CONFIG["Otro"];
                  return (
                    <div
                      key={f.id}
                      className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3 text-slate-500" />
                              {f.fechaFin && f.fechaFin !== f.fecha ? `${f.fecha} al ${f.fechaFin}` : f.fecha}
                            </span>
                            {f.fechaFin && f.fechaFin !== f.fecha && (
                              <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-mono font-bold text-[10px]">
                                {f.diasRango ? `${f.diasRango} días` : "Periodo"}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeConfig.badgeClass}`}>
                              {f.tipo}
                            </span>
                            {f.sinActividadAip && (
                              <span className="px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold font-mono">
                                Sin AIP
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-black text-slate-900 leading-snug">{f.titulo}</h5>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(f)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar fecha especial"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(f.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar fecha especial"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                        <p className="font-bold text-slate-700 flex items-center gap-1 text-[10px] uppercase font-mono">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Justificación Institucional Docente:</span>
                        </p>
                        <p className="italic leading-relaxed">{f.motivoJustificacion}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por motivo, justificación o fecha..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer w-full sm:w-auto"
              >
                <option value="TODOS">Todos los tipos</option>
                {Object.keys(TIPOS_FECHA_ESPECIAL_CONFIG).map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                  <th className="p-3">N°</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Denominación / Motivo</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-center">Sin AIP</th>
                  <th className="p-3">Justificación Oficial de Inasistencia</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDatesList.map((f, idx) => {
                  const typeConfig = TIPOS_FECHA_ESPECIAL_CONFIG[f.tipo] || TIPOS_FECHA_ESPECIAL_CONFIG["Otro"];
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-400 text-center">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div>
                          {f.fechaFin && f.fechaFin !== f.fecha ? `${f.fecha} al ${f.fechaFin}` : f.fecha}
                        </div>
                        {f.fechaFin && f.fechaFin !== f.fecha && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[10px] font-sans font-bold border border-purple-200">
                            {f.diasRango ? `${f.diasRango} días` : "Periodo"}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-800 max-w-[200px]">{f.titulo}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeConfig.badgeClass}`}>
                          {f.tipo}
                        </span>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {f.sinActividadAip ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                            SÍ (Justificado)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                            No
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 text-[11px] max-w-[320px] leading-relaxed">
                        {f.motivoJustificacion}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(f)}
                            className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(f.id)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Special Date */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {editingFecha ? "Editar Fecha Especial" : "Registrar Nueva Fecha Especial"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Justificación oficial para la no asistencia al Aula de Innovación
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Registration Mode Selector: Single Day vs Period Range */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setFormEsRango(false);
                  setFormFechaFin(formFechaInicio);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  !formEsRango
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 text-[#D92323]" />
                <span>1 Solo Día</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormEsRango(true);
                  if (!formFechaFin || formFechaFin < formFechaInicio) {
                    setFormFechaFin(formFechaInicio);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  formEsRango
                    ? "bg-white text-purple-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
                <span>Periodo / Varios Días (2 a 10+ días)</span>
              </button>
            </div>

            {/* Presets shortcut buttons */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                Atajos Rápidos de Fechas y Periodos Típicos:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_MOTIVOS.map((p) => (
                  <button
                    key={p.titulo}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>+ {p.titulo}</span>
                    {p.esRango && (
                      <span className="px-1 py-0.2 rounded bg-purple-200 text-purple-800 text-[9px] font-mono font-bold">
                        {p.diasDefecto}d
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4">
              {/* Date Inputs based on formEsRango */}
              {!formEsRango ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Single Fecha */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fecha (YYYY-MM-DD) *
                    </label>
                    <input
                      type="date"
                      required
                      value={formFechaInicio}
                      onChange={(e) => {
                        setFormFechaInicio(e.target.value);
                        setFormFechaFin(e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tipo de Fecha Especial *
                    </label>
                    <select
                      value={formTipo}
                      onChange={(e) => setFormTipo(e.target.value as TipoFechaEspecial)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {Object.keys(TIPOS_FECHA_ESPECIAL_CONFIG).map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Fecha Inicio */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        required
                        value={formFechaInicio}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormFechaInicio(val);
                          if (formFechaFin && formFechaFin < val) {
                            setFormFechaFin(val);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Fecha Fin */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Fecha de Finalización *
                      </label>
                      <input
                        type="date"
                        required
                        min={formFechaInicio}
                        value={formFechaFin}
                        onChange={(e) => setFormFechaFin(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Tipo */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tipo de Periodo *
                      </label>
                      <select
                        value={formTipo}
                        onChange={(e) => setFormTipo(e.target.value as TipoFechaEspecial)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-purple-500 cursor-pointer"
                      >
                        {Object.keys(TIPOS_FECHA_ESPECIAL_CONFIG).map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Calculated period badge banner */}
                  {formFechaInicio && formFechaFin && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                      formFechaFin < formFechaInicio 
                        ? "bg-rose-50 border-rose-200 text-rose-800" 
                        : "bg-purple-50/80 border-purple-200 text-purple-900"
                    }`}>
                      {formFechaFin < formFechaInicio ? (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="font-bold">La fecha de finalización no puede ser anterior a la fecha de inicio.</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-purple-600 shrink-0" />
                            <div>
                              <span className="font-black block text-slate-900">
                                {formatPeriodoDisplay(formFechaInicio, formFechaFin, false)}
                              </span>
                              <span className="text-[11px] text-purple-700">
                                Justificación unificada para todo el rango sin repetir el registro día por día.
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-200/90 text-purple-950 font-mono font-black text-xs">
                              {periodoCalculado?.totalDias || 1} días ({periodoCalculado?.diasHabiles || 1} hábiles)
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Título / Denominación */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Denominación o Motivo Principal *
                </label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ej: Feriado Nacional - Día del Trabajo / Jornada Pedagógica Institucional"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* Turno y Docentes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Turno Afectado
                  </label>
                  <select
                    value={formTurno}
                    onChange={(e) => setFormTurno(e.target.value as "ambos" | "mañana" | "tarde")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="ambos">Ambos Turnos (Todo el día)</option>
                    <option value="mañana">Solo Turno Mañana</option>
                    <option value="tarde">Solo Turno Tarde</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Docentes Justificados
                  </label>
                  <input
                    type="text"
                    value={formDocentes}
                    onChange={(e) => setFormDocentes(e.target.value)}
                    placeholder="Todos los docentes de la institución"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Checkbox: Suspender actividad AIP */}
              <div className="p-3 bg-red-50/60 border border-red-200/80 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#D92323] shrink-0" />
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      Suspender actividades pedagógicas en AIP
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Justifica oficialmente la no asistencia de los docentes en este día
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={formSinAip}
                  onChange={(e) => setFormSinAip(e.target.checked)}
                  className="w-4 h-4 accent-[#D92323] cursor-pointer"
                />
              </div>

              {/* Justificación text with AI Auto-Generator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Justificación Oficial para Informes y Registro AIP:
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateJustification}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Autocompletar redacción formal</span>
                  </button>
                </div>

                <textarea
                  rows={3}
                  required
                  value={formJustificacion}
                  onChange={(e) => setFormJustificacion(e.target.value)}
                  placeholder="Redacte la justificación legal o técnico-pedagógica de la no asistencia al AIP..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  {editingFecha ? "Guardar Cambios" : "Registrar Fecha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
