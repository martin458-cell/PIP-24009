import React, { useState } from "react";
import { RegistroAip, Docente } from "../types";
import { X, FileText, Download, Calendar, Info, CheckCircle, RefreshCw, User, Filter, Award } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { SCHOOL_LOGO_PNG_BASE64, SCHOOL_LOGO_PATH } from "../assets/schoolLogo";

interface AipPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  registros: RegistroAip[];
  docentes?: Docente[];
  initialDocenteDni?: string;
}

const MESES_LIST = [
  { value: "0", label: "Enero" },
  { value: "1", label: "Febrero" },
  { value: "2", label: "Marzo" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Mayo" },
  { value: "5", label: "Junio" },
  { value: "6", label: "Julio" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Setiembre" },
  { value: "9", label: "Octubre" },
  { value: "10", label: "Noviembre" },
  { value: "11", label: "Diciembre" },
];

const ANOS_LIST = ["2026", "2025", "2027"];

interface DayRecord {
  fechaString: string; // YYYY-MM-DD
  fechaLabel: string; // "Día DD/MM"
  nombreDia: string; // "Lunes", etc.
  registros: RegistroAip[];
}

interface WeekRecord {
  numeroSemana: number;
  nombreSemana: string; // e.g. "Semana 1: de 01 al 05"
  dias: DayRecord[];
}

export default function AipPdfReportModal({ 
  isOpen, 
  onClose, 
  registros,
  docentes = [],
  initialDocenteDni = "ALL"
}: AipPdfReportModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedDocenteDni, setSelectedDocenteDni] = useState<string>(initialDocenteDni);
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>("ALL");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Selected teacher object if personal filter
  const selectedDocente = docentes.find((d) => d.dni === selectedDocenteDni);

  // Get days in the week from Monday to Friday starting from a given Monday
  const getMonToFriDays = (monday: Date): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Check if a date belongs to the chosen month
  const isOfTargetMonth = (date: Date, targetMonth: number, targetYear: number): boolean => {
    return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
  };

  // Calculate weeks of the month (Monday to Friday)
  const getWeeksOfMonth = (monthNum: number, yearNum: number): WeekRecord[] => {
    const weeks: WeekRecord[] = [];
    
    // First day of the month
    const firstDay = new Date(yearNum, monthNum, 1);
    
    const dayOfWeek = firstDay.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const currentMonday = new Date(firstDay);
    currentMonday.setDate(firstDay.getDate() + diffToMonday);

    let weekIndex = 1;
    let keepGoing = true;

    while (keepGoing) {
      const weekdays = getMonToFriDays(currentMonday);
      
      const hasDaysInMonth = weekdays.some(d => isOfTargetMonth(d, monthNum, yearNum));
      
      if (!hasDaysInMonth) {
        if (currentMonday.getMonth() !== monthNum && currentMonday.getTime() > firstDay.getTime()) {
          keepGoing = false;
          break;
        }
      }

      // Format days list with teacher filtering applied
      const daysMapped: DayRecord[] = weekdays.map((d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const dateDay = String(d.getDate()).padStart(2, "0");
        const customFormatStr = `${year}-${month}-${dateDay}`;

        const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const dayName = dayNames[d.getDay()];

        // Filter by date AND selected teacher if personal
        const matchingRegs = registros
          .filter((r) => {
            if (r.fecha !== customFormatStr) return false;
            if (selectedDocenteDni !== "ALL" && r.docenteDni !== selectedDocenteDni) return false;
            return true;
          })
          .sort((a, b) => a.hora - b.hora);

        return {
          fechaString: customFormatStr,
          fechaLabel: `${dateDay}/${month}`,
          nombreDia: dayName,
          registros: matchingRegs,
        };
      });

      const startDayFormat = String(weekdays[0].getDate()).padStart(2, "0");
      const startMonthFormat = MESES_LIST[weekdays[0].getMonth()].label.slice(0, 3);
      const endDayFormat = String(weekdays[4].getDate()).padStart(2, "0");
      const endMonthFormat = MESES_LIST[weekdays[4].getMonth()].label.slice(0, 3);
      const nombreSemana = `Semana 0${weekIndex}: del Lunes ${startDayFormat} de ${startMonthFormat} al Viernes ${endDayFormat} de ${endMonthFormat}`;

      weeks.push({
        numeroSemana: weekIndex,
        nombreSemana,
        dias: daysMapped,
      });

      currentMonday.setDate(currentMonday.getDate() + 7);
      weekIndex++;

      if (weekIndex > 6) {
        keepGoing = false;
      }
    }

    return weeks;
  };

  const targetMonthNum = parseInt(selectedMonth, 10);
  const targetYearNum = parseInt(selectedYear, 10);
  const allWeeksOfMonth = getWeeksOfMonth(targetMonthNum, targetYearNum);

  // Filter weeks if a specific week is chosen
  const displayedWeeks = selectedWeekFilter === "ALL" 
    ? allWeeksOfMonth 
    : allWeeksOfMonth.filter((w) => String(w.numeroSemana) === selectedWeekFilter);

  // Total records found in selected month with current filters
  const totalEntries = displayedWeeks.reduce((sum, w) => {
    return sum + w.dias.reduce((dSum, d) => dSum + d.registros.length, 0);
  }, 0);

  const totalEstudiantesPeriodo = displayedWeeks.reduce((sum, w) => {
    return sum + w.dias.reduce((dSum, d) => dSum + d.registros.reduce((rSum, r) => rSum + (r.estudiantesAsistentes || 0), 0), 0);
  }, 0);

  // PDF Generation function
  const handleGeneratePDF = () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const monthLabel = MESES_LIST[targetMonthNum].label.toUpperCase();
      const isPersonal = selectedDocenteDni !== "ALL" && selectedDocente;
      
      const docTitle = isPersonal
        ? `IEPM N° 24009 - INFORME PERSONAL DE ASISTENCIA AL AIP`
        : `IEPM N° 24009 - CONTROL MENSUAL DE ASISTENCIA Y USO DEL AIP`;
        
      const docSub = isPersonal
        ? `DOCENTE: ${selectedDocente.apellidosNombres.toUpperCase()} • DNI: ${selectedDocente.dni} • ${monthLabel} ${selectedYear}`
        : `AULA DE INNOVACIÓN PEDAGÓGICA (AIP) - MES DE ${monthLabel} ${selectedYear}`;

      doc.setFont("helvetica", "normal");

      // Header Banner Navy Blue (#0B1E36)
      doc.setFillColor(11, 30, 54); 
      doc.rect(10, 10, 190, 26, "F");

      // Institutional red line
      doc.setFillColor(217, 35, 35); 
      doc.rect(10, 36, 190, 1.5, "F");

      // Institutional school crest
      try {
        doc.addImage(SCHOOL_LOGO_PNG_BASE64, "PNG", 13, 12, 17, 21);
      } catch (err) {
        console.warn("Logo no añadido a PDF:", err);
      }

      // Banner text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.text(docTitle, 34, 18);

      doc.setFontSize(9);
      doc.text(docSub, 34, 24);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text(
        `Documento de supervisión pedagógica oficial • Emitido el ${new Date().toLocaleDateString("es-PE")} a las ${new Date().toLocaleTimeString("es-PE")}`, 
        34, 
        30
      );

      // Period and filter summary card
      doc.setFillColor(248, 250, 252);
      doc.rect(10, 39, 190, 13, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(10, 39, 190, 13, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      
      const filterScopeText = selectedWeekFilter === "ALL" 
        ? `MES COMPLETO (${displayedWeeks.length} semanas)` 
        : `SEMANA ESPECÍFICA N° ${selectedWeekFilter}`;

      doc.text(`ALCANCE: ${filterScopeText} • TOTAL SESIONES: ${totalEntries} • ESTUDIANTES ATENDIDOS: ${totalEstudiantesPeriodo}`, 15, 47);

      let currentY = 56;

      displayedWeeks.forEach((week) => {
        if (currentY > 230) {
          doc.addPage();
          currentY = 15;
        }

        // Week banner
        doc.setFillColor(241, 245, 249);
        doc.rect(10, currentY, 190, 8, "F");
        
        doc.setFillColor(217, 35, 35);
        doc.rect(10, currentY, 1.5, 8, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(11, 30, 54);
        doc.text(week.nombreSemana.toUpperCase(), 14, currentY + 5.5);

        currentY += 10;

        const tableBody: any[] = [];

        week.dias.forEach((day) => {
          if (day.registros.length === 0) {
            tableBody.push([
              day.nombreDia.toUpperCase(),
              day.fechaLabel,
              "-",
              isPersonal ? "-" : "SIN INGRESOS REGISTRADOS",
              "-",
              "-",
              "-",
              "-"
            ]);
          } else {
            day.registros.forEach((reg, regIdx) => {
              const formattedHora = reg.hora === 1.2 ? "1° y 2°" :
                                    reg.hora === 2.3 ? "2° y 3°" :
                                    reg.hora === 3.4 ? "3° y 4°" :
                                    reg.hora === 4.5 ? "4° y 5°" :
                                    reg.hora === 5.6 ? "5° y 6°" : `${reg.hora}°`;

              tableBody.push([
                regIdx === 0 ? day.nombreDia.toUpperCase() : "",
                regIdx === 0 ? day.fechaLabel : "",
                formattedHora,
                isPersonal ? (selectedDocente?.especialidad || "Primaria") : reg.docenteNombre,
                `${reg.grado} "${reg.seccion}"`,
                `${reg.area}\nTema: ${reg.tema}`,
                reg.recurso || "-",
                reg.estudiantesAsistentes
              ]);
            });
          }
        });

        autoTable(doc, {
          startY: currentY,
          head: [
            ["Día", "Fecha", "Hora", isPersonal ? "Especialidad" : "Docente", "Grado/Secc", "Área y Sesión de Aprendizaje", "Recurso", "Estud."]
          ],
          body: tableBody,
          theme: "grid",
          styles: {
            fontSize: 7.5,
            cellPadding: 2.2,
            valign: "middle",
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [11, 30, 54],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 7.5,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 18 },
            1: { cellWidth: 14, halign: "center" },
            2: { cellWidth: 15, halign: "center" },
            3: { fontStyle: "bold", cellWidth: 38 },
            4: { cellWidth: 18, halign: "center" },
            5: { cellWidth: 57 },
            6: { cellWidth: 20 },
            7: { cellWidth: 10, halign: "center" },
          },
          didDrawPage: (data: any) => {
            currentY = data.cursor.y;
          },
          margin: { left: 10, right: 10 }
        });

        currentY += 8;
      });

      // Signature block
      if (currentY > 230) {
        doc.addPage();
        currentY = 30;
      } else {
        currentY += 15;
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(30, currentY, 80, currentY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text("Prof. Martin H. Cahuana Mendoza", 55, currentY + 4, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Profesor de Innovación Pedagógica - PIP", 55, currentY + 8, { align: "center" });

      doc.line(130, currentY, 180, currentY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text("Mag. Félix Venegas Guerrero", 155, currentY + 4, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Director IEPM N° 24009 - V° B°", 155, currentY + 8, { align: "center" });

      const fileName = isPersonal
        ? `Informe_Asistencia_Personal_${selectedDocente.dni}_${MESES_LIST[targetMonthNum].label}_${selectedYear}.pdf`
        : `Control_Mensual_AIP_${MESES_LIST[targetMonthNum].label}_${selectedYear}.pdf`;

      doc.save(fileName);
    } catch (e) {
      alert("Error al compilar el PDF: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl bg-[#09101d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-12 bg-white/10 p-1 rounded-xl border border-white/15 flex items-center justify-center shrink-0">
              <img src={SCHOOL_LOGO_PATH} alt="Insignia 24009" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <span>Ficha de Asistencia de Docentes al AIP</span>
                {selectedDocenteDni !== "ALL" && (
                  <span className="bg-red-500/20 text-red-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    INFORME PERSONAL
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                I.E.P.M. N° 24009 Túpac Amaru II • Filtrado por mes, semana o docente • Descarga en PDF oficial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Controls Panel: 4 filters */}
          <div className="bg-slate-900/40 border border-white/5 p-4.5 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Mes del Informe
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold"
              >
                {MESES_LIST.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Año Académico
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold"
              >
                {ANOS_LIST.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Docente / Informe Personal
              </label>
              <select
                value={selectedDocenteDni}
                onChange={(e) => setSelectedDocenteDni(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold truncate"
              >
                <option value="ALL">Todos los Docentes (Ficha General)</option>
                {docentes.map((d) => (
                  <option key={d.dni} value={d.dni}>
                    {d.apellidosNombres} ({d.grado} {d.seccion})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Periodo de Semanas
              </label>
              <select
                value={selectedWeekFilter}
                onChange={(e) => setSelectedWeekFilter(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold"
              >
                <option value="ALL">Mes Completo (Todas las semanas)</option>
                {allWeeksOfMonth.map((w) => (
                  <option key={w.numeroSemana} value={String(w.numeroSemana)}>
                    Semana 0{w.numeroSemana}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher Personal Card if selected */}
          {selectedDocente && (
            <div className="bg-gradient-to-r from-red-950/30 via-slate-900/60 to-slate-900/40 border border-red-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D92323] text-white flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white">{selectedDocente.apellidosNombres}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">
                      DNI {selectedDocente.dni}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedDocente.especialidad} • Aula: {selectedDocente.grado} &quot;{selectedDocente.seccion}&quot;
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">Sesiones Mes:</span>
                  <span className="font-bold text-white text-sm">{totalEntries}</span>
                </div>
                <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">Estudiantes:</span>
                  <span className="font-bold text-blue-300 text-sm">{totalEstudiantesPeriodo}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDocenteDni("ALL")}
                  className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
                >
                  Ver Todos
                </button>
              </div>
            </div>
          )}

          {/* Quick HUD */}
          <div className="flex items-center gap-2 text-xs bg-[#0B1E36]/30 border border-blue-500/10 p-3.5 rounded-xl">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-slate-300">
              Mostrando registros de <strong>{MESES_LIST[targetMonthNum].label} {selectedYear}</strong>
              {selectedDocenteDni !== "ALL" && selectedDocente ? ` para el docente ${selectedDocente.apellidosNombres}` : " (Consolidado Institucional)"}
              {selectedWeekFilter !== "ALL" ? ` • Solo Semana ${selectedWeekFilter}` : ` • Mes completo (${displayedWeeks.length} semanas)`}.
              Se encontraron <strong className="text-blue-200">{totalEntries} sesiones registradas</strong>.
            </span>
          </div>

          {/* Live Preview layout by weeks and 5 days */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#D92323]">
                Vista Previa de Asistencia Semanal (Lunes a Viernes)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {displayedWeeks.length} {displayedWeeks.length === 1 ? "Semana mostrada" : "Semanas mostradas"}
              </span>
            </div>

            {displayedWeeks.map((week) => {
              const weekTotal = week.dias.reduce((s, d) => s + d.registros.length, 0);

              return (
                <div key={week.numeroSemana} className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/10">
                  {/* Week title block */}
                  <div className="bg-slate-900/60 p-3 flex items-center justify-between border-b border-white/10 text-xs">
                    <span className="font-extrabold text-slate-100 uppercase tracking-widest text-[11px] flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-[#D92323] inline-block"></span>
                      {week.nombreSemana}
                    </span>
                    <span className="bg-slate-950 border border-white/5 py-0.5 px-2.5 rounded font-bold font-mono text-[10px] text-red-400">
                      {weekTotal} {weekTotal === 1 ? "Visita" : "Visitas"}
                    </span>
                  </div>

                  {/* 5-day columns preview list */}
                  <div className="overflow-x-auto w-full">
                    <div className="grid grid-cols-5 divide-x divide-white/5 text-[11px] min-w-[800px] md:min-w-0">
                      {week.dias.map((day) => {
                        const isTarget = isOfTargetMonth(new Date(day.fechaString + "T00:00:00"), targetMonthNum, targetYearNum);

                        return (
                          <div
                            key={day.fechaString}
                            className={`p-3 space-y-2.5 min-h-[140px] flex flex-col ${
                              !isTarget ? "opacity-30 bg-black/15" : "bg-transparent hover:bg-white/[0.01]"
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-white/5 pb-1 opacity-80">
                              <span className="font-extrabold text-blue-200 uppercase tracking-wider">{day.nombreDia}</span>
                              <span className="font-mono text-slate-400 font-bold">{day.fechaLabel}</span>
                            </div>

                            <div className="space-y-1.5 flex-1">
                              {day.registros.length === 0 ? (
                                <p className="text-[10px] font-mono text-slate-500 italic py-1">Sin ingresos</p>
                              ) : (
                                day.registros.map((reg) => (
                                  <div
                                    key={reg.id}
                                    className="bg-slate-950 p-2 rounded-lg border border-white/5 hover:border-red-500/20 transition-all space-y-1"
                                  >
                                    <div className="flex justify-between items-start gap-1">
                                      <span className="font-bold text-white leading-tight block truncate max-w-[80px]" title={reg.docenteNombre}>
                                        {reg.docenteNombre.split(",")[0]}
                                      </span>
                                      <span className="bg-[#0B1E36] border border-blue-500/15 py-0.2 px-1 rounded text-[8px] font-bold text-slate-300 shrink-0 font-mono">
                                        {reg.hora === 1.2 ? "1°-2°" :
                                         reg.hora === 2.3 ? "2°-3°" :
                                         reg.hora === 3.4 ? "3°-4°" :
                                         reg.hora === 4.5 ? "4°-5°" :
                                         reg.hora === 5.6 ? "5°-6°" : `${reg.hora}°`}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-blue-300 font-semibold uppercase tracking-wider">
                                      {reg.grado} &quot;{reg.seccion}&quot;
                                    </p>
                                    <p className="text-[9.5px] text-slate-400 line-clamp-1">{reg.tema}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900/60 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 hidden sm:block">
            {totalEntries} sesiones encontradas con los filtros seleccionados
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-350 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              Cerrar
            </button>
            
            <button
              type="button"
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="px-6 py-2 bg-[#D92323] hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Compilando PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Descargar PDF ({selectedDocenteDni === "ALL" ? "General" : "Personal"})
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
