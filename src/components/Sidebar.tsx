import React from "react";
import { 
  LayoutDashboard, 
  Monitor, 
  Users, 
  BarChart3, 
  FileText, 
  Boxes, 
  PlusCircle, 
  BookOpen, 
  Upload, 
  Calendar, 
  ShieldCheck, 
  ChevronRight,
  Database,
  ExternalLink,
  Plus,
  FileSpreadsheet,
  Sparkles
} from "lucide-react";
import { SystemModule, ActiveTabType } from "../types";
import { SCHOOL_LOGO_PATH } from "../assets/schoolLogo";

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  activeTab: ActiveTabType;
  onChangeTab: (tab: ActiveTabType) => void;
  docenteSubTab: "directorio" | "registro" | "excel";
  onChangeDocenteSubTab: (sub: "directorio" | "registro" | "excel") => void;
  aipSubTab: "historial" | "registro";
  onChangeAipSubTab: (sub: "historial" | "registro") => void;
  totalDocentes: number;
  totalAip: number;
  modules: SystemModule[];
  onOpenNewDocente: () => void;
  onOpenNewAip: () => void;
  onOpenPdfReport: () => void;
}

export default function Sidebar({
  isOpen,
  onCloseMobile,
  activeTab,
  onChangeTab,
  docenteSubTab,
  onChangeDocenteSubTab,
  aipSubTab,
  onChangeAipSubTab,
  totalDocentes,
  totalAip,
  modules,
  onOpenNewDocente,
  onOpenNewAip,
  onOpenPdfReport
}: SidebarProps) {
  // Map icons for dynamic rendering
  const getModuleIcon = (iconName: string, isCurrent: boolean) => {
    const className = `w-4 h-4 shrink-0 ${isCurrent ? "text-white" : "text-slate-500 group-hover:text-slate-900"}`;
    switch (iconName) {
      case "LayoutDashboard":
        return <LayoutDashboard className={className} />;
      case "Monitor":
        return <Monitor className={className} />;
      case "Users":
        return <Users className={className} />;
      case "BarChart3":
        return <BarChart3 className={className} />;
      case "FileText":
        return <FileText className={className} />;
      case "FileSpreadsheet":
      case "FileEdit":
      case "BookOpen":
        return <FileSpreadsheet className={className} />;
      case "CalendarCheck":
      case "Calendar":
        return <Calendar className={className} />;
      case "Boxes":
        return <Boxes className={className} />;
      default:
        return <Boxes className={className} />;
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        id="contenedor-modulos-portal"
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-300 ease-in-out lg:sticky lg:top-[76px] lg:self-start lg:h-[calc(100vh-92px)] lg:max-h-[calc(100vh-92px)] lg:rounded-2xl lg:border lg:border-slate-200/90 lg:shadow-sm lg:overflow-hidden ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:shadow-sm"
        }`}
      >
        {/* Sidebar Header Brand */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-11 rounded-lg bg-slate-50 border border-slate-200 p-0.5 flex items-center justify-center shadow-xs shrink-0">
              <img src={SCHOOL_LOGO_PATH} alt="Insignia 24009" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-slate-900 tracking-wider">
                MÓDULOS DEL PORTAL
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                IEPM N° 24009 Puquio
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
            v3.2
          </span>
        </div>

        {/* Quick Action Buttons Row */}
        <div className="px-3 pt-3 pb-2 grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onOpenNewAip();
              if (window.innerWidth < 1024) onCloseMobile();
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#D92323] border border-red-200/80 text-[11px] font-bold transition-all cursor-pointer truncate shadow-2xs"
            title="Registrar nueva sesión en el AIP"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">+ Sesión AIP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenNewDocente();
              if (window.innerWidth < 1024) onCloseMobile();
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-[11px] font-bold transition-all cursor-pointer truncate shadow-2xs"
            title="Registrar nuevo docente en el directorio"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">+ Docente</span>
          </button>
        </div>

        {/* Module Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar min-h-0">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-3 pt-2 pb-1 font-mono">
            Sectores Operativos
          </p>

          {modules.map((mod) => {
            const isCurrent = activeTab === mod.routeTab;

            return (
              <div key={mod.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onChangeTab(mod.routeTab);
                    if (window.innerWidth < 1024 && (mod.routeTab === "dashboard" || mod.routeTab === "metricas" || mod.routeTab === "reportes" || mod.routeTab === "informe-mensual")) {
                      onCloseMobile();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group text-left ${
                    isCurrent
                      ? "bg-[#0B1E36] text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isCurrent ? "bg-white/10" : "bg-slate-100 group-hover:bg-slate-200/60"
                      }`}
                    >
                      {getModuleIcon(mod.iconName, isCurrent)}
                    </div>
                    <div className="truncate">
                      <p className="truncate font-black">{mod.name}</p>
                      <p className={`text-[9px] font-mono ${isCurrent ? "text-slate-300" : "text-slate-400"}`}>
                        {mod.code} • {mod.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {mod.routeTab === "docentes" && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          isCurrent ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {totalDocentes}
                      </span>
                    )}
                    {mod.routeTab === "aip" && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          isCurrent ? "bg-white/20 text-white" : "bg-red-100 text-[#D92323]"
                        }`}
                      >
                        {totalAip}
                      </span>
                    )}
                    {mod.badge && !["docentes", "aip"].includes(mod.routeTab) && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isCurrent ? "bg-amber-400 text-slate-950" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {mod.badge}
                      </span>
                    )}
                  </div>
                </button>

                {/* Sub-sector Links if AIP is active */}
                {mod.routeTab === "aip" && isCurrent && (
                  <div className="pl-9 pr-1 py-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        onChangeAipSubTab("historial");
                        if (window.innerWidth < 1024) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        aipSubTab === "historial"
                          ? "text-[#D92323] bg-red-50/80 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span>• Libro Diario (Historial)</span>
                      <span className="text-[10px] text-slate-400 font-mono">{totalAip}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenNewAip();
                        if (window.innerWidth < 1024) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        aipSubTab === "registro"
                          ? "text-[#D92323] bg-red-50/80 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span>• Registrar Nueva Visita</span>
                      <Plus className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPdfReport();
                        if (window.innerWidth < 1024) onCloseMobile();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-purple-700 hover:bg-purple-50 transition-all cursor-pointer"
                    >
                      <span>• Exportar PDF Oficial</span>
                      <FileText className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Sub-sector Links if Docentes is active */}
                {mod.routeTab === "docentes" && isCurrent && (
                  <div className="pl-9 pr-1 py-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        onChangeDocenteSubTab("directorio");
                        if (window.innerWidth < 1024) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        docenteSubTab === "directorio"
                          ? "text-blue-700 bg-blue-50/80 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span>• Directorio Institucional</span>
                      <span className="text-[10px] text-slate-400 font-mono">{totalDocentes}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenNewDocente();
                        if (window.innerWidth < 1024) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        docenteSubTab === "registro"
                          ? "text-blue-700 bg-blue-50/80 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span>• Registrar Docente</span>
                      <Plus className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChangeDocenteSubTab("excel");
                        if (window.innerWidth < 1024) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        docenteSubTab === "excel"
                          ? "text-blue-700 bg-blue-50/80 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span>• Carga Masiva (Excel)</span>
                      <Upload className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Institutional Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                Firebase Cloud DB
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Base de datos activa con respaldo en la nube y persistencia en tiempo real.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
