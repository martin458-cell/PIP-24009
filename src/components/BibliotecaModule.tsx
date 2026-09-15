import React, { useState, useMemo } from "react";
import {
  RegistroBiblioteca,
  Docente,
  LibroStock,
  TipoRecursoBiblioteca,
  HORARIOS_BIBLIOTECA,
  OBRAS_PLAN_LECTOR_RECOMENDADAS
} from "../types";
import BibliotecaForm from "./BibliotecaForm";
import LibrosStockTab from "./LibrosStockTab";
import {
  BookOpen,
  Tablet,
  Layers,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Users,
  ChevronDown,
  Info,
  BookmarkCheck,
  Check,
  Building2,
  School,
  ExternalLink,
  ShieldCheck,
  Package,
  Library,
  Cpu,
  CheckCheck
} from "lucide-react";

interface BibliotecaModuleProps {
  registros: RegistroBiblioteca[];
  docentesList: Docente[];
  librosStock: LibroStock[];
  onSaveRegistro: (registro: RegistroBiblioteca) => Promise<void>;
  onDeleteRegistro: (id: string) => Promise<void>;
  onSaveLibroStock: (libro: LibroStock) => Promise<void>;
  onDeleteLibroStock: (id: string) => Promise<void>;
}

type TabKey = "docentes" | "libros_stock" | "tabletas" | "horario" | "plan_lector";

