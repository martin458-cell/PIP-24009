import { useState, useEffect } from "react";
import { School, Search, Clock, Menu, X } from "lucide-react";
import { SCHOOL_LOGO_PATH } from "../assets/schoolLogo";

interface TopNavbarProps {
  totalDocentes: number;
  totalAip: number;
  onOpenGlobalSearch: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  activeModuleName: string;
}

export default function TopNavbar({
  totalDocentes,
  totalAip,
  onOpenGlobalSearch,
  onToggleSidebar,
  isSidebarOpen,
  activeModuleName
}: TopNavbarProps) {
  const [timeString, setTimeString] = useState<string>("");
  const [dateString, setDateString] = useState<string>("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
      setDateString(
        now.toLocaleDateString("es-PE", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      {/* Top Peruvian Institutional Stripe */}
      <div className="h-1 w-full flex">
        <div className="w-[18%] bg-[#D92323] h-full"></div>
        <div className="w-[64%] bg-white h-full border-y border-slate-200/50"></div>
        <div className="w-[18%] bg-[#D92323] h-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Mobile Toggle & Institution Branding */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              aria-label="Abrir menú de módulos"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-11 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
                <img src={SCHOOL_LOGO_PATH} alt="Insignia 24009" className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#D92323] text-white font-mono">
                    I.E.P.M. 24009
                  </span>
                  <span className="hidden sm:inline-block text-[10px] text-slate-500 font-mono font-bold">
                    CÓD. 0361493
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                  TÚPAC AMARU II <span className="text-slate-400 font-normal hidden md:inline">| Portal de Gestión</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Center: Global Instant Search Trigger */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              type="button"
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-150 border border-slate-200/80 text-xs text-slate-500 transition-all cursor-pointer group shadow-inner"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-[#D92323] transition-colors" />
                <span className="font-medium text-slate-600">Buscar docente, DNI, área o sesión...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-500 shadow-xs">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right: Live Clock, Sync Badge & Module Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Mobile Search Icon */}
            <button
              type="button"
              onClick={onOpenGlobalSearch}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              title="Buscar en todo el sistema"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Live System Time */}
            <div className="hidden sm:flex flex-col items-end text-right px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-[11px] font-black font-mono text-slate-800">
                <Clock className="w-3.5 h-3.5 text-[#D92323]" />
                <span>{timeString || "00:00:00"}</span>
              </div>
              <span className="text-[9px] text-slate-500 capitalize font-medium">
                {dateString}
              </span>
            </div>

            {/* Cloud Sync Status */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Firestore Sync</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
