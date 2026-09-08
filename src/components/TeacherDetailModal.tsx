import { Docente } from "../types";
import { X, Mail, Phone, Calendar, Award, GraduationCap, ShieldCheck, Printer, Briefcase, TrendingUp, Clock } from "lucide-react";

interface TeacherDetailModalProps {
  docente: Docente;
  onClose: () => void;
}

export default function TeacherDetailModal({ docente, onClose }: TeacherDetailModalProps) {
  
  // Calculate teacher's age
  const birthYear = new Date(docente.fechaNacimiento).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  // Format date elegantly
  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', options);
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 animate-scaleUp print:border-none print:shadow-none my-4">
        
        {/* Modal Top Header */}
        <div className="bg-slate-50 text-slate-900 p-6 relative border-b border-slate-205">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#D92323]"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
              <GraduationCap className="w-8 h-8 text-[#D92323]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#D92323] font-extrabold">
                FICHA OFICIAL DE RECONOCIMIENTO
              </span>
              <h3 className="text-lg font-extrabold truncate pr-6 text-slate-800 mt-0.5">
                {docente.apellidosNombres}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                DNI N° <span className="font-mono text-slate-900 font-bold">{docente.dni}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6 bg-white">
          
          {/* Main Badge Info (Grade & Section) */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-center border-r border-slate-200 pr-2">
              <span className="text-[10px] text-slate-600 uppercase font-bold font-mono tracking-wider block">
                Grado Asignado
              </span>
              <span className="text-xl font-black text-slate-800 block mt-1">
                {docente.grado}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">Grado de Estudios</span>
            </div>
            <div className="text-center pl-2">
              <span className="text-[10px] text-slate-600 uppercase font-bold font-mono tracking-wider block">
                Sección
              </span>
              <span className="text-xl font-black text-[#D92323] block mt-1">
                {docente.seccion}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">Aula Integrada</span>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-[#D92323] uppercase tracking-widest border-b border-slate-200 pb-2">
              Información del Docente
            </h4>

            {/* Specialty */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-50 text-[#D92323] rounded-lg flex items-center justify-center shrink-0 border border-red-100">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">
                  Especialidad Académica
                </span>
                <span className="text-sm font-bold text-slate-805">
                  {docente.especialidad}
                </span>
              </div>
            </div>

            {/* Condición */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#D92323]/5 text-red-700 rounded-lg flex items-center justify-center shrink-0 border border-red-100/50">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">
                  Condición Laboral
                </span>
                <span className="text-sm font-bold text-slate-805">
                  {docente.condicion || "No Registrada"}
                </span>
              </div>
            </div>

            {/* Escala Magisterial */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-650 rounded-lg flex items-center justify-center shrink-0 border border-blue-105">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">
                  Escala Magisterial
                </span>
                <span className="text-sm font-bold text-slate-805">
                  {docente.escala ? (docente.escala === "Sin Escala" ? docente.escala : `Escala ${docente.escala}`) : "No Registrada"}
                </span>
              </div>
            </div>

            {/* Jornada Laboral */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-50 text-purple-650 rounded-lg flex items-center justify-center shrink-0 border border-purple-105">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">
                  Jornada Laboral
                </span>
                <span className="text-sm font-bold text-slate-805">
                  {docente.jornadaLaboral ? `${docente.jornadaLaboral} Horas` : "No Registrada"}
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-50 text-slate-655 rounded-lg flex items-center justify-center shrink-0 border border-slate-200">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">
                  Correo Electrónico
                </span>
                <a href={`mailto:${docente.correo}`} className="text-sm font-bold text-blue-600 hover:underline break-all">
                  {docente.correo}
                </a>
              </div>
            </div>

            {/* Mobile number */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">
                  Número Telefónico (Celular)
                </span>
                <a href={`tel:${docente.celular}`} className="text-sm font-bold text-slate-800 hover:text-[#D92323]">
                  +51 {docente.celular.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}
                </a>
              </div>
            </div>

            {/* Birthday & Age */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center shrink-0 border border-amber-100">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">
                  Fecha de Nacimiento
                </span>
                <span className="text-sm font-bold text-slate-805 block">
                  {formatDate(docente.fechaNacimiento)}
                </span>
                <span className="text-[11px] text-slate-500 font-mono font-medium">
                  ({age} años cumplidos)
                </span>
              </div>
            </div>
          </div>

          {/* Institutional Stamp Decorator */}
          <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                REGISTRO REGULADO POR MINEDU
              </span>
            </div>
            
            <div className="border border-red-300 rounded px-2.5 py-0.5 bg-red-50">
              <span className="text-[9px] font-bold text-[#D92323] uppercase font-mono tracking-wide">
                ACTIVO 2026
              </span>
            </div>
          </div>

        </div>

        {/* Modal Buttons */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-205 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg transition-all cursor-pointer font-bold"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Ficha
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white bg-[#D92323] hover:bg-red-650 rounded-xl font-bold cursor-pointer transition-all shadow"
          >
            Cerrar Consulta
          </button>
        </div>

      </div>
    </div>
  );
}
