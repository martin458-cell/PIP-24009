import { useState } from "react";
import { RegistroAip, AREAS_AIP_LIST, formatHoraAip } from "../types";
import { Search, Edit2, Trash2, SlidersHorizontal, RefreshCcw, FileSpreadsheet, FileText, Download, ArrowUpDown, Calendar, HelpCircle, CheckCircle, AlertTriangle } from "lucide-react";
import AipPdfReportModal from "./AipPdfReportModal";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface AipTableProps {
  registros: RegistroAip[];
  onEdit: (registro: RegistroAip) => void;
  onDelete: (id: string) => void;
}

export default function AipTable({ registros, onEdit, onDelete }: AipTableProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("TODAS");
  const [selectedPresentoSesion, setSelectedPresentoSesion] = useState("TODOS");
  const [sortBy, setSortBy] = useState<"fecha" | "docente">("fecha");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Search and filter logic
  const filteredRegistros = registros.filter((reg) => {
    const matchesSearch =
      reg.docenteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.docenteDni.includes(searchTerm) ||
      reg.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.recurso && reg.recurso.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesArea =
      selectedArea === "TODAS" || reg.area === selectedArea;

    const matchesPresento =
      selectedPresentoSesion === "TODOS" ||
      (selectedPresentoSesion === "SI" && reg.presentoSesion === true) ||
      (selectedPresentoSesion === "NO" && reg.presentoSesion === false);

    return matchesSearch && matchesArea && matchesPresento;
  });

  // Sorting logic
  const sortedRegistros = [...filteredRegistros].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "fecha") {
      // Sort primarily by date then hour
      comparison = a.fecha.localeCompare(b.fecha);
      if (comparison === 0) {
        comparison = a.hora - b.hora;
      }
    } else {
      comparison = a.docenteNombre.localeCompare(b.docenteNombre);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination calculation
  const totalItems = sortedRegistros.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRegistros = sortedRegistros.slice(startIndex, startIndex + itemsPerPage);

  const toggleSort = (type: "fecha" | "docente") => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(type);
      setSortOrder(type === "fecha" ? "desc" : "asc"); // default date to newest, teacher to order alphabetically
    }
    setCurrentPage(1);
  };

  const handleDirectPdfDownload = () => {
    try {
      const today = new Date();
      const currentMonthNum = today.getMonth(); // 0-11
      const currentYearNum = today.getFullYear(); // 2026/2025/etc.
      
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

      const monthLabel = MESES_LIST[currentMonthNum].label.toUpperCase();
      
      // Calculate weeks
      const weeks: any[] = [];
      const firstDay = new Date(currentYearNum, currentMonthNum, 1);
      const dayOfWeek = firstDay.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const currentMonday = new Date(firstDay);
      currentMonday.setDate(firstDay.getDate() + diffToMonday);

      let weekIndex = 1;
      let keepGoing = true;

      while (keepGoing) {
        const weekdays: Date[] = [];
        for (let i = 0; i < 5; i++) {
          const d = new Date(currentMonday);
          d.setDate(currentMonday.getDate() + i);
          weekdays.push(d);
        }

        const hasDaysInMonth = weekdays.some(d => d.getMonth() === currentMonthNum && d.getFullYear() === currentYearNum);
        if (!hasDaysInMonth) {
          if (currentMonday.getMonth() !== currentMonthNum && currentMonday.getTime() > firstDay.getTime()) {
            keepGoing = false;
            break;
          }
        }

        const diasMapped = weekdays.map((d) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const dateDay = String(d.getDate()).padStart(2, "0");
          const customFormatStr = `${year}-${month}-${dateDay}`;
          const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
          const dayName = dayNames[d.getDay()];
          // Find match in actual dataset records and sort by hour ascending (1.2, 3.4, 5.6)
          const matchingRegs = registros
            .filter((r) => r.fecha === customFormatStr)
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
          dias: diasMapped,
        });

        currentMonday.setDate(currentMonday.getDate() + 7);
        weekIndex++;
        if (weekIndex > 6) {
          keepGoing = false;
        }
      }

      const totalMonthEntries = weeks.reduce((sum, w) => {
        return sum + w.dias.reduce((dSum: number, d: any) => dSum + d.registros.length, 0);
      }, 0);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const docTitle = `IEPM N° 24009 - CONTROL MENSUAL DE ASISTENCIA Y USO DEL AIP`;
      const docSub = `AULA DE INNOVACIÓN PEDAGÓGICA (AIP) - MES DE ${monthLabel} ${currentYearNum}`;

      doc.setFont("helvetica", "normal");
      // Draw elegant Header Banner - Navy Blue (#0B1E36)
      doc.setFillColor(11, 30, 54); 
      doc.rect(10, 10, 190, 25, "F");

      // Add tiny corporate divider with the school's red color (#D92323)
      doc.setFillColor(217, 35, 35); 
      doc.rect(10, 35, 190, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(docTitle, 15, 18);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(docSub, 15, 23);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text(`Dirección académica • Reporte Directo procesado el ${new Date().toLocaleDateString("es-PE")} a las ${new Date().toLocaleTimeString("es-PE")}`, 15, 29);

      doc.setFillColor(248, 250, 252);
      doc.rect(10, 38, 190, 12, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(10, 38, 190, 12, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`TOTAL DE VISITAS REGISTRADAS EN ESTE MES: ${totalMonthEntries}`, 15, 45);
      doc.setFont("helvetica", "normal");
      doc.text(`Semanas del mes: ${weeks.length} • Estado de firmas: VALIDADO`, 120, 45);

      let currentY = 55;

      weeks.forEach((week) => {
        if (currentY > 230) {
          doc.addPage();
          currentY = 15;
        }

        // Draw week subheader banner with professional, soft background
        doc.setFillColor(241, 245, 249); // slate-100 (soft background)
        doc.rect(10, currentY, 190, 8, "F");
        
        // Solid left accent bar with institutional red
        doc.setFillColor(217, 35, 35); // IE Red (#D92323)
        doc.rect(10, currentY, 1.5, 8, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(11, 30, 54); // Deep Navy (#0B1E36)
        doc.text(week.nombreSemana.toUpperCase(), 14, currentY + 5.5);

        currentY += 10;

        const tableBody: any[] = [];
        week.dias.forEach((day: any) => {
          if (day.registros.length === 0) {
            tableBody.push([
              day.nombreDia.toUpperCase(),
              day.fechaLabel,
              "-",
              "-",
              "SIN INGRESOS REGISTRADOS",
              "-",
              "-",
              "-"
            ]);
          } else {
            day.registros.forEach((reg: any, regIdx: number) => {
              const formattedHora = reg.hora === 1.2 ? "1° y 2°" :
                                    reg.hora === 2.3 ? "2° y 3°" :
                                    reg.hora === 3.4 ? "3° y 4°" :
                                    reg.hora === 4.5 ? "4° y 5°" :
                                    reg.hora === 5.6 ? "5° y 6°" : `${reg.hora}°`;

              tableBody.push([
                regIdx === 0 ? day.nombreDia.toUpperCase() : "",
                regIdx === 0 ? day.fechaLabel : "",
                formattedHora,
                reg.docenteNombre,
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
            ["Día", "Fecha", "Hora", "Docente", "Grado/Secc", "Área y Sesión de Aprendizaje", "Recurso", "Estud."]
          ],
          body: tableBody,
          theme: "grid",
          styles: {
            fontSize: 7.5,
            cellPadding: 2.2,
            valign: "middle",
            lineColor: [226, 232, 240], // slate-200 (subtle grid borders instead of default dark lines)
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [11, 30, 54], // Navy Blue (#0B1E36)
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 7.5,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252], // slate-50 alternating rows for readability
          },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 18 },
            1: { cellWidth: 14, halign: "center" },
            2: { cellWidth: 15, halign: "center" },
            3: { fontStyle: "bold", cellWidth: 40 },
            4: { cellWidth: 18, halign: "center" },
            5: { cellWidth: 55 },
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
      doc.text("PIP Martín H. Cahuana Mendoza", 55, currentY + 4, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Responsable de AIP / PIP", 55, currentY + 8, { align: "center" });

      doc.line(130, currentY, 180, currentY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text("Lic. Félix C. Venegas Guerrero", 155, currentY + 4, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Director - V° B°", 155, currentY + 8, { align: "center" });

      doc.save(`Reporte_Asistencia_AIP_${monthLabel}_${currentYearNum}.pdf`);
    } catch (e) {
      alert("Error al descargar PDF directamente: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleExportCSV = () => {
    if (registros.length === 0) return;
    const headers = "DNI_Docente,Nombre_Docente,Fecha,Hora,Area,Tema_Sesion,Recurso_Usado,Presento_Sesion,Grado,Seccion,Estudiantes_Asistentes,Observacion\n";
    const rows = registros
      .map((r) => 
        `"${r.docenteDni}","${r.docenteNombre}","${r.fecha}",${r.hora},"${r.area}","${r.tema.replace(/"/g, '""')}","${(r.recurso || '').replace(/"/g, '""')}","${r.presentoSesion ? 'SI' : 'NO'}","${r.grado}","${r.seccion}",${r.estudiantesAsistentes},"${(r.observacion || '').replace(/"/g, '""')}"`
      )
      .join("\n");
      
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Reporte_AIP_IEPM_24009_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedArea("TODAS");
    setSelectedPresentoSesion("TODOS");
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full text-slate-800">
      
      {/* Filtering Header Area */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por Docente, DNI, Tema o Recurso..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#D92323] focus:ring-2 focus:ring-red-500/10 text-slate-800 placeholder-slate-400 shadow-sm"
            />
          </div>

          {/* Quick Actions (CSV / PDF) */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <button
              onClick={handleDirectPdfDownload}
              className="flex items-center gap-1.5 px-3 py-2 text-xs border border-emerald-200 rounded-xl bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 text-emerald-800 shadow-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer"
              title="Descargar Reporte Mensual PDF en un solo clic"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar PDF Directo
            </button>
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs border border-red-200 rounded-xl bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-550/10 text-red-700 shadow-sm font-bold transition-all cursor-pointer"
              title="Generar e imprimir Reporte Mensual por Semanas en PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              Vista Previa (Semanas)
            </button>
            <button
              onClick={handleExportCSV}
              disabled={registros.length === 0}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/10 text-slate-705 shadow-sm font-bold transition-all ${
                registros.length === 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              }`}
              title="Descargar libro de ingresos en formato CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel / CSV
            </button>
          </div>
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-250">
          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold uppercase tracking-wider font-mono">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtros:</span>
          </div>

          {/* Area select */}
          <div className="shrink-0">
            <select
              value={selectedArea}
              onChange={(e) => {
                setSelectedArea(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white text-[11px] text-slate-700 font-bold border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#D92323] cursor-pointer"
            >
              <option value="TODAS" className="bg-white text-slate-900 font-medium">TODAS LAS ÁREAS</option>
              {AREAS_AIP_LIST.map((a) => (
                <option key={a} value={a} className="bg-white text-slate-900 font-medium">
                  {a.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Presento Sesión select */}
          <div className="shrink-0">
            <select
              value={selectedPresentoSesion}
              onChange={(e) => {
                setSelectedPresentoSesion(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white text-[11px] text-slate-700 font-bold border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#D92323] cursor-pointer"
            >
              <option value="TODOS" className="bg-white text-slate-900 font-medium">SESIÓN: TODOS</option>
              <option value="SI" className="bg-white text-slate-900 font-medium font-bold text-emerald-700">SÍ PRESENTÓ</option>
              <option value="NO" className="bg-white text-slate-900 font-medium font-bold text-red-655">NO PRESENTÓ</option>
            </select>
          </div>

          {/* Reset Filters Link */}
          {(searchTerm !== "" || selectedArea !== "TODAS" || selectedPresentoSesion !== "TODOS") && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] uppercase font-mono font-extrabold text-[#D92323] hover:bg-red-50 transition-all cursor-pointer rounded-lg border border-red-200"
            >
              <RefreshCcw className="w-3 h-3" />
              Limpiar
            </button>
          )}

          <div className="ml-auto text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
            Mostrando {filteredRegistros.length} de {registros.length} entradas
          </div>
        </div>
      </div>

      {/* Grid Content / Table */}
      <div className="flex-1 overflow-x-auto bg-white">
        {paginatedRegistros.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="w-12 h-12 text-slate-350 mx-auto mb-4" />
            <p className="text-sm font-extrabold text-slate-800">Ningún ingreso coincide con los criterios.</p>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Registre ingresos usando el formulario lateral para poblar el libro pedagógico.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] font-mono">
                <th className="px-5 py-3">
                  <button
                    onClick={() => toggleSort("docente")}
                    className="flex items-center gap-1 hover:text-slate-900 transition-all cursor-pointer font-bold"
                  >
                    Docente
                    <ArrowUpDown className="w-3 h-3 text-red-655" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    onClick={() => toggleSort("fecha")}
                    className="flex items-center gap-1 hover:text-slate-900 transition-all cursor-pointer font-bold"
                  >
                    Fecha y Hora
                    <ArrowUpDown className="w-3 h-3 text-red-655" />
                  </button>
                </th>
                <th className="px-4 py-3">Área / Grado</th>
                <th className="px-4 py-3">Tema de Sesión</th>
                <th className="px-4 py-3">Recurso Usado</th>
                <th className="px-4 py-3 text-center">Sesión?</th>
                <th className="px-4 py-3 text-center">Asist.</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {paginatedRegistros.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                  
                  {/* Docente Info */}
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-extrabold text-[#0B1E36] text-xs">{reg.docenteNombre}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">DNI: {reg.docenteDni}</p>
                    </div>
                  </td>

                  {/* Date & PedHour */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{reg.fecha}</p>
                      <span className="inline-flex items-center text-[10px] font-bold text-slate-700 font-mono mt-0.5 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                        {formatHoraAip(reg.hora)}
                      </span>
                    </div>
                  </td>

                  {/* Area / Grado */}
                  <td className="px-4 py-3.5">
                    <div>
                      <span className="font-extrabold text-blue-700">{reg.area}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-bold">
                        {reg.grado} - Secc. &quot;{reg.seccion}&quot;
                      </p>
                    </div>
                  </td>

                  {/* Tema */}
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <div className="break-words">
                      <p className="font-bold text-slate-805 leading-relaxed">{reg.tema}</p>
                      {reg.observacion && (
                        <p className="text-[10px] text-slate-500 mt-1 italic font-medium flex items-start gap-1">
                          <HelpCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1 hover:line-clamp-none transition-all">{reg.observacion}</span>
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Recurso */}
                  <td className="px-4 py-3.5 font-mono text-[11px]">
                    <span className="text-indigo-805 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 font-bold">
                      {reg.recurso || "N/A"}
                    </span>
                  </td>

                  {/* Presentó Sesión Badge */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {reg.presentoSesion ? (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
                        SÍ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 text-[10px] font-black uppercase text-red-750 bg-red-50 border border-red-200 rounded-xl">
                        NO
                      </span>
                    )}
                  </td>

                  {/* Asistentes Count */}
                  <td className="px-4 py-3.5 text-center font-mono font-black text-slate-800">
                    <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                      {reg.estudiantesAsistentes}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* Edit */}
                      <button
                        onClick={() => onEdit(reg)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                        title="Modificar Entrada"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(reg.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Eliminar Entrada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer HUD */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-bold">
          <div>
            Página <span className="font-extrabold text-slate-800 font-mono">{currentPage}</span> de{" "}
            <span className="font-extrabold text-slate-800 font-mono">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 bg-white border border-slate-205 rounded-lg text-slate-700 font-bold transition-all ${
                currentPage === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer"
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 bg-white border border-slate-205 rounded-lg text-slate-700 font-bold transition-all ${
                currentPage === totalPages ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer"
              }`}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* PDF Generation Modal */}
      <AipPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        registros={registros}
      />

    </div>
  );
}
