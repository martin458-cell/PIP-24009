import React, { useState, useMemo } from "react";
import { LibroStock, EstadoFisicoLibro, CATEGORIAS_LIBROS_BIBLIOTECA, GRADOS_LIST } from "../types";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Sparkles, 
  BookmarkCheck, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Building2, 
  FileSpreadsheet,
  X,
  Save,
  Check,
  RefreshCw,
  Library
} from "lucide-react";

interface LibrosStockTabProps {
  libros: LibroStock[];
  onSaveLibro: (libro: LibroStock) => Promise<void>;
  onDeleteLibro: (id: string) => Promise<void>;
  onSelectForLoan?: (libro: LibroStock) => void;
}

export default function LibrosStockTab({
  libros,
  onSaveLibro,
  onDeleteLibro,
  onSelectForLoan
}: LibrosStockTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todas");
  const [selectedGrado, setSelectedGrado] = useState<string>("todos");
  const [selectedEstado, setSelectedEstado] = useState<string>("todos");
  const [onlyPlanLector, setOnlyPlanLector] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLibro, setEditingLibro] = useState<LibroStock | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields State
  const [formCodigo, setFormCodigo] = useState("");
  const [formTitulo, setFormTitulo] = useState("");
  const [formAutor, setFormAutor] = useState("");
  const [formEditorial, setFormEditorial] = useState("");
  const [formCategoria, setFormCategoria] = useState(CATEGORIAS_LIBROS_BIBLIOTECA[0]);
  const [formGrado, setFormGrado] = useState("Todos los grados");
  const [formCantidadTotal, setFormCantidadTotal] = useState<number>(30);
  const [formCantidadDisponible, setFormCantidadDisponible] = useState<number>(30);
  const [formUbicacion, setFormUbicacion] = useState("Estante A - Nivel 1");
  const [formEstadoFisico, setFormEstadoFisico] = useState<EstadoFisicoLibro>("Bueno");
  const [formEsPlanLector, setFormEsPlanLector] = useState(true);
  const [formIsbn, setFormIsbn] = useState("");
  const [formObservaciones, setFormObservaciones] = useState("");
  const [formError, setFormError] = useState("");

  // Open modal for new book
  const handleOpenNew = () => {
    setEditingLibro(null);
    const nextNum = (libros.length + 1).toString().padStart(3, "0");
    setFormCodigo(`LIB-LIT-${nextNum}`);
    setFormTitulo("");
    setFormAutor("");
    setFormEditorial("MINEDU / Editorial Escolar");
    setFormCategoria(CATEGORIAS_LIBROS_BIBLIOTECA[0]);
    setFormGrado("4°");
    setFormCantidadTotal(30);
    setFormCantidadDisponible(30);
    setFormUbicacion("Estante A - Nivel 2");
    setFormEstadoFisico("Bueno");
    setFormEsPlanLector(true);
    setFormIsbn("");
    setFormObservaciones("");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (libro: LibroStock) => {
    setEditingLibro(libro);
    setFormCodigo(libro.codigo);
    setFormTitulo(libro.titulo);
    setFormAutor(libro.autor);
    setFormEditorial(libro.editorial || "");
    setFormCategoria(libro.categoria);
    setFormGrado(libro.gradoSugerido);
    setFormCantidadTotal(libro.cantidadTotal);
    setFormCantidadDisponible(libro.cantidadDisponible);
    setFormUbicacion(libro.ubicacion);
    setFormEstadoFisico(libro.estadoFisico);
    setFormEsPlanLector(!!libro.esPlanLector);
    setFormIsbn(libro.isbn || "");
    setFormObservaciones(libro.observaciones || "");
    setFormError("");
    setIsModalOpen(true);
  };

  // Handle submit
  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      setFormError("El título de la obra o libro es obligatorio.");
      return;
    }
    if (!formAutor.trim()) {
      setFormError("El autor o entidad editorial es obligatorio.");
      return;
    }
    if (!formCodigo.trim()) {
      setFormError("El código o signatura topográfica es obligatorio.");
      return;
    }
    if (formCantidadTotal < 1) {
      setFormError("La cantidad en stock debe ser de al menos 1 ejemplar.");
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");

      const libroToSave: LibroStock = {
        id: editingLibro ? editingLibro.id : `lib-stock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        codigo: formCodigo.trim().toUpperCase(),
        titulo: formTitulo.trim(),
        autor: formAutor.trim(),
        editorial: formEditorial.trim() || undefined,
        categoria: formCategoria,
        gradoSugerido: formGrado,
        cantidadTotal: Number(formCantidadTotal),
        cantidadDisponible: Number(formCantidadDisponible),
        ubicacion: formUbicacion.trim() || "Estante General",
        estadoFisico: formEstadoFisico,
        esPlanLector: formEsPlanLector,
        isbn: formIsbn.trim() || undefined,
        observaciones: formObservaciones.trim() || undefined,
        createdAt: editingLibro ? editingLibro.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSaveLibro(libroToSave);
      setIsModalOpen(false);
    } catch (err) {
      setFormError(`Error al guardar en la base de datos: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async (id: string) => {
    try {
      setIsDeleting(true);
      await onDeleteLibro(id);
      setDeletingId(null);
    } catch (err) {
      alert(`Error al eliminar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered books
  const filteredLibros = useMemo(() => {
    return libros.filter((lib) => {
      const matchesSearch =
        lib.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lib.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lib.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lib.editorial && lib.editorial.toLowerCase().includes(searchTerm.toLowerCase())) ||
        lib.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategoria === "todas" ? true : lib.categoria === selectedCategoria;
      const matchesGrado = selectedGrado === "todos" ? true : lib.gradoSugerido === selectedGrado;
      const matchesEstado = selectedEstado === "todos" ? true : lib.estadoFisico === selectedEstado;
      const matchesPlan = onlyPlanLector ? lib.esPlanLector === true : true;

      return matchesSearch && matchesCat && matchesGrado && matchesEstado && matchesPlan;
    });
  }, [libros, searchTerm, selectedCategoria, selectedGrado, selectedEstado, onlyPlanLector]);

  // Inventory Metrics
  const stats = useMemo(() => {
    let totalTitulos = libros.length;
    let totalEjemplares = 0;
    let totalDisponibles = 0;
    let totalPlanLector = 0;

    libros.forEach((b) => {
      totalEjemplares += b.cantidadTotal || 0;
      totalDisponibles += b.cantidadDisponible || 0;
      if (b.esPlanLector) totalPlanLector++;
    });

    const enPrestamo = Math.max(0, totalEjemplares - totalDisponibles);

    return {
      totalTitulos,
      totalEjemplares,
      totalDisponibles,
      enPrestamo,
      totalPlanLector
    };
  }, [libros]);

  return (
    <div className="space-y-6">
      {/* Header Banner for Stock Tab */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Library className="w-3.5 h-3.5" />
              <span>Base de Datos de Libros Físicos</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Inventario & Stock de la Biblioteca Escolar
            </h2>
            <p className="text-sm text-emerald-100/80 mt-1 max-w-2xl">
              Registro centralizado de títulos, códigos patrimoniales, estantería y ejemplares disponibles en la I.E.P.M. N° 24009 Túpac Amaru II.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleOpenNew}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Registrar Nuevo Libro en Stock</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-200 font-medium">Títulos en Base de Datos</span>
            <div className="text-2xl font-black text-white mt-0.5">{stats.totalTitulos}</div>
            <span className="text-[10px] text-emerald-300">Obras registradas</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-200 font-medium">Ejemplares en Stock</span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{stats.totalEjemplares}</div>
            <span className="text-[10px] text-emerald-300">Volúmenes físicos</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-200 font-medium">Disponibles en Sala</span>
            <div className="text-2xl font-black text-teal-300 mt-0.5">{stats.totalDisponibles}</div>
            <span className="text-[10px] text-emerald-300">Listos para préstamo</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-200 font-medium">Colección Plan Lector</span>
            <div className="text-2xl font-black text-amber-300 mt-0.5">{stats.totalPlanLector}</div>
            <span className="text-[10px] text-amber-200">Para fomento lector</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, autor, código (ej: LIT-VAL), editorial o estante..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 transition-all text-slate-800"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setOnlyPlanLector(!onlyPlanLector)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                onlyPlanLector
                  ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Solo Plan Lector ({stats.totalPlanLector})</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Categoría / Género
            </label>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="todas">Todas las categorías ({libros.length})</option>
              {CATEGORIAS_LIBROS_BIBLIOTECA.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Grado Sugerido
            </label>
            <select
              value={selectedGrado}
              onChange={(e) => setSelectedGrado(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="todos">Todos los grados</option>
              <option value="1°">1° de Primaria</option>
              <option value="2°">2° de Primaria</option>
              <option value="3°">3° de Primaria</option>
              <option value="4°">4° de Primaria</option>
              <option value="5°">5° de Primaria</option>
              <option value="6°">6° de Primaria</option>
              <option value="Todos los grados">Todos los grados (General)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Estado Físico
            </label>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="todos">Cualquier estado</option>
              <option value="Excelente">Excelente</option>
              <option value="Bueno">Bueno</option>
              <option value="Regular">Regular</option>
              <option value="En reparación">En reparación</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-black text-slate-800">
              Catálogo de Libros Físicos ({filteredLibros.length} resultados)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Sincronizado en tiempo real con Firestore
          </span>
        </div>

        {filteredLibros.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-8 h-8 opacity-70" />
            </div>
            <h4 className="text-base font-black text-slate-800 mb-1">No se encontraron libros</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              {searchTerm || selectedCategoria !== "todas"
                ? "No hay libros que coincidan con los filtros de búsqueda seleccionados."
                : "Aún no se han registrado libros en la base de datos de la biblioteca escolar."}
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Libro en Stock</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <th className="py-3 px-4">Código / Obra</th>
                  <th className="py-3 px-4">Autor & Editorial</th>
                  <th className="py-3 px-4">Categoría & Grado</th>
                  <th className="py-3 px-4 text-center">Stock Total</th>
                  <th className="py-3 px-4 text-center">Disponibles</th>
                  <th className="py-3 px-4">Ubicación</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredLibros.map((libro) => {
                  return (
                    <tr key={libro.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 inline-block mb-1">
                          {libro.codigo}
                        </div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{libro.titulo}</span>
                          {libro.esPlanLector && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                              Plan Lector
                            </span>
                          )}
                        </div>
                        {libro.isbn && (
                          <div className="text-[10px] text-slate-400 font-mono">ISBN: {libro.isbn}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{libro.autor}</div>
                        <div className="text-[11px] text-slate-500">{libro.editorial || "MINEDU / Escolar"}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{libro.categoria}</div>
                        <div className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {libro.gradoSugerido}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {libro.cantidadTotal}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${
                            libro.cantidadDisponible > 5
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : libro.cantidadDisponible > 0
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {libro.cantidadDisponible} disp.
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{libro.ubicacion}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            libro.estadoFisico === "Excelente"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : libro.estadoFisico === "Bueno"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : libro.estadoFisico === "Regular"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {libro.estadoFisico}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSelectForLoan && (
                            <button
                              type="button"
                              onClick={() => onSelectForLoan(libro)}
                              title="Prestar este libro a un docente"
                              className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-600 text-emerald-900 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Prestar</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(libro)}
                            title="Editar ficha en stock"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(libro.id)}
                            title="Eliminar de la base de datos"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">
              ¿Eliminar libro de la base de datos?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Esta acción eliminará el registro de inventario de forma permanente de Firestore. Los registros históricos de préstamos no se borrarán.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConfirm(deletingId)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar de BD"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingLibro ? "Editar Libro en Stock" : "Registrar Nuevo Libro en Stock"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Se guardará en la base de datos oficial de la biblioteca escolar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código / Signatura *
                  </label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="Ej: LIT-VAL-001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-emerald-800 bg-slate-50 uppercase focus:bg-white focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título de la Obra o Texto Escolar *
                  </label>
                  <input
                    type="text"
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    placeholder="Ej: Paco Yunque / Matemática 4°"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Autor(es) o Entidad *
                  </label>
                  <input
                    type="text"
                    value={formAutor}
                    onChange={(e) => setFormAutor(e.target.value)}
                    placeholder="Ej: César Vallejo / MINEDU"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Editorial / Sello
                  </label>
                  <input
                    type="text"
                    value={formEditorial}
                    onChange={(e) => setFormEditorial(e.target.value)}
                    placeholder="Ej: MINEDU Perú / Editorial Bruño"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoría Temática *
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    {CATEGORIAS_LIBROS_BIBLIOTECA.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grado Sugerido
                  </label>
                  <select
                    value={formGrado}
                    onChange={(e) => setFormGrado(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Todos los grados">Todos los grados (General)</option>
                    <option value="1°">1° de Primaria</option>
                    <option value="2°">2° de Primaria</option>
                    <option value="3°">3° de Primaria</option>
                    <option value="4°">4° de Primaria</option>
                    <option value="5°">5° de Primaria</option>
                    <option value="6°">6° de Primaria</option>
                  </select>
                </div>
              </div>

              {/* Stock numbers & physical status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Ejemplares Totales
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formCantidadTotal}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormCantidadTotal(val);
                      if (val < formCantidadDisponible) {
                        setFormCantidadDisponible(val);
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Disponibles Ahora
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formCantidadTotal}
                    value={formCantidadDisponible}
                    onChange={(e) => setFormCantidadDisponible(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-emerald-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Estado Físico
                  </label>
                  <select
                    value={formEstadoFisico}
                    onChange={(e) => setFormEstadoFisico(e.target.value as EstadoFisicoLibro)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="Excelente">Excelente</option>
                    <option value="Bueno">Bueno</option>
                    <option value="Regular">Regular</option>
                    <option value="En reparación">En reparación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Plan Lector
                  </label>
                  <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formEsPlanLector}
                      onChange={(e) => setFormEsPlanLector(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Sí, es del Plan</span>
                  </label>
                </div>
              </div>

              {/* Ubicación y Observaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ubicación en Sala / Estante
                  </label>
                  <input
                    type="text"
                    value={formUbicacion}
                    onChange={(e) => setFormUbicacion(e.target.value)}
                    placeholder="Ej: Estante A - Nivel 2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ISBN / Código de Barras (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    placeholder="Ej: 978-612-4012-34-1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones o Guía Pedagógica
                </label>
                <textarea
                  rows={2}
                  value={formObservaciones}
                  onChange={(e) => setFormObservaciones(e.target.value)}
                  placeholder="Ej: Ejemplares donados por APAFA / Edición con actividades de comprensión lectora."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSaving ? (
                    <span>Guardando en BD...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingLibro ? "Actualizar en Base de Datos" : "Guardar en Base de Datos"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
