import React, { useState, useEffect, useRef } from "react";
import { Search, X, Users, Monitor, ArrowRight, Calendar, BookOpen, Clock } from "lucide-react";
import { Docente, RegistroAip, formatHoraAip } from "../types";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  docentes: Docente[];
  registros: RegistroAip[];
  onSelectDocente: (docente: Docente) => void;
  onSelectRegistro: (registro: RegistroAip) => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  docentes,
  registros,
  onSelectDocente,
  onSelectRegistro
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  // Filter teachers
  const matchedDocentes = cleanQuery.length > 0 
    ? docentes.filter((d) => 
        d.apellidosNombres.toLowerCase().includes(cleanQuery) ||
        d.dni.includes(cleanQuery) ||
        d.especialidad.toLowerCase().includes(cleanQuery) ||
        d.grado.toLowerCase().includes(cleanQuery) ||
        d.seccion.toLowerCase().includes(cleanQuery)
      ).slice(0, 5)
    : [];

  // Filter AIP entries
  const matchedRegistros = cleanQuery.length > 0
    ? registros.filter((r) =>
        r.docenteNombre.toLowerCase().includes(cleanQuery) ||
        r.docenteDni.includes(cleanQuery) ||
        r.area.toLowerCase().includes(cleanQuery) ||
        r.tema.toLowerCase().includes(cleanQuery) ||
        (r.recurso && r.recurso.toLowerCase().includes(cleanQuery)) ||
        r.fecha.includes(cleanQuery)
      ).slice(0, 5)
    : [];

  const totalResults = matchedDocentes.length + matchedRegistros.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center p-4 sm:pt-20">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-scaleUp">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-[#D92323] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, DNI, área curricular, tema de sesión..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-mono px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {cleanQuery.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">
                Búsqueda Rápida en toda la Institución
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                Escriba el nombre o DNI de un docente, o busque por área curricular (ej. Matemática, Comunicación) o recurso TIC.
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm font-bold text-slate-700">Sin coincidencias</p>
              <p className="text-xs text-slate-400">
                No se encontraron docentes o sesiones AIP que coincidan con &quot;{query}&quot;.
              </p>
            </div>
          ) : (
            <>
              {/* Docentes results */}
              {matchedDocentes.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider px-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    Docentes Encontrados ({matchedDocentes.length})
                  </p>
                  <div className="space-y-1">
                    {matchedDocentes.map((d) => (
                      <div
                        key={d.dni}
                        onClick={() => {
                          onSelectDocente(d);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900 truncate">
                            {d.apellidosNombres}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            DNI: {d.dni} • Grado: {d.grado} &quot;{d.seccion}&quot; • {d.especialidad}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AIP results */}
              {matchedRegistros.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider px-2 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-[#D92323]" />
                    Sesiones y Visitas AIP ({matchedRegistros.length})
                  </p>
                  <div className="space-y-1">
                    {matchedRegistros.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          onSelectRegistro(r);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-red-900 truncate">
                              {r.tema}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {r.area}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Docente: {r.docenteNombre} • Fecha: {r.fecha} • {formatHoraAip(r.hora)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#D92323] shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Presione ESC para cerrar</span>
          <span>IEPM N° 24009 Túpac Amaru II</span>
        </div>

      </div>
    </div>
  );
}
