import { useState, useEffect } from "react";
import { School, Search, Clock, Menu, X, ShieldCheck, LogOut, User } from "lucide-react";
import { SCHOOL_LOGO_PATH } from "../assets/schoolLogo";
import { AuthUser } from "../types";

interface TopNavbarProps {
  totalDocentes: number;
  totalAip: number;
  onOpenGlobalSearch: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  activeModuleName: string;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenSecurityModal: () => void;
}

export default function TopNavbar({
  totalDocentes,
  totalAip,
  onOpenGlobalSearch,
  onToggleSidebar,
  isSidebarOpen,
  activeModuleName,
  currentUser,
  onLogout,
  onOpenSecurityModal
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
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-2">
            <button
              type="button"
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-150 border border-slate-200/80 text-xs text-slate-500 transition-all cursor-pointer group shadow-inner"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-[#D92323] transition-colors" />
                <span className="font-medium text-slate-600 truncate">Buscar docente, DNI...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-500 shadow-xs">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right: Live Clock, User Profile, Security & Logout */}
          <div className="flex items-center gap-2">
            
            {/* Live System Time */}
            <div className="hidden xl:flex flex-col items-end text-right px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-[11px] font-black font-mono text-slate-800">
                <Clock className="w-3.5 h-3.5 text-[#D92323]" />
                <span>{timeString || "00:00:00"}</span>
              </div>
              <span className="text-[9px] text-slate-500 capitalize font-medium">
                {dateString}
              </span>
            </div>

            {/* Security Config Button */}
            <button
              type="button"
              onClick={onOpenSecurityModal}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer relative group"
              title="Control de Seguridad y Acceso Institucional"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="sr-only">Seguridad</span>
            </button>

            {/* Authenticated User Badge */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 max-w-[160px] sm:max-w-[200px]">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName}
                      className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-black flex items-center justify-center shrink-0">
                      {currentUser.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                      {currentUser.displayName}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider font-mono px-1 rounded ${
                        currentUser.role === "admin" 
                          ? "bg-red-100 text-red-700" 
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {currentUser.role === "admin" ? "Admin PIP" : "Docente"}
                      </span>
                      {currentUser.dni && (
                        <span className="text-[9px] text-slate-400 font-mono hidden sm:inline">
                          DNI {currentUser.dni}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all cursor-pointer"
                  title="Cerrar Sesión Institucional"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}

