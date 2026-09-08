import { Docente } from "../types";
import { Users, GraduationCap, Award } from "lucide-react";

interface TeacherStatsProps {
  docentes: Docente[];
}

export default function TeacherStats({ docentes }: TeacherStatsProps) {
  // Calculate stats
  const total = docentes.length;
  
  // Calculate specialty counts
  const specialtyCounts: { [key: string]: number } = {};
  docentes.forEach((d) => {
    specialtyCounts[d.especialidad] = (specialtyCounts[d.especialidad] || 0) + 1;
  });
  
  // Find top specialty
  let topSpecialty = "Ninguno";
  let topSpecialtyCount = 0;
  Object.entries(specialtyCounts).forEach(([spec, count]) => {
    if (count > topSpecialtyCount) {
      topSpecialty = spec;
      topSpecialtyCount = count;
    }
  });

  // Calculate distribution of grades
  const gradeCounts: { [key: string]: number } = {};
  docentes.forEach((d) => {
    gradeCounts[d.grado] = (gradeCounts[d.grado] || 0) + 1;
  });

  // Find most populated grade
  let topGrade = "Ninguno";
  let topGradeCount = 0;
  Object.entries(gradeCounts).forEach(([grade, count]) => {
    if (count > topGradeCount) {
      topGrade = grade;
      topGradeCount = count;
    }
  });

  // Average Age Estimation based on birthday
  let averageAgeStr = "N/D";
  if (total > 0) {
    const currentYear = new Date().getFullYear();
    const agesSum = docentes.reduce((sum, d) => {
      const birthYear = new Date(d.fechaNacimiento).getFullYear();
      return sum + (currentYear - birthYear);
    }, 0);
    averageAgeStr = `${Math.round(agesSum / total)} años`;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-1">
      
      {/* CARD 1: Total Teachers */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 hover:border-slate-300 transition-all shadow-sm">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
          <Users className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-[#0B1E36] block font-mono uppercase tracking-wider font-extrabold">Total Staff</span>
          <span className="text-2xl font-black text-slate-950 block mt-0.5">{total}</span>
          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap block mt-0.5">
            Docentes registrados activos
          </span>
        </div>
      </div>

      {/* CARD 2: Top Specialty */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 hover:border-slate-300 transition-all shadow-sm">
        <div className="w-12 h-12 bg-red-50 text-[#D92323] rounded-xl flex items-center justify-center border border-red-100 shrink-0">
          <Award className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] text-[#0B1E36] block font-mono uppercase tracking-wider font-extrabold">Esp. Principal</span>
          <span className="text-sm font-bold text-slate-900 block mt-0.5 truncate" title={topSpecialty}>
            {topSpecialty}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            {topSpecialtyCount > 0 ? `${topSpecialtyCount} docentes asignados` : 'Sin especialidades'}
          </span>
        </div>
      </div>

      {/* CARD 3: Top Grade */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 hover:border-slate-300 transition-all shadow-sm">
        <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] text-[#0B1E36] block font-mono uppercase tracking-wider font-extrabold">Mayor Demanda</span>
          <span className="text-lg font-black text-slate-900 block mt-0.5">
            Grado {topGrade}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            {topGradeCount > 0 ? `${topGradeCount} secciones con docentes` : 'Sin asignaciones'}
          </span>
        </div>
      </div>

      {/* CARD 4: Average Age / Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 hover:border-slate-300 transition-all shadow-sm">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-[#0B1E36] block font-mono uppercase tracking-wider font-extrabold">Edad Promedio</span>
          <span className="text-2xl font-black text-slate-950 block mt-0.5">{averageAgeStr}</span>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            Edad estimada del plantel
          </span>
        </div>
      </div>

    </div>
  );
}