export default function BibliotecaModule({
  registros,
  docentesList,
  librosStock,
  onSaveRegistro,
  onDeleteRegistro,
  onSaveLibroStock,
  onDeleteLibroStock
}: BibliotecaModuleProps) {
  // Navigation Tabs - Separated to avoid confusion
  const [activeTab, setActiveTab] = useState<TabKey>("docentes");

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<RegistroBiblioteca | null>(null);

  // Filters for Tab 1 (Docentes)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<"todos" | TipoRecursoBiblioteca>("todos");
  const [filterEstado, setFilterEstado] = useState<"todos" | "devuelto" | "en_uso" | "observado">("todos");
  const [filterGrado, setFilterGrado] = useState<string>("todos");

  // Quick action status update
  const handleQuickReturn = async (reg: RegistroBiblioteca) => {
    const updated: RegistroBiblioteca = {
      ...reg,
      estadoDevolucion: "devuelto",
      fechaHoraDevolucion: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      condicionDevolucion: "Devuelto conforme y revisado en biblioteca."
    };
    await onSaveRegistro(updated);
  };

  // Loan from Stock to a teacher
  const handleLoanFromStock = (libro: LibroStock) => {
    // Switch to docentes tab and open form with pre-selected book
    setActiveTab("docentes");
    setEditingRegistro({
      id: `bib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      docenteDni: "",
      docenteNombre: "",
      fecha: new Date().toISOString().split("T")[0],
      horarioId: "1-2",
      horarioTexto: "1° y 2° Hora Pedagógica (08:00 - 09:30)",
      grado: libro.gradoSugerido.replace(" de Primaria", "") || "4°",
      seccion: "A",
      estudiantesAsistentes: 30,
      area: "Plan Lector / Comunicación",
      actividadProposito: `Lectura y comprensión de la obra: ${libro.titulo}`,
      tipoRecurso: "libro",
      librosDetalle: {
        titulos: `${libro.titulo} - ${libro.autor}`,
        cantidad: Math.min(30, libro.cantidadDisponible || 30),
        categoria: libro.categoria,
        codigoLibro: libro.codigo
      },
      modalidad: "aula",
      estadoDevolucion: "en_uso",
      observaciones: `Ejemplares solicitados del estante ${libro.ubicacion}.`,
      createdAt: new Date().toISOString()
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filtered list of teacher sessions
  const filteredRegistros = useMemo(() => {
    return registros.filter((reg) => {
      const matchesSearch =
        reg.docenteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.docenteDni.includes(searchTerm) ||
        (reg.librosDetalle?.titulos && reg.librosDetalle.titulos.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (reg.tabletasDetalle?.aplicativoRecurso && reg.tabletasDetalle.aplicativoRecurso.toLowerCase().includes(searchTerm.toLowerCase())) ||
        reg.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.actividadProposito.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTipo = filterTipo === "todos" ? true : reg.tipoRecurso === filterTipo;
      const matchesEstado = filterEstado === "todos" ? true : reg.estadoDevolucion === filterEstado;
      const matchesGrado = filterGrado === "todos" ? true : reg.grado === filterGrado;

      return matchesSearch && matchesTipo && matchesEstado && matchesGrado;
    });
  }, [registros, searchTerm, filterTipo, filterEstado, filterGrado]);

  // Key Metrics
  const metrics = useMemo(() => {
    let totalLibros = 0;
    let totalTabletas = 0;
    let totalEstudiantes = 0;
    let totalEnUso = 0;

    registros.forEach((reg) => {
      totalEstudiantes += reg.estudiantesAsistentes || 0;
      if (reg.librosDetalle?.cantidad) {
        totalLibros += reg.librosDetalle.cantidad;
      }
      if (reg.tabletasDetalle?.cantidad) {
        totalTabletas += reg.tabletasDetalle.cantidad;
      }
      if (reg.estadoDevolucion === "en_uso") {
        totalEnUso += 1;
      }
    });

    return {
      totalRegistros: registros.length,
      totalLibros,
      totalTabletas,
      totalEstudiantes,
      totalEnUso
    };
  }, [registros]);

  // Export to CSV
  const handleExportCSV = () => {
    if (registros.length === 0) return;

    const headers = [
      "ID",
      "Fecha",
      "Horario",
      "DNI Docente",
      "Docente",
      "Grado",
      "Sección",
      "N° Estudiantes",
      "Tipo Recurso",
      "Libros Prestados",
      "Tabletas Prestadas",
      "Modalidad",
      "Estado Devolución",
      "Área Curricular",
      "Actividad / Propósito",
      "Observaciones"
    ];

    const rows = registros.map((r) => [
      r.id,
      r.fecha,
      `"${r.horarioTexto}"`,
      r.docenteDni,
      `"${r.docenteNombre}"`,
      r.grado,
      r.seccion,
      r.estudiantesAsistentes,
      r.tipoRecurso,
      `"${r.librosDetalle ? `${r.librosDetalle.cantidad} ex. - ${r.librosDetalle.titulos}` : 'N/A'}"`,
      `"${r.tabletasDetalle ? `${r.tabletasDetalle.cantidad} tabletas - ${r.tabletasDetalle.aplicativoRecurso}` : 'N/A'}"`,
      r.modalidad,
      r.estadoDevolucion,
      `"${r.area}"`,
      `"${r.actividadProposito}"`,
      `"${r.observaciones}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Biblioteca_IEPM24009_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <School className="w-3.5 h-3.5" />
              <span>I.E.P.M. N° 24009 &quot;Túpac Amaru II&quot;</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-emerald-400" />
              Biblioteca Escolar & Centro de Recursos TIC
            </h1>
            
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 max-w-2xl leading-relaxed">
              Módulo organizado en pestañas independientes para facilitar el trabajo de los docentes: 
              control de atenciones, inventario de libros en base de datos, tabletas MINEDU y horarios pedagógicos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={registros.length === 0}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/20 cursor-pointer disabled:opacity-50"
              title="Descargar registro en Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("docentes");
                setEditingRegistro(null);
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black tracking-wider uppercase transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>+ Registrar Atención Docente</span>
            </button>
          </div>
        </div>

        {/* Global Summary Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Atenciones Registradas</p>
            <p className="text-2xl font-black text-white mt-0.5">{metrics.totalRegistros}</p>
            <p className="text-[10px] text-slate-400">Sesiones a profesores</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-300 flex items-center gap-1">
              <Library className="w-3 h-3" /> Libros en Stock BD
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{librosStock.length}</p>
            <p className="text-[10px] text-emerald-300">Títulos en inventario</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-blue-300 flex items-center gap-1">
              <Tablet className="w-3 h-3" /> Tabletas Prestadas
            </p>
            <p className="text-2xl font-black text-white mt-0.5">{metrics.totalTabletas}</p>
            <p className="text-[10px] text-slate-400">Equipos pedagógicos</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-purple-300 flex items-center gap-1">
              <Users className="w-3 h-3" /> Alumnos Atendidos
            </p>
            <p className="text-2xl font-black text-white mt-0.5">{metrics.totalEstudiantes}</p>
            <p className="text-[10px] text-slate-400">Estudiantes de primaria</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-amber-300 flex items-center gap-1">
              <Clock3 className="w-3 h-3" /> Préstamos Activos
            </p>
            <p className={`text-2xl font-black mt-0.5 ${metrics.totalEnUso > 0 ? "text-amber-400" : "text-white"}`}>
              {metrics.totalEnUso}
            </p>
            <p className="text-[10px] text-slate-400">Pendientes de devolución</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVEGACIÓN EN PESTAÑAS PRINCIPALES (REQUERIMIENTO: SEPARAR FUNCIONALIDADES) */}
      {/* ========================================================================= */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {/* TAB 1: REGISTRO DE DOCENTES (USO) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("docentes");
              setShowForm(false);
            }}
            className={`px-4 py-3.5 rounded-xl font-black text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center relative ${
              activeTab === "docentes"
                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/20"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-xs sm:text-sm uppercase tracking-tight">1. Docentes (Uso)</span>
            </div>
            <span className={`text-[10px] font-normal ${activeTab === "docentes" ? "text-emerald-100" : "text-slate-500"}`}>
              {registros.length} atenciones registradas
            </span>
            {metrics.totalEnUso > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-xs animate-pulse">
                {metrics.totalEnUso} en uso
              </span>
            )}
          </button>

          {/* TAB 2: LIBROS EN STOCK (BASE DE DATOS) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("libros_stock");
              setShowForm(false);
            }}
            className={`px-4 py-3.5 rounded-xl font-black text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center relative ${
              activeTab === "libros_stock"
                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/20"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs sm:text-sm uppercase tracking-tight">2. Libros en Stock (BD)</span>
            </div>
            <span className={`text-[10px] font-normal ${activeTab === "libros_stock" ? "text-emerald-100" : "text-slate-500"}`}>
              {librosStock.length} libros en inventario
            </span>
          </button>

          {/* TAB 3: TABLETAS MINEDU */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("tabletas");
              setShowForm(false);
            }}
            className={`px-4 py-3.5 rounded-xl font-black text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center relative ${
              activeTab === "tabletas"
                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/20"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Tablet className="w-4 h-4" />
              <span className="text-xs sm:text-sm uppercase tracking-tight">3. Tabletas MINEDU</span>
            </div>
            <span className={`text-[10px] font-normal ${activeTab === "tabletas" ? "text-emerald-100" : "text-slate-500"}`}>
              Maletines & Apps
            </span>
          </button>

          {/* TAB 4: HORARIOS DE ATENCIÓN */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("horario");
              setShowForm(false);
            }}
            className={`px-4 py-3.5 rounded-xl font-black text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center relative ${
              activeTab === "horario"
                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/20"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs sm:text-sm uppercase tracking-tight">4. Horarios Oficiales</span>
            </div>
            <span className={`text-[10px] font-normal ${activeTab === "horario" ? "text-emerald-100" : "text-slate-500"}`}>
              6 Bloques Mañana / Tarde
            </span>
          </button>

          {/* TAB 5: PLAN LECTOR 2026 */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("plan_lector");
              setShowForm(false);
            }}
            className={`col-span-2 md:col-span-1 px-4 py-3.5 rounded-xl font-black text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center relative ${
              activeTab === "plan_lector"
                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/20"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4" />
              <span className="text-xs sm:text-sm uppercase tracking-tight">5. Plan Lector 2026</span>
            </div>
            <span className={`text-[10px] font-normal ${activeTab === "plan_lector" ? "text-emerald-100" : "text-slate-500"}`}>
              Obras por grado
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORMULARIO DE ATENCIÓN A DOCENTES (MODAL / DESPLEGADO)                    */}
      {/* ========================================================================= */}
      {showForm && (
        <div className="bg-white rounded-3xl border-2 border-emerald-500 p-6 shadow-2xl relative animate-in fade-in duration-200">
          <BibliotecaForm
            initialData={editingRegistro}
            docentesList={docentesList}
            librosStock={librosStock}
            onSubmit={async (reg) => {
              await onSaveRegistro(reg);
              setShowForm(false);
              setEditingRegistro(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingRegistro(null);
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA PESTAÑA 1: REGISTRO DE DOCENTES QUE USAN LA BIBLIOTECA              */}
      {/* ========================================================================= */}
      {activeTab === "docentes" && (
        <div className="space-y-6">
          {/* Action and Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar docente por nombre, DNI, título de libro, tableta o propósito..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRegistro(null);
                    setShowForm(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-sm cursor-pointer flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Registrar Atención a Docente</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Filtrar por Recurso:
              </span>
              
              <button
                type="button"
                onClick={() => setFilterTipo("todos")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterTipo === "todos"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Todos ({registros.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterTipo("libro")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterTipo === "libro"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Libros Físicos</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTipo("tableta")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterTipo === "tableta"
                    ? "bg-blue-700 text-white"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tabletas MINEDU</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTipo("ambos")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterTipo === "ambos"
                    ? "bg-purple-700 text-white"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ambos</span>
              </button>

              <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block" />

              {/* Status Filter */}
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Estado:
              </span>

              <button
                type="button"
                onClick={() => setFilterEstado("todos")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterEstado === "todos"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Cualquiera
              </button>

              <button
                type="button"
                onClick={() => setFilterEstado("en_uso")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterEstado === "en_uso"
                    ? "bg-amber-500 text-slate-950 font-black"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                }`}
              >
                <Clock3 className="w-3.5 h-3.5" />
                <span>En Uso ({metrics.totalEnUso})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterEstado("devuelto")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterEstado === "devuelto"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Devuelto Conforme</span>
              </button>
            </div>
          </div>

          {/* Registros List */}
          {filteredRegistros.length > 0 ? (
            <div className="space-y-3">
              {filteredRegistros.map((reg) => {
                const isLibro = reg.tipoRecurso === "libro" || reg.tipoRecurso === "ambos";
                const isTableta = reg.tipoRecurso === "tableta" || reg.tipoRecurso === "ambos";
                const isEnUso = reg.estadoDevolucion === "en_uso";

                return (
                  <div
                    key={reg.id}
                    className={`p-5 rounded-2xl border transition-all bg-white shadow-xs hover:shadow-md ${
                      isEnUso
                        ? "border-amber-300 bg-amber-50/20"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Main Details */}
                      <div className="space-y-2 flex-1">
                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {reg.fecha}
                          </span>

                          <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-900 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-emerald-700" />
                            {reg.horarioTexto}
                          </span>

                          {/* Recurso Badge */}
                          {reg.tipoRecurso === "libro" && (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <BookOpen className="w-3 h-3 text-emerald-600" />
                              Libros Físicos
                            </span>
                          )}

                          {reg.tipoRecurso === "tableta" && (
                            <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              <Tablet className="w-3 h-3 text-blue-600" />
                              Tabletas MINEDU
                            </span>
                          )}

                          {reg.tipoRecurso === "ambos" && (
                            <span className="inline-flex items-center gap-1 font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                              <Layers className="w-3 h-3 text-purple-600" />
                              Híbrido (Libro + Tabletas)
                            </span>
                          )}

                          {/* Estado Devolución Badge */}
                          {reg.estadoDevolucion === "devuelto" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Devuelto Conforme
                            </span>
                          )}

                          {reg.estadoDevolucion === "en_uso" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock3 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                              En Uso Activo
                            </span>
                          )}

                          {reg.estadoDevolucion === "observado" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-900 border border-red-300">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                              Con Observación
                            </span>
                          )}
                        </div>

                        {/* Docente and Class Info */}
                        <div className="flex flex-wrap items-baseline gap-2 pt-1">
                          <h3 className="text-base font-black text-slate-900">
                            {reg.docenteNombre}
                          </h3>
                          <span className="text-xs font-mono text-slate-500">
                            (DNI: {reg.docenteDni})
                          </span>
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            Grado: {reg.grado} &quot;{reg.seccion}&quot;
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            • {reg.estudiantesAsistentes} estudiantes
                          </span>
                          <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            {reg.area}
                          </span>
                        </div>

                        {/* Resource specific content */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                          {isLibro && reg.librosDetalle && (
                            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                              <p className="text-[10px] font-bold text-emerald-900 uppercase">
                                Material Bibliográfico ({reg.librosDetalle.cantidad} ejemplares):
                              </p>
                              <p className="font-bold text-emerald-950 mt-0.5">
                                {reg.librosDetalle.titulos}
                              </p>
                              {reg.librosDetalle.categoria && (
                                <p className="text-[10px] text-emerald-800">
                                  Categoría: {reg.librosDetalle.categoria}
                                </p>
                              )}
                            </div>
                          )}

                          {isTableta && reg.tabletasDetalle && (
                            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
                              <p className="text-[10px] font-bold text-blue-900 uppercase">
                                Tabletas ({reg.tabletasDetalle.cantidad} equipos):
                              </p>
                              <p className="font-bold text-blue-950 mt-0.5">
                                {reg.tabletasDetalle.aplicativoRecurso}
                              </p>
                              <p className="text-[10px] text-blue-800">
                                {reg.tabletasDetalle.loteMaletin}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Purpose & Observaciones */}
                        <div className="text-xs text-slate-600 space-y-1 pt-1">
                          <p>
                            <strong className="text-slate-800">Propósito:</strong> {reg.actividadProposito}
                          </p>
                          {reg.observaciones && (
                            <p className="text-slate-500 italic">
                              <strong className="text-slate-700 not-italic">Observaciones:</strong> {reg.observaciones}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex sm:flex-row lg:flex-col items-center sm:items-end justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {isEnUso && (
                          <button
                            type="button"
                            onClick={() => handleQuickReturn(reg)}
                            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            title="Confirmar recepción de material devuelto"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Marcar Devuelto</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRegistro(reg);
                              setShowForm(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar registro"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`¿Está seguro de eliminar el registro de biblioteca de ${reg.docenteNombre}?`)) {
                                await onDeleteRegistro(reg.id);
                              }
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No se encontraron registros de docentes</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No hay préstamos ni atenciones registradas que coincidan con la búsqueda actual.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingRegistro(null);
                  setShowForm(true);
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Atención a Docente</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA PESTAÑA 2: REGISTRO DE LIBROS EN STOCK (BASE DE DATOS FIRESTORE)    */}
      {/* ========================================================================= */}
      {activeTab === "libros_stock" && (
        <LibrosStockTab
          libros={librosStock}
          onSaveLibro={onSaveLibroStock}
          onDeleteLibro={onDeleteLibroStock}
          onSelectForLoan={handleLoanFromStock}
        />
      )}

      {/* ========================================================================= */}
      {/* VISTA PESTAÑA 3: TABLETAS Y MALETINES MINEDU                             */}
      {/* ========================================================================= */}
      {activeTab === "tabletas" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider mb-2">
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tecnología Educativa MINEDU</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Maletines & Tabletas Pedagógicas
                </h2>
                <p className="text-sm text-blue-100/80 mt-1 max-w-2xl">
                  Dotación de 80 tabletas Lenovo Tab M10 distribuidas en maletines institucionales para uso pedagógico en aulas y salas de innovación.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("docentes");
                  setEditingRegistro({
                    id: `bib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    docenteDni: "",
                    docenteNombre: "",
                    fecha: new Date().toISOString().split("T")[0],
                    horarioId: "1-2",
                    horarioTexto: "1° y 2° Hora Pedagógica (08:00 - 09:30)",
                    grado: "4°",
                    seccion: "A",
                    estudiantesAsistentes: 25,
                    area: "Ciencia y Tecnología",
                    actividadProposito: "Uso pedagógico de aplicativo en tabletas MINEDU",
                    tipoRecurso: "tableta",
                    tabletasDetalle: {
                      cantidad: 25,
                      loteMaletin: "Maletín A (Tabletas 1 al 25)",
                      aplicativoRecurso: "PerúEduca / Khan Academy"
                    },
                    modalidad: "aula",
                    estadoDevolucion: "en_uso",
                    observaciones: "Maletín completo con cargadores y candado.",
                    createdAt: new Date().toISOString()
                  });
                  setShowForm(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-sm transition-all cursor-pointer shadow-lg flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Prestar Maletín a Docente</span>
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-xs text-blue-200 font-medium">Dotación Total</span>
                <div className="text-2xl font-black text-white mt-0.5">80</div>
                <span className="text-[10px] text-blue-300">Tabletas operativas</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-xs text-blue-200 font-medium">Maletines Activos</span>
                <div className="text-2xl font-black text-blue-400 mt-0.5">3 Lotes</div>
                <span className="text-[10px] text-blue-300">Maletines A, B y C</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-xs text-blue-200 font-medium">En Préstamo Hoy</span>
                <div className="text-2xl font-black text-amber-300 mt-0.5">{metrics.totalTabletas}</div>
                <span className="text-[10px] text-amber-200">Equipos en aulas</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-xs text-blue-200 font-medium">Disponibles en Armario</span>
                <div className="text-2xl font-black text-emerald-300 mt-0.5">{Math.max(0, 80 - metrics.totalTabletas)}</div>
                <span className="text-[10px] text-emerald-200">En carga y resguardo</span>
              </div>
            </div>
          </div>

          {/* Kits Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-black">
                  Maletín A
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  25 Tabletas
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Tabletas 01 al 25 (Turno Primaria)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Asignadas preferentemente para 1°, 2° y 3° de primaria con aplicativos lúdicos y fonéticos.
              </p>
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 space-y-1">
                <p><strong>Apps:</strong> Scratch Jr, Oráculo Matemágico, Duolingo, PerúEduca.</p>
                <p><strong>Accesorios:</strong> 25 auriculares infantiles + 1 cargador múltiple 10 puertos.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-black">
                  Maletín B
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  25 Tabletas
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Tabletas 26 al 50 (Turno Primaria)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Asignadas preferentemente para 4°, 5° y 6° grado para indagación científica y comprensión lectora.
              </p>
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 space-y-1">
                <p><strong>Apps:</strong> Khan Academy, Geogebra, Diccionario Quechua, Wikipedia Offline.</p>
                <p><strong>Accesorios:</strong> Carro de carga móvil con llave y protectores de silicona.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 text-xs font-black">
                  Maletín C
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  30 Tabletas
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Tabletas 51 al 80 (Sala y Reemplazo)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Uso en sala de lectura de biblioteca y módulo de autoaprendizaje pedagógico.
              </p>
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 space-y-1">
                <p><strong>Apps:</strong> Biblioteca Digital MINEDU, Cuadernos de Trabajo Digitales.</p>
                <p><strong>Accesorios:</strong> Estación fija en biblioteca con conexión a panel solar de respaldo.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA PESTAÑA 4: HORARIOS OFICIALES DE ATENCIÓN DE BIBLIOTECA             */}
      {/* ========================================================================= */}
      {activeTab === "horario" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Horario Pedagógico Institucional de Biblioteca & Tabletas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Organización de turnos pedagógicos y franjas de atención en la I.E.P.M. N° 24009 Túpac Amaru II.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              Año Escolar 2026
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {HORARIOS_BIBLIOTECA.map((horario) => {
              const matchedRecords = registros.filter((r) => r.horarioId === horario.value);

              return (
                <div
                  key={horario.value}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between hover:bg-white hover:border-emerald-300 transition-all shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-900">
                        {horario.bloque}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                        {horario.rango}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2">
                      {horario.value === "recreo"
                        ? "Horario para fomento de lectura libre en sala y recreos dinámicos."
                        : "Turno regular para sesiones pedagógicas o préstamo de libros/tabletas."}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Docentes atendidos en este bloque ({matchedRecords.length}):
                      </p>
                      {matchedRecords.length > 0 ? (
                        <div className="space-y-1.5">
                          {matchedRecords.slice(0, 3).map((m) => (
                            <div
                              key={m.id}
                              className="p-2 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between"
                            >
                              <div>
                                <p className="font-bold text-slate-800 truncate max-w-[170px]">{m.docenteNombre}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {m.grado} &quot;{m.seccion}&quot; • {m.fecha}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {m.tipoRecurso}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Sin atenciones registradas en este bloque</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("docentes");
                        setEditingRegistro(null);
                        setShowForm(true);
                      }}
                      className="w-full py-1.5 rounded-lg border border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Registrar Docente en este Horario
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA PESTAÑA 5: PLAN LECTOR INSTITUCIONAL 2026                           */}
      {/* ========================================================================= */}
      {activeTab === "plan_lector" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Catálogo de Obras Recomendadas - Plan Lector Institucional 2026
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Acervo de libros físicos y literatura escolar recomendada para cada grado de educación primaria.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              MINEDU & Literatura Peruana
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OBRAS_PLAN_LECTOR_RECOMENDADAS.map((obra) => (
              <div
                key={obra.titulo}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {obra.gradoRecomendado} Primaria
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {obra.categoria}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 mt-2">
                    {obra.titulo}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Autor: <strong>{obra.autor}</strong>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Disponible en biblioteca
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("docentes");
                      setEditingRegistro({
                        id: `bib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        docenteDni: "",
                        docenteNombre: "",
                        fecha: new Date().toISOString().split("T")[0],
                        horarioId: "1-2",
                        horarioTexto: "1° y 2° Hora Pedagógica (08:00 - 09:30)",
                        grado: obra.gradoRecomendado,
                        seccion: "A",
                        estudiantesAsistentes: 30,
                        area: "Plan Lector / Comunicación",
                        actividadProposito: `Plan Lector: Lectura comentada de ${obra.titulo}`,
                        tipoRecurso: "libro",
                        librosDetalle: {
                          titulos: `${obra.titulo} - ${obra.autor}`,
                          cantidad: 30,
                          categoria: obra.categoria
                        },
                        obraPlanLector: obra.titulo,
                        modalidad: "aula",
                        estadoDevolucion: "en_uso",
                        observaciones: "Entrega de colección oficial Plan Lector.",
                        createdAt: new Date().toISOString()
                      });
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Prestar Obra</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
