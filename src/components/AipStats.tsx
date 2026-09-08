import React from "react";
import { RegistroAip } from "../types";
import { BookOpen, Users, ClipboardCheck, MessageSquare, Activity } from "lucide-react";

interface AipStatsProps {
  registros: RegistroAip[];
}

export default function AipStats({ registros }: AipStatsProps) {
  const total = registros.length;

  // Calculate sum of student assistants
  const totalAlumnos = registros.reduce((acc, r) => acc + (r.estudiantesAsistentes || 0), 0);

  // Presented sessions
  const conSesion = registros.filter((r) => r.presentoSesion).length;
  const pctSesion = total > 0 ? Math.round((conSesion / total) * 100) : 0;

  // Area distributions
  const areaCounts: { [key: string]: number } = {};
  registros.forEach((r) => {
    areaCounts[r.area] = (areaCounts[r.area] || 0) + 1;
  });

  let topArea = "Ninguna";
  let topAreaCount = 0;
  Object.keys(areaCounts).forEach((key) => {
    if (areaCounts[key] > topAreaCount) {
      topAreaCount = areaCounts[key];
      topArea = key;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Stat 1: Total logs */}
      <div className="bg-white border border-slate-200 p-4.5 rounded-2xl flex items-center gap-4 hover:border-[#D92323]/40 transition-all group shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#D92323] shrink-0 transition-transform group-hover:scale-105">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">
            Total Ingresos AIP
          </p>
          <p className="text-xl font-black font-mono text-slate-800 mt-0.5 leading-none">
            {total} <span className="text-[11px] text-slate-500 font-normal font-sans">sesiones</span>
          </p>
        </div>
      </div>

      {/* Stat 2: Student counter */}
      <div className="bg-white border border-slate-200 p-4.5 rounded-2xl flex items-center gap-4 hover:border-[#D92323]/40 transition-all group shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0 transition-transform group-hover:scale-105">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">
            Estudiantes Atendidos
          </p>
          <p className="text-xl font-black font-mono text-slate-800 mt-0.5 leading-none">
            {totalAlumnos} <span className="text-[11px] text-slate-500 font-normal font-sans">niños(as)</span>
          </p>
        </div>
      </div>

      {/* Stat 3: Session plans submittal percentage */}
      <div className="bg-white border border-slate-200 p-4.5 rounded-2xl flex items-center gap-4 hover:border-[#D92323]/40 transition-all group shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 transition-transform group-hover:scale-105">
          <ClipboardCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">
            Sesión Entregada
          </p>
          <p className="text-xl font-black font-mono text-slate-800 mt-0.5 leading-none">
            {pctSesion}% <span className="text-[10px] text-emerald-600 font-black font-sans">({conSesion}/{total})</span>
          </p>
        </div>
      </div>

      {/* Stat 4: Top Area */}
      <div className="bg-white border border-slate-200 p-4.5 rounded-2xl flex items-center gap-4 hover:border-[#D92323]/40 transition-all group shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 transition-transform group-hover:scale-105">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">
            Área Predominante
          </p>
          <p className="text-sm font-black text-slate-800 mt-0.5 truncate uppercase tracking-tight">
            {topArea}
          </p>
          {total > 0 && (
            <p className="text-[10px] font-mono text-indigo-600 font-extrabold mt-0.5">
              {topAreaCount} registrados
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
