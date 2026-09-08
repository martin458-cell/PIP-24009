import React, { useState } from "react";
import { RegistroAip, Docente } from "../types";
import { 
  FileText, 
  Download, 
  Calendar, 
  CheckCircle, 
  ShieldCheck, 
  Printer, 
  Sparkles, 
  Award, 
  School,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  ArrowRight
} from "lucide-react";
import AipPdfReportModal from "./AipPdfReportModal";

interface ReportsCenterProps {
  registros: RegistroAip[];
  docentes?: Docente[];
  onNavigateToInformeMensual?: () => void;
}

export default function ReportsCenter({ 
  registros, 
  docentes = [],
  onNavigateToInformeMensual 
}: ReportsCenterProps) {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Quick stats for reports
  const totalRegistros = registros.length;
  const totalEstudiantes = registros.reduce((sum, r) => sum + (r.estudiantesAsistentes || 0), 0);
  const sesionesConPlan = registros.filter((r) => r.presentoSesion).length;
  const pctSesionesConPlan = totalRegistros > 0 ? Math.round((sesionesConPlan / totalRegistros) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Sector Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-bold uppercase tracking-widest font-mono mb-2">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            Documentación Normativa & Exportación Oficial
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            Centro de Reportes & Fichas Oficiales
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl mt-1">
            Genere los consolidados mensuales de asistencia al AIP (Anexo 1) en PDF y elabore su informe mensual de actividades con descarga en Word (.docx).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onNavigateToInformeMensual && (
            <button
              type="button"
              onClick={onNavigateToInformeMensual}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Elaborar Informe en Word (.docx)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D92323] hover:bg-red-600 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Generar Reporte PDF Mensual</span>
          </button>
        </div>
      </div>

      {/* Grid of 2 Main Official Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Ficha de Asistencia Anexo 1 */}
        <div className="bg-gradient-to-r from-purple-50/50 via-white to-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 text-[10px] font-mono font-black uppercase tracking-wider">
                DOCUMENTO OFICIAL ANEXO 1
              </span>
              <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Acreditado UGEL
              </span>
            </div>

            <h3 className="text-base font-black text-slate-900">
              Ficha de Asistencia de Docentes al AIP (PDF)
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Estructura normalizada con división por semanas (de lunes a viernes), turnos, horas pedagógicas, áreas curriculares, temas, entrega de sesión y recuento de alumnos atendidos. Ahora permite filtrar por <strong>mes completo, semana específica o informe personal de cada docente</strong>.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 uppercase block">Visitas</span>
                <span className="text-xs font-black text-slate-800">{totalRegistros}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 uppercase block">Alumnos</span>
                <span className="text-xs font-black text-slate-800">{totalEstudiantes}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 uppercase block">Sesión TIC</span>
                <span className="text-xs font-black text-emerald-600">{pctSesionesConPlan}%</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Configurar y Descargar PDF Oficial</span>
          </button>
        </div>

        {/* Card 2: Elaboración de Informe Mensual en Word */}
        <div className="bg-gradient-to-r from-blue-50/50 via-white to-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-[10px] font-mono font-black uppercase tracking-wider">
                NUEVO FORMATO INSTITUCIONAL
              </span>
              <span className="text-xs font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Word (.docx)
              </span>
            </div>

            <h3 className="text-base font-black text-slate-900">
              Elaborador de Informe Mensual de Actividades (PIP)
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Módulo interactivo que genera en tiempo real los componentes del informe mensual oficial: matriz de actividades en dos columnas, cuadro estadístico sincronizado del AIP, y balance de logros, dificultades y sugerencias con exportación en Microsoft Word (.docx).
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100 text-xs">
                <span className="text-[10px] text-blue-800 font-bold block">✨ Auto-Generación</span>
                <span className="text-[10.5px] text-slate-600">Calcula actividades desde el AIP</span>
              </div>
              <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100 text-xs">
                <span className="text-[10px] text-blue-800 font-bold block">📄 Formato Word</span>
                <span className="text-[10.5px] text-slate-600">Con tablas y membrete oficial</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToInformeMensual}
            className="w-full py-2.5 px-3 rounded-xl bg-[#0B1E36] hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
          >
            <span>Ir al Elaborador de Informe Mensual</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Guidelines & Compliance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-700">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            1
          </div>
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
            Cálculo Dinámico por Semanas
          </h4>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            El generador agrupa los días de lunes a viernes del mes seleccionado, omitiendo fines de semana y ordenando cronológicamente las horas pedagógicas.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            2
          </div>
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
            Filtro General o Personal
          </h4>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Permite imprimir el consolidado completo de la institución o aislar las horas y sesiones de un solo docente para su informe personal de cumplimiento.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-[#D92323] flex items-center justify-center font-bold">
            3
          </div>
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
            Firmas Digitales Institucionales
          </h4>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Cada página generada incluye el pie con las líneas de firma formal del Docente PIP (Martín H. Cahuana Mendoza) y de la Dirección Institucional.
          </p>
        </div>
      </div>

      {/* Modal for PDF Generation */}
      <AipPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        registros={registros}
        docentes={docentes}
      />

    </div>
  );
}
