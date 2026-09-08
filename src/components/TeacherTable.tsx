import { useState } from "react";
import { Docente, ESPECIALIDADES_LIST, GRADOS_LIST } from "../types";
import { Search, Eye, Edit2, Trash2, SlidersHorizontal, FileSpreadsheet, ArrowUpDown } from "lucide-react";

interface TeacherTableProps {
  docentes: Docente[];
  onView: (docente: Docente) => void;
  onEdit: (docente: Docente) => void;
  onDelete: (dni: string) => void;
}

export default function TeacherTable({
  docentes,
  onView,
  onEdit,
  onDelete,
}: TeacherTableProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("TODAS");
  const [selectedGrade, setSelectedGrade] = useState("TODOS");
  const [sortBy, setSortBy] = useState<"dni" | "nombre">("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Search and filter logic
  const filteredDocentes = docentes.filter((docente) => {
    const matchesSearch =
      docente.apellidosNombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docente.dni.includes(searchTerm);

    const matchesSpecialty =
      selectedSpecialty === "TODAS" || docente.especialidad === selectedSpecialty;

    const matchesGrade =
      selectedGrade === "TODOS" || docente.grado === selectedGrade;

    return matchesSearch && matchesSpecialty && matchesGrade;
  });

  // Sorting logic
  const sortedDocentes = [...filteredDocentes].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "dni") {
      comparison = a.dni.localeCompare(b.dni);
    } else {
      comparison = a.apellidosNombres.localeCompare(b.apellidosNombres);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination calculation
  const totalItems = sortedDocentes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocentes = sortedDocentes.slice(startIndex, startIndex + itemsPerPage);

  const toggleSort = (type: "dni" | "nombre") => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(type);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset page on sort
  };

  const handleExportCSV = () => {
    // Generate simple csv file download
    if (docentes.length === 0) return;
    const headers = "DNI,Apellidos_Nombres,Grado,Seccion,Correo,Celular,Fecha_Nacimiento,Especialidad,Condicion,Escala,Jornada_Laboral\n";
    const rows = docentes
      .map((d) => 
        `"${d.dni}","${d.apellidosNombres}","${d.grado}","${d.seccion}","${d.correo}","${d.celular}","${d.fechaNacimiento}","${d.especialidad}","${d.condicion || ""}","${d.escala || ""}","${d.jornadaLaboral || ""}"`
      )
      .join("\n");
      
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `IEPM_24009_Docentes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialty("TODAS");
    setSelectedGrade("TODOS");
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full text-slate-800">
      
      {/* Filtering Header Area */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar docente por DNI o Apellidos..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#D92323] focus:ring-2 focus:ring-red-500/10 text-slate-800 placeholder-slate-400 shadow-sm"
            />
          </div>

          {/* Quick Actions (CSV) */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleExportCSV}
              disabled={docentes.length === 0}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/10 text-slate-700 shadow-sm font-bold transition-all ${
                docentes.length === 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              }`}
              title="Descargar listado en archivo CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-red-600" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Dropdowns filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtros:</span>
          </div>

          {/* Specialty filter */}
          <div>
            <select
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-[#D92323]"
            >
              <option value="TODAS" className="bg-white text-slate-900">TODAS LAS ESPECIALIDADES</option>
              {ESPECIALIDADES_LIST.map((spec) => (
                <option key={spec} value={spec} className="bg-white text-slate-900">
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Grade filter */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-[#D92323]"
            >
              <option value="TODOS" className="bg-white text-slate-900">TODOS LOS GRADOS</option>
              {GRADOS_LIST.map((grade) => (
                <option key={grade} value={grade} className="bg-white text-slate-900">
                  {grade} {!grade.startsWith("Inicial") && grade !== "Administrativo" && grade !== "Sin aula a cargo" && grade !== "Director" && grade !== "SubDirectora (e)" ? "Grado" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchTerm || selectedSpecialty !== "TODAS" || selectedGrade !== "TODOS") && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-600 hover:text-red-700 hover:underline font-bold cursor-pointer"
            >
              Limpiar Filtros
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500 font-mono font-medium">
            {filteredDocentes.length} de {docentes.length} docentes
          </div>
        </div>

      </div>

      {/* Database Matrix Table */}
      <div className="flex-1 overflow-x-auto bg-white">
        {paginatedDocentes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">No se encontraron docentes</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
              No hay coincidencias para sus filtros solicitados o el registro se encuentra vacío. Intente buscar otro criterio o limpie los filtros activos.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-755 font-mono text-[10px] uppercase font-extrabold tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 select-none group" onClick={() => toggleSort("dni")}>
                  <div className="flex items-center gap-1">
                    DNI
                    <ArrowUpDown className="w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 select-none group" onClick={() => toggleSort("nombre")}>
                  <div className="flex items-center gap-1">
                    Docente (Apellidos y Nombres)
                    <ArrowUpDown className="w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Asignación</th>
                <th className="py-3.5 px-4">Especialidad Principal</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 text-sm">
              {paginatedDocentes.map((docente) => (
                <tr key={docente.dni} className="hover:bg-slate-50 transition-colors">
                  
                  {/* DNI */}
                  <td className="py-3.5 px-4 font-mono font-bold text-[#0B1E36]">
                    {docente.dni}
                  </td>

                  {/* Name */}
                  <td className="py-3.5 px-4">
                    <p className="font-extrabold text-[#0B1E36] text-sm">{docente.apellidosNombres}</p>
                    <p className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-1.5 items-center">
                      <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-655 font-extrabold uppercase">
                        {docente.condicion || "Sin Condición"}
                      </span>
                      {docente.escala && (
                        <span className="bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-blue-700 font-bold">
                          {docente.escala === "Sin Escala" ? docente.escala : `Escala ${docente.escala}`}
                        </span>
                      )}
                      {docente.jornadaLaboral && (
                        <span className="bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded text-purple-700 font-bold">
                          {docente.jornadaLaboral} hrs
                        </span>
                      )}
                    </p>
                  </td>

                  {/* Assignation */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {docente.grado} - {docente.seccion}
                    </span>
                  </td>

                  {/* Specialty */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-705">
                      <span className="w-1.5 h-1.5 bg-[#D92323] rounded-full shrink-0 shadow-sm shadow-[#D92323]/50"></span>
                      {docente.especialidad}
                    </span>
                  </td>

                  {/* Phone / Contact */}
                  <td className="py-3.5 px-3">
                    <div className="text-xs">
                      <p className="font-extrabold text-slate-800">{docente.celular}</p>
                      <p className="text-slate-500 font-medium truncate max-w-[150px]" title={docente.correo}>
                        {docente.correo}
                      </p>
                    </div>
                  </td>

                  {/* Trigger actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-0.5 relative z-10">
                      
                      {/* View details */}
                      <button
                        onClick={() => onView(docente)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                        title="Ver Ficha Oficial"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(docente)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                        title="Editar Informacion"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(docente.dni)}
                        className="p-1.5 text-slate-500 hover:text-red-655 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Eliminar Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Pagination Controls Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando pág. <strong className="text-slate-800 font-extrabold">{currentPage}</strong> de <strong className="text-slate-800 font-extrabold">{totalPages}</strong> ({totalItems} docentes filtrados)
          </p>

          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 border border-slate-205 rounded-lg text-xs font-bold select-none bg-white transition-all text-slate-700 ${
                currentPage === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer"
              }`}
            >
              Anterior
            </button>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 border border-slate-205 rounded-lg text-xs font-bold select-none bg-white transition-all text-slate-700 ${
                currentPage === totalPages ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer"
              }`}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
