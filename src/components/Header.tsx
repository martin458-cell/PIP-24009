import { School, UserCheck, Award, Flag } from "lucide-react";

interface HeaderProps {
  totalDocentes: number;
  totalAip?: number;
}

export default function Header({ totalDocentes, totalAip = 0 }: HeaderProps) {
  return (
    <header className="relative w-full bg-white text-slate-950 border-b border-slate-200/80 shadow-md overflow-hidden">
      {/* Peruvian Flag Top Stripe Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 flex">
        <div className="w-[15%] bg-[#D92323] h-full"></div>
        <div className="w-[70%] bg-white h-full"></div>
        <div className="w-[15%] bg-[#D92323] h-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          
          {/* Logo & Institution Details */}
          <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-left">
            <div className="relative group">
              {/* Shield/Emblem Wrapper with light glow */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#0B1E36] rounded-2xl flex items-center justify-center shadow-md border border-slate-200 p-1.5 transition-all duration-300 group-hover:scale-105">
                <div className="w-full h-full bg-[#0B1E36] rounded-xl flex flex-col items-center justify-center text-white relative">
                  <School className="w-8 h-8 sm:w-10 sm:h-10 text-[#D92323]" />
                  <span className="text-[7px] font-bold tracking-widest absolute bottom-2 font-mono">24009</span>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#D92323] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow">
                PE
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="bg-[#D92323] text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider font-mono">
                  Institución Educativa Pública
                </span>
                <span className="text-slate-600 text-xs font-mono font-bold">CÓDIGO MODULAR: 0361493</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 text-slate-900">
                IEPM N° 24009 <span className="text-[#D92323] inline-block">TÚPAC AMARU II</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                Plataforma de Control de Personal Escolar y Auditoría AIP
              </p>
            </div>
          </div>

          {/* Quick Statistics Mini-Badge with glass look */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl self-stretch md:self-auto justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D92323]/10 rounded-xl flex items-center justify-center border border-[#D92323]/20 shadow-sm">
                <UserCheck className="w-5 h-5 text-[#D92323]" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-mono tracking-widest font-semibold">Docentes</p>
                <p className="text-sm font-extrabold font-sans text-slate-800">{totalDocentes} Registrados</p>
              </div>
            </div>
            
            <div className="hidden sm:block h-8 w-px bg-slate-200 mx-1"></div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                <Flag className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-mono tracking-widest font-semibold">Sesiones AIP</p>
                <p className="text-sm font-extrabold font-sans text-slate-800">{totalAip} Registradas</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </header>
  );
}
