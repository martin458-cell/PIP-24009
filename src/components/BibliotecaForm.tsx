import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Docente,
  RegistroBiblioteca,
  LibroStock,
  TipoRecursoBiblioteca,
  ModalidadUsoBiblioteca,
  EstadoDevolucionBiblioteca,
  HORARIOS_BIBLIOTECA,
  CATEGORIAS_LIBROS_BIBLIOTECA,
  APLICATIVOS_TABLETAS_LIST,
  GRADOS_LIST,
  SECCIONES_LIST,
  AREAS_AIP_LIST
} from "../types";
import {
  BookOpen,
  Tablet,
  Layers,
  Save,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Sparkles,
  BookmarkCheck,
  ShieldAlert,
  ArrowRight,
  School,
  AlertCircle,
  Filter,
  Check,
  Library,
  RotateCcw
} from "lucide-react";

interface BibliotecaFormProps {
  initialData?: RegistroBiblioteca | null;
  docentesList: Docente[];
  librosStock?: LibroStock[];
  onSubmit: (registro: RegistroBiblioteca) => void;
  onCancel: () => void;
}

export default function BibliotecaForm({
  initialData,
  docentesList,
  librosStock = [],
  onSubmit,
  onCancel
}: BibliotecaFormProps) {
  const isEditing = !!initialData;

  // Docente selection
  const [docenteDni, setDocenteDni] = useState("");
  const [customDocenteNombre, setCustomDocenteNombre] = useState("");
  const [isManualDocente, setIsManualDocente] = useState(false);
  const [docenteSearch, setDocenteSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // General fields
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [horarioId, setHorarioId] = useState<string>("1-2");
  const [horaInicioCustom, setHoraInicioCustom] = useState("08:00");
  const [horaFinCustom, setHoraFinCustom] = useState("09:30");

  const [grado, setGrado] = useState(GRADOS_LIST[0] || "1°");
  const [seccion, setSeccion] = useState(SECCIONES_LIST[0] || "A");
  const [estudiantesAsistentes, setEstudiantesAsistentes] = useState<number>(25);
  const [area, setArea] = useState("Plan Lector & Comunicación");
  const [actividadProposito, setActividadProposito] = useState("");

  // Resource Type
  const [tipoRecurso, setTipoRecurso] = useState<TipoRecursoBiblioteca>("libro");

  // Books detail
  const [libroTitulos, setLibroTitulos] = useState("");
  const [libroCantidad, setLibroCantidad] = useState<number>(25);
  const [libroCategoria, setLibroCategoria] = useState(CATEGORIAS_LIBROS_BIBLIOTECA[0]);
  const [libroCodigo, setLibroCodigo] = useState("");

  // Tablets detail
  const [tabletaCantidad, setTabletaCantidad] = useState<number>(25);
  const [tabletaLote, setTabletaLote] = useState("Maletín N° 01 (Tabletas 01 a 25)");
  const [tabletaApp, setTabletaApp] = useState(APLICATIVOS_TABLETAS_LIST[0]);
  const [tabletaAccesorios, setTabletaAccesorios] = useState("Con fundas protectoras completas");

  // Improvement proposal: Loan mode & Return status tracking
  const [modalidad, setModalidad] = useState<ModalidadUsoBiblioteca>("sala");
  const [estadoDevolucion, setEstadoDevolucion] = useState<EstadoDevolucionBiblioteca>("devuelto");
  const [fechaHoraDevolucion, setFechaHoraDevolucion] = useState("");
  const [condicionDevolucion, setCondicionDevolucion] = useState("Todo conforme y completo");
  const [obraPlanLector, setObraPlanLector] = useState("");
  const [responsableEntrega, setResponsableEntrega] = useState("Prof. Martin Cahuana (PIP / Biblioteca)");
  const [observaciones, setObservaciones] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form or populate from initialData
  useEffect(() => {
    if (initialData) {
      setDocenteDni(initialData.docenteDni);
      setCustomDocenteNombre(initialData.docenteNombre);

      const existsInList = docentesList.some((d) => d.dni === initialData.docenteDni);
      setIsManualDocente(!existsInList && initialData.docenteDni === "99999999");

      const parentDoc = docentesList.find((d) => d.dni === initialData.docenteDni);
      if (parentDoc) {
        setDocenteSearch(`${parentDoc.apellidosNombres} (${parentDoc.dni})`);
      } else {
        setDocenteSearch(initialData.docenteNombre || "");
      }

      setFecha(initialData.fecha);
      setHorarioId(initialData.horarioId || "1-2");
      setHoraInicioCustom(initialData.horaInicio || "08:00");
      setHoraFinCustom(initialData.horaFin || "09:30");

      setGrado(initialData.grado);
      setSeccion(initialData.seccion);
      setEstudiantesAsistentes(initialData.estudiantesAsistentes);
      setArea(initialData.area);
      setActividadProposito(initialData.actividadProposito);
      setTipoRecurso(initialData.tipoRecurso);

      if (initialData.librosDetalle) {
        setLibroTitulos(initialData.librosDetalle.titulos || "");
        setLibroCantidad(initialData.librosDetalle.cantidad || 0);
        setLibroCategoria(initialData.librosDetalle.categoria || CATEGORIAS_LIBROS_BIBLIOTECA[0]);
        setLibroCodigo(initialData.librosDetalle.codigoLibro || "");
      }

      if (initialData.tabletasDetalle) {
        setTabletaCantidad(initialData.tabletasDetalle.cantidad || 0);
        setTabletaLote(initialData.tabletasDetalle.loteMaletin || "");
        setTabletaApp(initialData.tabletasDetalle.aplicativoRecurso || APLICATIVOS_TABLETAS_LIST[0]);
        setTabletaAccesorios(initialData.tabletasDetalle.accesorios || "");
      }

      setModalidad(initialData.modalidad);
      setEstadoDevolucion(initialData.estadoDevolucion);
      setFechaHoraDevolucion(initialData.fechaHoraDevolucion || "");
      setCondicionDevolucion(initialData.condicionDevolucion || "Todo conforme y completo");
      setObraPlanLector(initialData.obraPlanLector || "");
      setResponsableEntrega(initialData.responsableEntrega || "Prof. Martin Cahuana (PIP / Biblioteca)");
      setObservaciones(initialData.observaciones || "");
    } else {
      // Default clean state
      const firstDoc = docentesList.length > 0 ? docentesList[0] : null;
      if (firstDoc) {
        setDocenteDni(firstDoc.dni);
        setCustomDocenteNombre(firstDoc.apellidosNombres);
        setDocenteSearch(`${firstDoc.apellidosNombres} (${firstDoc.dni})`);
        setGrado(firstDoc.grado);
        setSeccion(firstDoc.seccion);
      } else {
        setDocenteDni("");
        setCustomDocenteNombre("");
        setDocenteSearch("");
      }
      setIsManualDocente(docentesList.length === 0);
      setFecha(new Date().toISOString().split("T")[0]);
      setHorarioId("1-2");
      setHoraInicioCustom("08:00");
      setHoraFinCustom("09:30");
      setEstudiantesAsistentes(25);
      setArea("Plan Lector & Comunicación");
      setActividadProposito("Lectura guiada y desarrollo de comprensión lectora.");
      setTipoRecurso("libro");
      setLibroTitulos("Paco Yunque - César Vallejo");
      setLibroCantidad(25);
      setLibroCategoria(CATEGORIAS_LIBROS_BIBLIOTECA[0]);
      setLibroCodigo("");
      setTabletaCantidad(25);
      setTabletaLote("Maletín N° 01 (Tabletas 01 a 25)");
      setTabletaApp(APLICATIVOS_TABLETAS_LIST[0]);
      setTabletaAccesorios("Con fundas protectoras completas");
      setModalidad("sala");
      setEstadoDevolucion("devuelto");
      setFechaHoraDevolucion("09:30");
      setCondicionDevolucion("Libros devueltos en orden y buen estado.");
      setObraPlanLector("Paco Yunque");
      setResponsableEntrega("Prof. Martin Cahuana (PIP / Biblioteca)");
      setObservaciones("");
    }
    setErrors({});
  }, [initialData, docentesList]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter teachers for autocomplete
  const filteredDocentes = docentesList.filter((doc) => {
    const term = docenteSearch.toLowerCase();
    return (
      doc.apellidosNombres.toLowerCase().includes(term) ||
      doc.dni.includes(term) ||
      doc.especialidad.toLowerCase().includes(term)
    );
  });

  const handleSelectDocente = (doc: Docente) => {
    setDocenteDni(doc.dni);
    setCustomDocenteNombre(doc.apellidosNombres);
    setDocenteSearch(`${doc.apellidosNombres} (${doc.dni})`);
    setGrado(doc.grado);
    setSeccion(doc.seccion);
    setShowDropdown(false);
    setErrors((prev) => ({ ...prev, docente: "" }));
  };

  // Filter all books from inventory stock that were selected as Plan Lector 2026
  const planLectorBooksAll = useMemo(() => {
    return (librosStock || []).filter((l) => l.esPlanLector === true || l.categoria === "Plan Lector Institucional");
  }, [librosStock]);

  // Toggle to filter strictly by the teacher's current grado or see all Plan Lector books
  const [filterStrictGrado, setFilterStrictGrado] = useState(true);

  // Plan Lector books filtered by the selected grado
  const planLectorBooksForGrado = useMemo(() => {
    if (!grado || !filterStrictGrado) return planLectorBooksAll;
    const cleanCurrentGrado = grado.replace("°", "").trim();
    return planLectorBooksAll.filter((l) => {
      const g = (l.gradoSugerido || "").trim();
      if (g.toLowerCase().includes("todos") || g === "Todos los grados") return true;
      if (g === grado) return true;
      if (g.replace("°", "").trim() === cleanCurrentGrado) return true;
      return false;
    });
  }, [planLectorBooksAll, grado, filterStrictGrado]);

  // When teacher clicks a Plan Lector book from the filtered stock
  const handleSelectPlanLectorFromStock = (libro: LibroStock) => {
    setObraPlanLector(libro.titulo);
    setLibroTitulos(`${libro.titulo} - ${libro.autor}`);
    setLibroCodigo(libro.codigo);
    setLibroCategoria(libro.categoria || "Plan Lector Institucional");
    setArea("Plan Lector & Comunicación");
    setActividadProposito(
      `Lectura guiada, comprensión lectora y análisis reflexivo de la obra '${libro.titulo}' (${libro.autor}) correspondiente al Plan Lector 2026 de ${grado}.`
    );
    if (libro.gradoSugerido && GRADOS_LIST.includes(libro.gradoSugerido)) {
      setGrado(libro.gradoSugerido);
    }
  };

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const newErrors: { [key: string]: string } = {};

    if (isManualDocente) {
      if (!customDocenteNombre.trim()) {
        newErrors.docente = "Ingrese el nombre del docente solicitante.";
      }
    } else {
      if (!docenteDni) {
        newErrors.docente = "Seleccione un docente del directorio institucional.";
      }
    }

    if (!fecha) {
      newErrors.fecha = "Seleccione la fecha de atención.";
    }

    if (tipoRecurso === "libro" || tipoRecurso === "ambos") {
      if (!libroTitulos.trim()) {
        newErrors.libroTitulos = "Especifique el título de los libros o colección.";
      }
      if (libroCantidad <= 0) {
        newErrors.libroCantidad = "La cantidad de libros debe ser mayor a 0.";
      }
    }

    if (tipoRecurso === "tableta" || tipoRecurso === "ambos") {
      if (tabletaCantidad <= 0) {
        newErrors.tabletaCantidad = "La cantidad de tabletas debe ser mayor a 0.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Determine final docente name
    let finalDocenteNombre = customDocenteNombre;
    let finalDni = docenteDni;
    if (isManualDocente) {
      finalDni = "99999999";
    } else {
      const found = docentesList.find((d) => d.dni === docenteDni);
      if (found) finalDocenteNombre = found.apellidosNombres;
    }

    // Determine horario texto
    const matchedHorario = HORARIOS_BIBLIOTECA.find((h) => h.value === horarioId);
    let horarioTexto = matchedHorario ? matchedHorario.label : "Horario Personalizado";
    let hInicio = matchedHorario?.rango.split(" - ")[0] || horaInicioCustom;
    let hFin = matchedHorario?.rango.split(" - ")[1] || horaFinCustom;

    if (horarioId === "personalizado") {
      horarioTexto = `Horario Personalizado (${horaInicioCustom} - ${horaFinCustom})`;
      hInicio = horaInicioCustom;
      hFin = horaFinCustom;
    }

    // Clean safe ID with guaranteed minimum length
    const recordId =
      initialData && initialData.id && initialData.id.trim()
        ? initialData.id
        : `bib-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const newRegistro: RegistroBiblioteca = {
      id: recordId,
      docenteDni: finalDni || "99999999",
      docenteNombre: finalDocenteNombre || "Docente Solicitante",
      fecha: fecha || new Date().toISOString().split("T")[0],
      horarioId: horarioId || "1-2",
      horarioTexto: horarioTexto || "1° y 2° Hora Pedagógica (08:00 - 09:30)",
      horaInicio: hInicio || "08:00",
      horaFin: hFin || "09:30",
      grado: grado || "1°",
      seccion: seccion || "A",
      estudiantesAsistentes: Number(estudiantesAsistentes) || 0,
      area: area.trim() || "Plan Lector & Comunicación",
      actividadProposito: actividadProposito.trim() || "Uso pedagógico de biblioteca / tabletas",
      tipoRecurso,
      modalidad: modalidad || "sala",
      estadoDevolucion: estadoDevolucion || "devuelto",
      fechaHoraDevolucion: estadoDevolucion === "devuelto" ? (fechaHoraDevolucion || hFin || "09:30") : "",
      condicionDevolucion: condicionDevolucion.trim() || "Libros/tabletas completos y en orden",
      obraPlanLector: obraPlanLector.trim(),
      responsableEntrega: responsableEntrega.trim() || "Prof. Martin Cahuana (PIP / Biblioteca)",
      observaciones: observaciones.trim(),
      createdAt: initialData && initialData.createdAt ? initialData.createdAt : new Date().toISOString()
    };

    // Attach librosDetalle ONLY when applicable (never leave undefined property)
    if (tipoRecurso === "libro" || tipoRecurso === "ambos") {
      newRegistro.librosDetalle = {
        titulos: libroTitulos.trim(),
        cantidad: Number(libroCantidad) || 1,
        categoria: libroCategoria || CATEGORIAS_LIBROS_BIBLIOTECA[0],
        codigoLibro: libroCodigo.trim()
      };
    }

    // Attach tabletasDetalle ONLY when applicable (never leave undefined property)
    if (tipoRecurso === "tableta" || tipoRecurso === "ambos") {
      newRegistro.tabletasDetalle = {
        cantidad: Number(tabletaCantidad) || 1,
        loteMaletin: tabletaLote.trim() || "Maletín N° 01",
        aplicativoRecurso: tabletaApp || APLICATIVOS_TABLETAS_LIST[0],
        accesorios: tabletaAccesorios.trim()
      };
    }

    try {
      setIsSubmitting(true);
      await onSubmit(newRegistro);
    } catch (err) {
      console.error("Error al registrar atención de biblioteca:", err);
      setSubmitError(`Error al guardar en la base de datos: ${err instanceof Error ? err.message : String(err)}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      {/* Form Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 text-emerald-300">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-mono">
                Biblioteca & Recursos Educativos
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-200">
                IEPM N° 24009
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              {isEditing ? "Modificar Registro de Biblioteca" : "Nuevo Registro de Uso de Biblioteca & Tabletas"}
            </h3>
            <p className="text-xs text-emerald-100/80">
              Control de préstamos de libros físicos, maletines de tabletas MINEDU y fomento del Plan Lector.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Cerrar formulario"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6">
        
        {/* SECTOR 1: DOCENTE Y DATOS DEL GRUPO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              1. Docente Solicitante y Aula Beneficiaria
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsManualDocente(!isManualDocente);
                setErrors((prev) => ({ ...prev, docente: "" }));
              }}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
            >
              {isManualDocente ? "Buscar en Directorio Docente" : "Ingresar docente externo o manual"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Docente selector / manual */}
            <div className="md:col-span-6 relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Docente Responsable <span className="text-red-500">*</span>
              </label>

              {!isManualDocente ? (
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={docenteSearch}
                      onChange={(e) => {
                        setDocenteSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Buscar por apellido, nombre o DNI..."
                      className={`w-full pl-9 pr-8 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                        errors.docente ? "border-red-500 bg-red-50/20" : "border-slate-300 bg-slate-50 focus:bg-white"
                      }`}
                    />
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    {docenteSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setDocenteSearch("");
                          setDocenteDni("");
                          setShowDropdown(true);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {showDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs divide-y divide-slate-100">
                      {filteredDocentes.length > 0 ? (
                        filteredDocentes.map((doc) => (
                          <div
                            key={doc.dni}
                            onClick={() => handleSelectDocente(doc)}
                            className={`p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition-colors ${
                              docenteDni === doc.dni ? "bg-emerald-50/80 font-bold" : ""
                            }`}
                          >
                            <div>
                              <p className="font-bold text-slate-900">{doc.apellidosNombres}</p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                DNI: {doc.dni} • Grado: {doc.grado} &quot;{doc.seccion}&quot;
                              </p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                              {doc.especialidad}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-slate-400">
                          No se encontraron docentes con ese criterio.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={customDocenteNombre}
                  onChange={(e) => setCustomDocenteNombre(e.target.value)}
                  placeholder="Ej: Prof. María Huamaní Pérez"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                />
              )}

              {errors.docente && (
                <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  {errors.docente}
                </p>
              )}
            </div>

            {/* Grado */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Grado
              </label>
              <select
                value={grado}
                onChange={(e) => setGrado(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              >
                {GRADOS_LIST.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Sección */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sección
              </label>
              <select
                value={seccion}
                onChange={(e) => setSeccion(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              >
                {SECCIONES_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Estudiantes Asistentes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                N° Alumnos
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={estudiantesAsistentes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEstudiantesAsistentes(val);
                  setLibroCantidad(val);
                  setTabletaCantidad(val);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        {/* SECTOR 2: FECHA Y HORARIO (REQUERIMIENTO CLAVE) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              2. Fecha de Uso y Horario Pedagógico Oficial
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              Horario Institucional IEPM 24009
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Fecha */}
            <div className="md:col-span-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFecha(new Date().toISOString().split("T")[0])}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setFecha(d.toISOString().split("T")[0]);
                    }}
                    className="text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Ayer
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Horario Selector */}
            <div className="md:col-span-8">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bloque de Horario Pedagógico <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {HORARIOS_BIBLIOTECA.slice(0, 3).map((h) => {
                  const isSelected = horarioId === h.value;
                  return (
                    <button
                      key={h.value}
                      type="button"
                      onClick={() => setHorarioId(h.value)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{h.bloque}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{h.rango}</p>
                    </button>
                  );
                })}
              </div>

              {/* Special options: Recreo lector, Turno Tarde, Personalizado */}
              <div className="flex flex-wrap gap-2 mt-2">
                {HORARIOS_BIBLIOTECA.slice(3).map((h) => {
                  const isSelected = horarioId === h.value;
                  return (
                    <button
                      key={h.value}
                      type="button"
                      onClick={() => setHorarioId(h.value)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{h.bloque} ({h.rango})</span>
                    </button>
                  );
                })}
              </div>

              {/* If customized */}
              {horarioId === "personalizado" && (
                <div className="grid grid-cols-2 gap-3 mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Hora de Inicio
                    </label>
                    <input
                      type="time"
                      value={horaInicioCustom}
                      onChange={(e) => setHoraInicioCustom(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Hora de Término
                    </label>
                    <input
                      type="time"
                      value={horaFinCustom}
                      onChange={(e) => setHoraFinCustom(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTOR 3: ELECCIÓN DEL TIPO DE RECURSO (LIBRO, TABLETA O AMBOS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              3. Tipo de Recurso Educativo Utilizado <span className="text-red-500">*</span>
            </h4>
            <span className="text-[11px] font-bold text-emerald-700">
              Elija: Libro Físico, Tableta o Ambos
            </span>
          </div>

          {/* 3 Main Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Option 1: Libro Físico */}
            <button
              type="button"
              onClick={() => setTipoRecurso("libro")}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                tipoRecurso === "libro"
                  ? "border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  tipoRecurso === "libro" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"
                }`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                {tipoRecurso === "libro" && (
                  <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-sm font-black text-slate-900">Libro Físico</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Plan Lector, textos escolares MINEDU, cuadernos de trabajo, literatura y enciclopedias.
                </p>
              </div>
            </button>

            {/* Option 2: Tableta */}
            <button
              type="button"
              onClick={() => setTipoRecurso("tableta")}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                tipoRecurso === "tableta"
                  ? "border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  tipoRecurso === "tableta" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"
                }`}>
                  <Tablet className="w-5 h-5" />
                </div>
                {tipoRecurso === "tableta" && (
                  <span className="text-[10px] font-black uppercase bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-sm font-black text-slate-900">Tableta Pedagógica</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Tabletas MINEDU con aplicativos precargados, PerúEduca, Scratch Jr y Biblioteca Digital.
                </p>
              </div>
            </button>

            {/* Option 3: Ambos */}
            <button
              type="button"
              onClick={() => setTipoRecurso("ambos")}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                tipoRecurso === "ambos"
                  ? "border-purple-600 bg-purple-50/60 shadow-md ring-2 ring-purple-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  tipoRecurso === "ambos" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700"
                }`}>
                  <div className="flex items-center gap-0.5">
                    <BookOpen className="w-4 h-4" />
                    <Tablet className="w-4 h-4" />
                  </div>
                </div>
                {tipoRecurso === "ambos" && (
                  <span className="text-[10px] font-black uppercase bg-purple-600 text-white px-2 py-0.5 rounded-full">
                    Híbrido
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-sm font-black text-slate-900">Ambos (Libro + Tableta)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Sesión híbrida combinando libros físicos con tabletas pedagógicas para lectura y creación.
                </p>
              </div>
            </button>
          </div>

          {/* DETALLES DE LIBROS (si aplica) */}
          {(tipoRecurso === "libro" || tipoRecurso === "ambos") && (
            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                    Detalles del Material Bibliográfico (Libro Físico)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Libros Físicos
                </span>
              </div>

              {/* SECCIÓN ESPECIAL: OBRAS DEL PLAN LECTOR 2026 EN STOCK FILTRADAS SEGÚN GRADO */}
              <div className="bg-white rounded-2xl border-2 border-emerald-300/80 p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-emerald-600 text-white">
                        <BookmarkCheck className="w-4 h-4" />
                      </span>
                      <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                        <span>Obras del Plan Lector Institucional 2026</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {grado} de Primaria
                        </span>
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Libros registrados en el inventario de stock marcados como parte del Plan Lector 2026.
                    </p>
                  </div>

                  {/* Toggle filter by grado or show all */}
                  <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFilterStrictGrado(true)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        filterStrictGrado
                          ? "bg-white text-emerald-800 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Solo {grado} ({planLectorBooksForGrado.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStrictGrado(false)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        !filterStrictGrado
                          ? "bg-white text-emerald-800 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Todos los Grados ({planLectorBooksAll.length})
                    </button>
                  </div>
                </div>

                {/* Plan Lector Books Grid */}
                {planLectorBooksForGrado.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {planLectorBooksForGrado.map((libro) => {
                      const isSelected = obraPlanLector === libro.titulo || libroTitulos.includes(libro.titulo);

                      return (
                        <div
                          key={libro.id}
                          onClick={() => handleSelectPlanLectorFromStock(libro)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? "bg-emerald-50/90 border-emerald-500 shadow-xs ring-2 ring-emerald-400/30"
                              : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-emerald-300 hover:shadow-2xs"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono font-black text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                {libro.gradoSugerido}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                {libro.cantidadDisponible} disp.
                              </span>
                            </div>
                            <p className="text-xs font-black text-slate-900 line-clamp-1 leading-snug">
                              {libro.titulo}
                            </p>
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">
                              {libro.autor}
                            </p>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-slate-400">
                              [{libro.codigo}]
                            </span>
                            {isSelected ? (
                              <span className="font-bold text-emerald-700 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                Seleccionado
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold hover:underline">
                                Seleccionar
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
                    <p className="text-xs font-bold text-amber-900">
                      No hay libros en stock registrados para el Plan Lector 2026 de {grado}
                    </p>
                    <p className="text-[11px] text-amber-700 max-w-md mx-auto">
                      En la pestaña &quot;2. Libros en Stock&quot; puede registrar nuevas obras o editar las existentes activando la casilla &quot;Marcar como parte del Plan Lector 2026&quot;.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFilterStrictGrado(false)}
                      className="px-3 py-1 rounded-lg bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      Ver obras del Plan Lector de otros grados ({planLectorBooksAll.length})
                    </button>
                  </div>
                )}

                {/* Obra seleccionada feedback */}
                {obraPlanLector && (
                  <div className="p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-300 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        Obra activa del Plan Lector: <strong className="text-emerald-950 font-black">{obraPlanLector}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setObraPlanLector("");
                        setLibroCodigo("");
                      }}
                      className="text-[11px] font-bold text-slate-600 hover:text-red-700 cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>

              {/* Selector directo de cualquier libro del Inventario General en Stock */}
              {librosStock && librosStock.length > 0 && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Library className="w-3.5 h-3.5 text-slate-500" />
                      <span>O seleccionar cualquier otro libro general del stock ({librosStock.length} títulos disponibles):</span>
                    </label>
                  </div>
                  <select
                    onChange={(e) => {
                      const found = librosStock.find((b) => b.id === e.target.value);
                      if (found) {
                        setLibroTitulos(`${found.titulo} - ${found.autor}`);
                        setLibroCodigo(found.codigo);
                        setLibroCategoria(found.categoria);
                        if (found.esPlanLector) {
                          setObraPlanLector(found.titulo);
                        }
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="" disabled>
                      -- 📖 Seleccionar del catálogo completo de stock --
                    </option>
                    {librosStock.map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.codigo}] {b.titulo} - {b.autor} ({b.cantidadDisponible} disp. en {b.ubicacion}) {b.esPlanLector ? "★ Plan Lector 2026" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Título(s) del Libro o Colección <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={libroTitulos}
                    onChange={(e) => setLibroTitulos(e.target.value)}
                    placeholder="Ej: Paco Yunque - César Vallejo / Cuaderno de Trabajo MINEDU 4°"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {errors.libroTitulos && (
                    <p className="text-[10px] text-red-600 font-bold mt-1">{errors.libroTitulos}</p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ejemplares Prestados
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={libroCantidad}
                    onChange={(e) => setLibroCantidad(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoría
                  </label>
                  <select
                    value={libroCategoria}
                    onChange={(e) => setLibroCategoria(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800"
                  >
                    {CATEGORIAS_LIBROS_BIBLIOTECA.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DETALLES DE TABLETAS (si aplica) */}
          {(tipoRecurso === "tableta" || tipoRecurso === "ambos") && (
            <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tablet className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-black uppercase tracking-wider text-blue-950">
                    Detalles de Equipamiento TIC (Tabletas MINEDU)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Tabletas Escolares
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cantidad de Tabletas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={tabletaCantidad}
                    onChange={(e) => setTabletaCantidad(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900"
                  />
                  {/* Quick pills */}
                  <div className="flex gap-1 mt-1.5">
                    {[10, 15, 20, 25, 30].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setTabletaCantidad(qty)}
                        className="px-1.5 py-0.5 rounded bg-blue-100/70 hover:bg-blue-200 text-blue-900 text-[10px] font-bold cursor-pointer"
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Lote o Maletín de Tabletas
                  </label>
                  <input
                    type="text"
                    value={tabletaLote}
                    onChange={(e) => setTabletaLote(e.target.value)}
                    placeholder="Ej: Maletín N° 01 (Tabletas 01 a 25)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Aplicativo o Recurso Digital Utilizado
                  </label>
                  <select
                    value={tabletaApp}
                    onChange={(e) => setTabletaApp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800"
                  >
                    {APLICATIVOS_TABLETAS_LIST.map((app) => (
                      <option key={app} value={app}>{app}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTOR 4: PROPUESTA DE MEJORA - CONTROL DE PRÉSTAMO, DEVOLUCIÓN Y PLAN LECTOR */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                4. Control de Préstamo, Modalidad & Estado de Devolución
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Propuesta de Mejora Institucional
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Modalidad de Uso */}
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Modalidad de Atención
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setModalidad("sala")}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    modalidad === "sala"
                      ? "bg-slate-900 text-white font-bold border-slate-900"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-bold">En Sala</p>
                  <p className="text-[9px] opacity-70">Uso en biblioteca</p>
                </button>

                <button
                  type="button"
                  onClick={() => setModalidad("aula")}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    modalidad === "aula"
                      ? "bg-slate-900 text-white font-bold border-slate-900"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-bold">Para el Aula</p>
                  <p className="text-[9px] opacity-70">Préstamo a clase</p>
                </button>

                <button
                  type="button"
                  onClick={() => setModalidad("prestamo_domicilio")}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    modalidad === "prestamo_domicilio"
                      ? "bg-slate-900 text-white font-bold border-slate-900"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-bold">Domicilio</p>
                  <p className="text-[9px] opacity-70">Docente / Alumno</p>
                </button>
              </div>
            </div>

            {/* Estado de Devolución */}
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estado Actual del Préstamo
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEstadoDevolucion("devuelto")}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    estadoDevolucion === "devuelto"
                      ? "bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-bold">Devuelto Conforme</p>
                  <p className="text-[9px] opacity-80">Recepción completa</p>
                </button>

                <button
                  type="button"
                  onClick={() => setEstadoDevolucion("en_uso")}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    estadoDevolucion === "en_uso"
                      ? "bg-amber-500 text-white font-bold border-amber-500 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-bold">En Uso / Pendiente</p>
                  <p className="text-[9px] opacity-80">En horario activo</p>
                </button>

                <button
                  type="button"
                  onClick={() => setEstadoDevolucion("observado")}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    estadoDevolucion === "observado"
                      ? "bg-red-600 text-white font-bold border-red-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-bold">Con Observación</p>
                  <p className="text-[9px] opacity-80">Deterioro / Falta</p>
                </button>
              </div>
            </div>

            {/* Propósito Pedagógico */}
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Área / Propósito Pedagógico
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ej: Plan Lector, Comunicación, Ciencia y Tecnología..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Obra o Actividad del Plan Lector */}
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Obra del Plan Lector Institucional 2026 (Opcional)
              </label>
              <input
                type="text"
                value={obraPlanLector}
                onChange={(e) => setObraPlanLector(e.target.value)}
                placeholder="Ej: Paco Yunque, El Bagrecico, Mitos de Lucanas..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white"
              />
            </div>

            {/* Actividad / Descripción */}
            <div className="md:col-span-12">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Actividad Desarrollada con los Estudiantes
              </label>
              <textarea
                rows={2}
                value={actividadProposito}
                onChange={(e) => setActividadProposito(e.target.value)}
                placeholder="Describa brevemente la dinámica (ej. lectura compartida, búsqueda de información sobre ecosistemas, producción de textos o audios en tableta)..."
                className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Observaciones de Entrega / Devolución */}
            <div className="md:col-span-12">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Observaciones / Condición de Entrega y Recepción
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Se entregaron 25 libros y 25 tabletas con cargadores completos. Todo retornado en perfecto orden."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Error notification if submit fails */}
        {submitError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Error al registrar la atención:</p>
              <p className="text-[11px] text-red-700">{submitError}</p>
            </div>
          </div>
        )}

        {/* Form Actions Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Guardando en Base de Datos...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? "Actualizar Registro" : "Guardar Registro en Biblioteca"}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
