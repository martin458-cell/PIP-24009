import React, { useState, useEffect } from "react";
import { RegistroAip, Docente, AREAS_AIP_LIST, HORAS_AIP_LIST, HORA_OPTIONS, GRADOS_LIST, SECCIONES_LIST } from "../types";
import { BookOpen, Save, X, Calendar, ClipboardCheck } from "lucide-react";

interface AipFormProps {
  initialData?: RegistroAip | null;
  docentesList: Docente[];
  onSubmit: (registro: RegistroAip) => void;
  onCancel: () => void;
}

export default function AipForm({
  initialData,
  docentesList,
  onSubmit,
  onCancel,
}: AipFormProps) {
  const isEditing = !!initialData;

  // Form states
  const [docenteDni, setDocenteDni] = useState("");
  const [customDocenteNombre, setCustomDocenteNombre] = useState("");
  const [isManualDocente, setIsManualDocente] = useState(false);
  const [fecha, setFecha] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [hora, setHora] = useState<number>(HORA_OPTIONS[0].value);
  const [area, setArea] = useState(AREAS_AIP_LIST[0]);
  const [tema, setTema] = useState("");
  const [recurso, setRecurso] = useState("");
  const [presentoSesion, setPresentoSesion] = useState(true);
  const [grado, setGrado] = useState(GRADOS_LIST[0]);
  const [seccion, setSeccion] = useState(SECCIONES_LIST[0]);
  const [estudiantesAsistentes, setEstudiantesAsistentes] = useState<number>(0);
  const [observacion, setObservacion] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Autocomplete search states
  const [docenteSearch, setDocenteSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Reset form or populate from edit state
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
      setHora(initialData.hora);
      setArea(initialData.area);
      setTema(initialData.tema);
      setRecurso(initialData.recurso);
      setPresentoSesion(initialData.presentoSesion);
      setGrado(initialData.grado);
      setSeccion(initialData.seccion);
      setEstudiantesAsistentes(initialData.estudiantesAsistentes);
      setObservacion(initialData.observacion);
    } else {
      // Clear data
      const firstDoc = docentesList.length > 0 ? docentesList[0] : null;
      setDocenteDni(firstDoc ? firstDoc.dni : "");
      setCustomDocenteNombre(firstDoc ? firstDoc.apellidosNombres : "");
      if (firstDoc) {
        setDocenteSearch(`${firstDoc.apellidosNombres} (${firstDoc.dni})`);
        setGrado(firstDoc.grado);
        setSeccion(firstDoc.seccion);
      } else {
        setDocenteSearch("");
      }
      setIsManualDocente(docentesList.length === 0);
      setFecha(new Date().toISOString().split("T")[0]);
      setHora(HORA_OPTIONS[0].value);
      setArea(AREAS_AIP_LIST[0]);
      setTema("");
      setRecurso("");
      setPresentoSesion(true);
      if (!firstDoc) {
        setGrado(GRADOS_LIST[0]);
        setSeccion(SECCIONES_LIST[0]);
      }
      setEstudiantesAsistentes(0);
      setObservacion("");
    }
    setErrors({});
  }, [initialData, docentesList]);

  // Click outside to close dropdown and restore search value if unselected
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        if (!isManualDocente) {
          const selectedDoc = docentesList.find((d) => d.dni === docenteDni);
          if (selectedDoc) {
            setDocenteSearch(`${selectedDoc.apellidosNombres} (${selectedDoc.dni})`);
          } else {
            setDocenteSearch("");
          }
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, docenteDni, docentesList, isManualDocente]);

  // Handle choice selecting
  const handleSelectDocente = (doc: Docente) => {
    setDocenteDni(doc.dni);
    setCustomDocenteNombre(doc.apellidosNombres);
    setDocenteSearch(`${doc.apellidosNombres} (${doc.dni})`);
    
    // Automatically fill grade and section to maximize administrative speed
    if (doc.grado) setGrado(doc.grado);
    if (doc.seccion) setSeccion(doc.seccion);
    
    setShowDropdown(false);
  };

  // Filter matching teachers in real-time
  const getFilteredDocentes = () => {
    const term = docenteSearch.toLowerCase().trim();
    const selectedDocObj = docentesList.find((d) => d.dni === docenteDni);
    const exactMatchStr = selectedDocObj ? `${selectedDocObj.apellidosNombres} (${selectedDocObj.dni})`.toLowerCase() : "";
    
    if (term === "" || term === exactMatchStr) {
      return docentesList;
    }
    
    return docentesList.filter((doc) => {
      return (
        doc.apellidosNombres.toLowerCase().includes(term) ||
        doc.dni.includes(term) ||
        doc.especialidad.toLowerCase().includes(term) ||
        doc.grado.toLowerCase().includes(term)
      );
    });
  };

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanDni = e.target.value.replace(/\D/gs, "").slice(0, 8);
    setDocenteDni(cleanDni);
  };

  // Safe assistants quantity change
  const handleAsistentesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 150) {
      setEstudiantesAsistentes(val);
    } else if (e.target.value === "") {
      setEstudiantesAsistentes(0);
    }
  };

  const validateForm = (): boolean => {
    const tempErrors: { [key: string]: string } = {};

    if (isManualDocente) {
      if (docenteDni.length !== 8) {
        tempErrors.docenteDni = "El DNI manual debe poseer exactamente 8 dígitos.";
      }
      if (!customDocenteNombre.trim() || customDocenteNombre.trim().length < 5) {
        tempErrors.customDocenteNombre = "Ingrese los apellidos y nombres del docente (mín. 5 chars).";
      }
    } else {
      if (!docenteDni) {
        tempErrors.docenteDni = "Debe elegir un docente de la lista.";
      }
    }

    if (!fecha) {
      tempErrors.fecha = "La fecha es obligatoria.";
    }

    if (!tema.trim() || tema.trim().length < 3) {
      tempErrors.tema = "El tema de la sesión es obligatorio (mín. 3 caracteres).";
    }

    if (estudiantesAsistentes === undefined || estudiantesAsistentes < 0) {
      tempErrors.estudiantesAsistentes = "La cantidad de alumnos debe ser un número entero mayor o igual a 0.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Resolve name
    let selectedNombre = "";
    if (isManualDocente) {
      selectedNombre = customDocenteNombre.trim();
    } else {
      const parentDoc = docentesList.find((d) => d.dni === docenteDni);
      selectedNombre = parentDoc ? parentDoc.apellidosNombres : "Docente";
    }

    const payload: RegistroAip = {
      id: initialData?.id || `aip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      docenteDni,
      docenteNombre: selectedNombre,
      fecha,
      hora,
      area,
      tema: tema.trim(),
      recurso: recurso.trim(),
      presentoSesion,
      grado,
      seccion,
      estudiantesAsistentes,
      observacion: observacion.trim(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onSubmit(payload);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all whitespace-normal">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#D92323]/5 rounded-bl-full pointer-events-none"></div>

      <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-5">
        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D92323]">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">
            {isEditing ? "Modificar Registro AIP" : "Registrar Entrada AIP"}
          </h3>
          <p className="text-[10px] text-slate-500 font-mono tracking-wide mt-0.5 uppercase font-bold">
            Aula de Innovación Pedagógica - I.E. P.M. 24009
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
        
        {/* Docente Selector */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-705 mb-1.5 flex items-center justify-between">
            <span>Docente a Cargo</span>
            {docentesList.length > 0 && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  if (isManualDocente) {
                    setIsManualDocente(false);
                    const firstDoc = docentesList[0];
                    setDocenteDni(firstDoc.dni);
                    setCustomDocenteNombre(firstDoc.apellidosNombres);
                    setDocenteSearch(`${firstDoc.apellidosNombres} (${firstDoc.dni})`);
                    if (firstDoc.grado) setGrado(firstDoc.grado);
                    if (firstDoc.seccion) setSeccion(firstDoc.seccion);
                  } else {
                    setIsManualDocente(true);
                    setDocenteDni("");
                    setCustomDocenteNombre("");
                    setDocenteSearch("");
                  }
                }}
                className="text-[10px] font-bold text-red-655 hover:text-red-755 transition-all underline shrink-0 lowercase tracking-tight normal-case cursor-pointer"
              >
                {isManualDocente ? "elegir de lista (búsqueda rápida)" : "ingresar docente manualmente"}
              </button>
            )}
          </label>

          {docentesList.length === 0 || isManualDocente ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="DNI del Docente (8 dígitos)"
                value={docenteDni === "99999999" ? "" : docenteDni}
                onChange={handleDniChange}
                maxLength={8}
                disabled={isEditing}
                className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
              />
              {errors.docenteDni && (
                <p className="text-[10px] text-red-600 font-bold tracking-tight">
                  {errors.docenteDni}
                </p>
              )}

              <input
                type="text"
                placeholder="Apellidos, Nombres Completos"
                value={customDocenteNombre}
                onChange={(e) => setCustomDocenteNombre(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:ring-2 focus:ring-red-500/10 outline-none transition-all placeholder-capitalize"
              />
              {errors.customDocenteNombre && (
                <p className="text-[10px] text-red-600 font-bold tracking-tight">
                  {errors.customDocenteNombre}
                </p>
              )}
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Escriba apellidos, nombres o DNI para buscar..."
                  value={docenteSearch}
                  onChange={(e) => {
                    setDocenteSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl pl-3.5 pr-10 py-3 text-xs text-slate-800 placeholder-slate-400 font-medium focus:ring-2 focus:ring-red-500/10 outline-none transition-all cursor-text font-bold"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                  <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                    búsqueda
                  </span>
                </div>
              </div>

              {/* Suggestions Dropdown */}
              {showDropdown && (
                <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 space-y-1 animate-fadeIn scrollbar-thin">
                  {getFilteredDocentes().length > 0 ? (
                    <>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2 py-1 border-b border-slate-100 mb-1 flex justify-between items-center">
                        <span>Coincidencias encontradas ({getFilteredDocentes().length})</span>
                        <span className="text-red-600 font-mono text-[9px] lowercase font-bold">seleccione uno</span>
                      </div>
                      {getFilteredDocentes().map((d) => (
                        <button
                          key={d.dni}
                          type="button"
                          onClick={() => handleSelectDocente(d)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex flex-col gap-0.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer group ${
                            docenteDni === d.dni ? "bg-red-50 border-red-200 text-red-800 font-bold" : "text-slate-705"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="font-extrabold group-hover:text-red-600 transition-colors">
                              {d.apellidosNombres}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 group-hover:bg-red-50 group-hover:text-[#D92323] transition-all">
                              {d.dni}
                            </span>
                          </div>
                          <div className="flex gap-2 text-[10px] text-slate-500">
                            {d.especialidad && (
                              <span className="italic font-medium">{d.especialidad}</span>
                            )}
                            {d.grado && d.seccion && (
                              <span className="text-slate-600 font-bold">
                                • {d.grado} &quot;{d.seccion}&quot;
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-3 py-4 text-center space-y-2">
                      <p className="text-xs text-slate-500 italic">
                        No se encontraron coincidencias para &quot;{docenteSearch}&quot;.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualDocente(true);
                          setDocenteDni("");
                          setCustomDocenteNombre(docenteSearch);
                          setDocenteSearch(docenteSearch);
                        }}
                        className="text-[11px] font-extrabold text-red-600 hover:text-white hover:bg-[#D92323] transition-colors underline cursor-pointer bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg w-full uppercase tracking-wider block"
                      >
                        + Registrar como Docente Manual o Externo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fecha y Hora en una fila */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-705 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#D92323]" />
              <span>Fecha del Ingreso</span>
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl px-3 py-2 text-xs text-slate-805 outline-none focus:ring-2 focus:ring-red-500/10 font-bold"
            />
            {errors.fecha && (
              <p className="text-[10px] text-red-600 mt-1 font-bold">{errors.fecha}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-705 mb-1.5 flex justify-between items-center font-bold">
              <span>Hora Pedagógica</span>
              <span className="text-[9px] bg-red-50 text-red-605 border border-red-200 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">¡Soporta 2 horas!</span>
            </label>
            <select
              value={hora}
              onChange={(e) => setHora(parseFloat(e.target.value))}
              className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl px-3 py-2 text-xs text-slate-805 outline-none focus:ring-2 focus:ring-red-500/10 cursor-pointer font-bold"
            >
              {HORA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-slate-900 font-bold">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Area */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-705 mb-1.5 font-sans">
            Área Curricular Impartida
          </label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl px-3.5 py-3 text-xs text-slate-805 outline-none focus:ring-2 focus:ring-red-500/10 cursor-pointer font-bold"
          >
            {AREAS_AIP_LIST.map((ar) => (
              <option key={ar} value={ar} className="bg-white text-slate-900">
                {ar}
              </option>
            ))}
          </select>
        </div>

        {/* Tema de la sesion */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-705 mb-1.5">
            Tema o Título de la Sesión
          </label>
          <input
            type="text"
            placeholder="Ejemplo: Fracciones equivalentes usando XO..."
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl px-3.5 py-2.5 text-xs text-slate-805 placeholder-slate-400 font-bold focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
          />
          {errors.tema && (
            <p className="text-[10px] text-red-600 mt-1 font-bold">{errors.tema}</p>
          )}
        </div>

        {/* Recursos Usados */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-705 mb-1.5">
            Recurso Tecnológico Utilizado
          </label>
          <input
            type="text"
            placeholder="Ejemplo: Laptops XO, Proyector, Internet..."
            value={recurso}
            onChange={(e) => setRecurso(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl px-3.5 py-2.5 text-xs text-slate-805 placeholder-slate-400 font-bold focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
          />
        </div>

        {/* Presentó Sesión (Yes/No) */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-705 mb-1.5 flex items-center justify-between">
            <span>¿Presentó Sesión de Aprendizaje?</span>
            <span className="text-[10px] font-mono text-slate-500 lowercase italic font-bold">(entregó planificación al PIP)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPresentoSesion(true)}
              className={`py-2 text-xs font-black rounded-xl transition-all border cursor-pointer ${
                presentoSesion
                  ? "bg-emerald-50 text-emerald-805 border-emerald-300 shadow-sm"
                  : "bg-white text-slate-505 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Sí, Presentó
            </button>
            <button
              type="button"
              onClick={() => setPresentoSesion(false)}
              className={`py-2 text-xs font-black rounded-xl transition-all border cursor-pointer ${
                !presentoSesion
                  ? "bg-red-50 text-[#D92323] border-red-200 shadow-sm"
                  : "bg-white text-slate-505 border-slate-200 hover:bg-slate-50"
              }`}
            >
              No Presentó
            </button>
          </div>
        </div>

        {/* Grado y Seccion */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-705 mb-1.5">
              Grado Atendido
            </label>
            <select
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl px-3 py-2 text-xs text-slate-805 outline-none focus:ring-2 focus:ring-red-500/10 cursor-pointer font-bold"
            >
              {GRADOS_LIST.map((g) => (
                <option key={g} value={g} className="bg-white text-slate-900">
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-705 mb-1.5">
              Sección
            </label>
            <select
              value={seccion}
              onChange={(e) => setSeccion(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl px-3 py-2 text-xs text-slate-805 outline-none focus:ring-2 focus:ring-red-500/10 cursor-pointer font-bold"
            >
              {SECCIONES_LIST.map((s) => (
                <option key={s} value={s} className="bg-white text-slate-900">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* N° Estudiantes Asistentes */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-705 mb-1.5">
            N° de Estudiantes Asistentes
          </label>
          <input
            type="number"
            min={0}
            max={150}
            value={estudiantesAsistentes}
            onChange={handleAsistentesChange}
            className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl px-3.5 py-2.5 text-xs text-slate-805 outline-none focus:ring-2 focus:ring-red-500/10 transition-all font-mono font-bold"
          />
          {errors.estudiantesAsistentes && (
            <p className="text-[10px] text-red-600 mt-1 font-bold">{errors.estudiantesAsistentes}</p>
          )}
        </div>

        {/* Observacion */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-705 mb-1.5">
            Observaciones o Incidencias
          </label>
          <textarea
            placeholder="Ninguna / Describa si ocurrió algún percance..."
            rows={2}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-[#D92323] rounded-xl px-3.5 py-2.5 text-xs text-slate-805 placeholder-slate-400 font-bold focus:ring-2 focus:ring-red-500/10 outline-none transition-all resize-none"
          ></textarea>
        </div>

        {/* Actions Submit / Cancel */}
        <div className="flex gap-2.5 pt-4">
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl py-2.5 text-xs font-bold tracking-wider uppercase cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="flex-1 bg-[#D92323] hover:bg-red-650 text-white font-black uppercase tracking-wider rounded-xl py-2.5 text-xs hover:bg-red-600 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Guardar Cambios" : "Guardar Registro"}
          </button>
        </div>

      </form>
    </div>
  );
}
