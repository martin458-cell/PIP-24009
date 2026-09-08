import React from "react";
import { Docente, RegistroAip, formatHoraAip } from "../types";
import { 
  BarChart3, 
  Users, 
  Monitor, 
  PieChart, 
  TrendingUp, 
  CheckCircle, 
  Calendar, 
  Award,
  BookOpen,
  Activity
} from "lucide-react";

interface InstitutionalMetricsProps {
  docentes: Docente[];
  registros: RegistroAip[];
}

export default function InstitutionalMetrics({ docentes, registros }: InstitutionalMetricsProps) {
  // Aggregate area counts
  const areaCounts: { [key: string]: number } = {};
  registros.forEach((r) => {
    areaCounts[r.area] = (areaCounts[r.area] || 0) + 1;
  });

  const sortedAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);
  const maxAreaCount = sortedAreas.length > 0 ? sortedAreas[0][1] : 1;

  // Grade counts for AIP
  const gradoCountsAip: { [key: string]: number } = {};
  registros.forEach((r) => {
    if (r.grado) {
      gradoCountsAip[r.grado] = (gradoCountsAip[r.grado] || 0) + 1;
    }
  });

  // Hours distribution
  const hourCounts: { [key: string]: number } = {};
  registros.forEach((r) => {
    const label = formatHoraAip(r.hora);
    hourCounts[label] = (hourCounts[label] || 0) + 1;
  });

  // Teachers condition counts
  const conditionCounts: { [key: string]: number } = {};
  docentes.forEach((d) => {
    const cond = d.condicion || "Sin especificar";
    conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
  });

  // Total students served
  const totalEstudiantes = registros.reduce((sum, r) => sum + (r.estudiantesAsistentes || 0), 0);
  const sesionesConPlan = registros.filter((r) => r.presentoSesion).length;
  const pctSesionesConPlan = registros.length > 0 ? Math.round((sesionesConPlan / registros.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-widest font-mono mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            Consola Analítica Integrada
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            Métricas & Monitoreo Escolar
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl mt-1">
            Auditoría de impacto pedagógico y uso de tecnologías de información y comunicación (TIC) en la IEPM N° 24009.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl self-start md:self-auto">
          <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
          <div>
            <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Estado General</p>
            <p className="text-xs font-black text-slate-800 font-mono">100% AUDITABLE</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase text-slate-400">Plantel Docente</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{docentes.length}</p>
            <p className="text-[10px] text-slate-500 font-medium">Registrados activos</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#D92323] flex items-center justify-center font-bold shrink-0">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase text-slate-400">Sesiones AIP</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{registros.length}</p>
            <p className="text-[10px] text-slate-500 font-medium">Visitas asentadas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase text-slate-400">Alumnos Atendidos</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{totalEstudiantes}</p>
            <p className="text-[10px] text-slate-500 font-medium">Participantes en total</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase text-slate-400">Plan Curricular</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{pctSesionesConPlan}%</p>
            <p className="text-[10px] text-emerald-600 font-medium font-bold">Con sesión entregada</p>
          </div>
        </div>
      </div>

      {/* Main Analytics Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Areas Distribution Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#D92323]" />
              Distribución por Áreas Curriculares (AIP)
            </h3>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Frecuencia</span>
          </div>

          {sortedAreas.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No hay registros de visitas aún.</p>
          ) : (
            <div className="space-y-3">
              {sortedAreas.map(([area, count]) => {
                const percentage = Math.round((count / maxAreaCount) * 100);
                return (
                  <div key={area} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{area}</span>
                      <span className="font-mono text-slate-900">{count} sesiones</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D92323] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hours Distribution Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Demanda de Turnos & Horas Pedagógicas
            </h3>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Concurrencia</span>
          </div>

          {Object.keys(hourCounts).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No hay registros de visitas aún.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(hourCounts).map(([hora, count]) => {
                const percentage = Math.round((count / registros.length) * 100);
                return (
                  <div key={hora} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{hora}</span>
                      <span className="font-mono text-slate-900">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
