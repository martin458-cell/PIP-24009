import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Docente, CONDICIONES_LIST, ESCALAS_LIST, JORNADAS_LIST, GRADOS_LIST, SECCIONES_LIST } from "../types";
import { Upload, Download, CheckCircle, AlertTriangle, Play, RefreshCw, X, Trash2, HelpCircle } from "lucide-react";

interface TeacherBulkUploadProps {
  existingDnis: string[];
  onUploadSuccess: (importedDocentes: Docente[]) => void;
  onCancel: () => void;
}

interface ParsedRow {
  index: number;
  dni: string;
  apellidosNombres: string;
  grado: string;
  seccion: string;
  correo: string;
  celular: string;
  fechaNacimiento: string;
  especialidad: string;
  condicion: string;
  escala: string;
  jornadaLaboral: number;
  errors: string[];
  status: "valid" | "invalid" | "duplicate_db" | "duplicate_file";
}

export default function TeacherBulkUpload({
  existingDnis,
  onUploadSuccess,
  onCancel,
}: TeacherBulkUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper date parsing (handles Excel serial numbers, DD/MM/YYYY, YYYY-MM-DD)
  const parseExcelDate = (val: any): string => {
    if (!val) return "";
    
    if (typeof val === "number") {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }
    
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    
    // Check for DD/MM/YYYY or DD-MM-YYYY
    const partsDmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (partsDmy) {
      const day = partsDmy[1].padStart(2, "0");
      const month = partsDmy[2].padStart(2, "0");
      const year = partsDmy[3];
      return `${year}-${month}-${day}`;
    }

    // Check for YYYY/MM/DD
    const partsYmd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (partsYmd) {
      const year = partsYmd[1];
      const month = partsYmd[2].padStart(2, "0");
      const day = partsYmd[3].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
    return str; // Return as fallback
  };

  // Normalization logic
  const cleanString = (val: any): string => {
    return val ? String(val).trim() : "";
  };

  // Excel generation
  const downloadTemplate = () => {
    // Columns & Examples
    const headers = [
      "DNI (8 dígitos)",
      "Apellidos y Nombres (Apellidos, Nombres)",
      "Grado",
      "Sección",
      "Correo Electrónico",
      "Celular (9 dígitos)",
      "Fecha de Nacimiento (Año-Mes-Día o DD/MM/AAAA)",
      "Especialidad Académica",
      "Condición (Nombrado/Contratado/Designado/Encargado)",
      "Escala Magisterial (I al VIII o Sin Escala)",
      "Jornada Laboral (30 o 40)"
    ];

    const data = [
      headers,
      [
        "43471773",
        "García Alvites, Alberto Fernando",
        "4°",
        "B",
        "alberto.garcia@iepm24009.edu.pe",
        "987612345",
        "1986-06-15",
        "Matemática",
        "Nombrado",
        "IV",
        "30"
      ],
      [
        "40283944",
        "Ramos Mendoza, Silvia Elena",
        "Director",
        "Sin sección a cargo",
        "silvia.ramos@iepm24009.edu.pe",
        "993123456",
        "1978-11-23",
        "Educación Primaria",
        "Designado",
        "VI",
        "40"
      ],
      [
        "10254988",
        "Morales Quispe, Juana de Arco",
        "Inicial (5 años)",
        "Única",
        "juana.morales@iepm24009.edu.pe",
        "945112233",
        "1991-03-05",
        "Educación Inicial",
        "Contratado",
        "Sin Escala",
        "30"
      ]
    ];

    // Info sheet for validations
    const validationHeaders = ["CAMPO", "VALORES PERMITIDOS / FORMATO"];
    const validationRows = [
      validationHeaders,
      ["Grados admitidos", GRADOS_LIST.join(", ")],
      ["Secciones admitidas", SECCIONES_LIST.join(", ")],
      ["Condiciones", CONDICIONES_LIST.join(", ")],
      ["Escalas Magisteriales", ESCALAS_LIST.join(", ")],
      ["Jornadas Laborales", JORNADAS_LIST.join(", ") + " (horas)"],
      ["DNI", "Exactamente 8 números continuos sin letras ni espacios."],
      ["Nombres", "Formato 'Apellidos, Nombres' (ej: Pérez, Juan). Mínimo 5 letras."],
      ["Celular", "9 dígitos numéricos. Debe empezar estrictamente con el dígito 9."]
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(data);
    const ws2 = XLSX.utils.aoa_to_sheet(validationRows);

    // Apply auto width sizing approx
    ws1["!cols"] = headers.map(() => ({ wch: 25 }));
    ws2["!cols"] = [{ wch: 25 }, { wch: 80 }];

    XLSX.utils.book_append_sheet(wb, ws1, "Plantilla Registro");
    XLSX.utils.book_append_sheet(wb, ws2, "Instrucciones de Llenado");

    XLSX.writeFile(wb, "IEPM24009_Plantilla_Docentes.xlsx");
  };

  // File parsing & validation
  const processFile = (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Read raw records (header is row 1)
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rawJson.length <= 1) {
          alert("El archivo subido está vacío o no tiene la fila de cabecera.");
          setIsProcessing(false);
          return;
        }

        // Identify starting data index (skipping header row)
        const dataRows = rawJson.slice(1);
        const resultRows: ParsedRow[] = [];
        const seenFlippedDnis: Record<string, number> = {}; // track duplicates in the current spreadsheet

        dataRows.forEach((row, i) => {
          // If the row lacks essential data or is fully blank, skip silently
          if (!row || row.length === 0 || row.every((val: any) => val === undefined || val === null || String(val).trim() === "")) {
            return;
          }

          const dniRaw = cleanString(row[0]);
          const apellidosNombresRaw = cleanString(row[1]);
          const gradoRaw = cleanString(row[2]);
          const seccionRaw = cleanString(row[3]);
          const correoRaw = cleanString(row[4]);
          const celularRaw = cleanString(row[5]);
          const fechaNacimientoRaw = parseExcelDate(row[6]);
          const especialidadRaw = cleanString(row[7]);
          const condicionRaw = cleanString(row[8]);
          const escalaRaw = cleanString(row[9]);
          const jornadaLaboralRaw = Number(row[10]);

          const rowErrors: string[] = [];
          
          // DNI Validations
          if (!dniRaw) {
            rowErrors.push("El DNI es obligatorio.");
          } else if (!/^\d{8}$/.test(dniRaw)) {
            rowErrors.push("El DNI debe tener exactamente 8 dígitos numéricos.");
          }

          // Nombres
          if (!apellidosNombresRaw) {
            rowErrors.push("Los Apellidos y Nombres son obligatorios.");
          } else if (apellidosNombresRaw.length < 5) {
            rowErrors.push("Ingrese el nombre completo y apellidos (ej: Pérez, Juan).");
          }

          // Grado Matcher (Normalized trim case)
          let resolvedGrado = GRADOS_LIST.find(
            (g) => g.toLowerCase() === gradoRaw.toLowerCase()
          ) || "";
          if (!gradoRaw) {
            rowErrors.push("El Grado / Cargo es obligatorio.");
          } else if (!resolvedGrado) {
            rowErrors.push(`Grado inválido: "${gradoRaw}". Use valores recomendados.`);
          }

          // Sección Matcher
          let resolvedSeccion = SECCIONES_LIST.find(
            (s) => s.toLowerCase() === seccionRaw.toLowerCase()
          ) || "";
          if (!seccionRaw) {
            rowErrors.push("La Sección es obligatoria.");
          } else if (!resolvedSeccion) {
            rowErrors.push(`Sección inválida: "${seccionRaw}". Use valores recomendados.`);
          }

          // Correo
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!correoRaw) {
            rowErrors.push("El Correo electrónico es obligatorio.");
          } else if (!emailRegex.test(correoRaw)) {
            rowErrors.push("Formato de Correo electrónico no válido.");
          }

          // Celular
          if (!celularRaw) {
            rowErrors.push("El Celular es obligatorio.");
          } else if (!/^\d{9}$/.test(celularRaw)) {
            rowErrors.push("El Celular debe tener exactamente 9 dígitos.");
          } else if (!celularRaw.startsWith("9")) {
            rowErrors.push("El Celular debe comenzar con el dígito 9.");
          }

          // Fecha de Nacimiento
          if (!fechaNacimientoRaw) {
            rowErrors.push("La Fecha de Nacimiento es obligatoria.");
          } else {
            const birthDate = new Date(fechaNacimientoRaw);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }

            if (isNaN(birthDate.getTime())) {
              rowErrors.push(`Formato de fecha inválido: "${row[6]}". Use YYYY-MM-DD o DD/MM/AAAA.`);
            } else if (birthDate > today) {
              rowErrors.push("La Fecha de Nacimiento no puede estar en el futuro.");
            } else if (age < 18) {
              rowErrors.push(`El docente debe ser mayor de edad. Edad: ${age} años.`);
            } else if (age > 80) {
              rowErrors.push(`La edad excede los límites académicos activos (${age} años).`);
            }
          }

          // Especialidad
          if (!especialidadRaw) {
            rowErrors.push("La Especialidad Académica es obligatoria.");
          }

          // Condición Matcher
          let resolvedCondicion = CONDICIONES_LIST.find(
            (c) => c.toLowerCase() === condicionRaw.toLowerCase()
          ) || "";
          if (!condicionRaw) {
            rowErrors.push("La Condición laboral es obligatoria.");
          } else if (!resolvedCondicion) {
            rowErrors.push(`Condición inválida: "${condicionRaw}". Use: ${CONDICIONES_LIST.join("/")}.`);
          }

          // Escala Matcher
          let resolvedEscala = ESCALAS_LIST.find(
            (e) => e.toLowerCase() === escalaRaw.toLowerCase()
          ) || "";
          if (!escalaRaw) {
            rowErrors.push("La Escala Magisterial es obligatoria.");
          } else if (!resolvedEscala) {
            rowErrors.push(`Escala inválida: "${escalaRaw}". Use: ${ESCALAS_LIST.join("/")}.`);
          }

          // Jornada Laboral
          if (!row[10] && row[10] !== 0) {
            rowErrors.push("La Jornada Laboral es obligatoria.");
          } else if (!JORNADAS_LIST.includes(jornadaLaboralRaw as any)) {
            rowErrors.push(`Jornada laboral incorrecta: "${jornadaLaboralRaw}". Solo se permite: ${JORNADAS_LIST.join("/")} horas.`);
          }

          // Status calculation & File Duplicate tracking
          let status: ParsedRow["status"] = "valid";
          if (rowErrors.length > 0) {
            status = "invalid";
          } else if (dniRaw) {
            if (seenFlippedDnis[dniRaw] !== undefined) {
              status = "duplicate_file";
              rowErrors.push(`DNI duplicado repetido en este mismo excel (línea anterior: ${seenFlippedDnis[dniRaw]} y actual: ${i + 2}).`);
            } else if (existingDnis.includes(dniRaw)) {
              status = "duplicate_db";
            } else {
              seenFlippedDnis[dniRaw] = i + 2; // Keep row human reference index
            }
          }

          resultRows.push({
            index: i + 2,
            dni: dniRaw,
            apellidosNombres: apellidosNombresRaw || "",
            grado: resolvedGrado || gradoRaw || "Sin asignar",
            seccion: resolvedSeccion || seccionRaw || "Sin sección",
            correo: correoRaw.toLowerCase() || "",
            celular: celularRaw || "",
            fechaNacimiento: fechaNacimientoRaw || "",
            especialidad: especialidadRaw || "",
            condicion: resolvedCondicion || condicionRaw || "",
            escala: resolvedEscala || escalaRaw || "",
            jornadaLaboral: jornadaLaboralRaw || JORNADAS_LIST[0],
            errors: rowErrors,
            status,
          });
        });

        setParsedRows(resultRows);
      } catch (err) {
        alert("Error al leer el archivo de Excel: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "xlsx" || ext === "xls") {
        processFile(file);
      } else {
        alert("Por favor, suba únicamente archivos de Excel (.xlsx o .xls)");
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setParsedRows([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit parsed valid items
  const handleSaveImport = () => {
    const validRows = parsedRows.filter((r) => r.status === "valid" || r.status === "duplicate_db");
    
    if (validRows.length === 0) {
      alert("No hay registros válidos para importar. Corrija los errores en el Excel.");
      return;
    }

    const importedDocentes: Docente[] = validRows.map((r) => ({
      dni: r.dni,
      apellidosNombres: r.apellidosNombres,
      grado: r.grado,
      seccion: r.seccion,
      correo: r.correo,
      celular: r.celular,
      fechaNacimiento: r.fechaNacimiento,
      especialidad: r.especialidad,
      condicion: r.condicion,
      escala: r.escala,
      jornadaLaboral: r.jornadaLaboral,
    }));

    onUploadSuccess(importedDocentes);
  };

  const totalRows = parsedRows.length;
  const invalidRows = parsedRows.filter((r) => r.status === "invalid" || r.status === "duplicate_file").length;
  const duplicateDbRows = parsedRows.filter((r) => r.status === "duplicate_db").length;
  const validRowsCount = totalRows - invalidRows;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900/50 text-white px-6 py-4.5 relative border-b border-white/10">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 flex">
          <div className="w-[12px] bg-[#D92323] h-full"></div>
          <div className="w-full bg-white/20 h-full"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-red-500" />
            <h2 className="font-extrabold text-sm tracking-widest uppercase text-white/95">
              Carga Masiva desde Excel (.xlsx)
            </h2>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-200 cursor-pointer transition-all uppercase tracking-wide"
          >
            <Download className="w-3.5 h-3.5 text-red-400" />
            Descargar Plantilla
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Dropzone */}
        {totalRows === 0 ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
              dragActive
                ? "border-red-500 bg-red-950/10 scale-[0.99]"
                : "border-white/10 hover:border-white/25 hover:bg-white/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileInput}
            />
            <div className="w-14 h-14 bg-red-550/10 text-[#D92323] rounded-full flex items-center justify-center border border-red-500/20 shadow-inner">
              <Upload className="w-7 h-7" />
            </div>
            
            <div className="space-y-1 max-w-sm">
              <p className="text-sm font-extrabold text-white">
                Arrastre su archivo Excel de docentes aquí
              </p>
              <p className="text-xs text-slate-400">
                O haga clic para explorar sus archivos locales (soporta .xlsx y .xls)
              </p>
            </div>

            <div className="text-[10px] bg-slate-900/60 text-blue-200 border border-white/5 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 mt-2">
              <HelpCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>Se recomienda descargar y utilizar primero nuestra plantilla para evitar errores de validación.</span>
            </div>
          </div>
        ) : (
          /* File loaded stats dashboard */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/40 p-4 border border-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-500/10 text-green-400 rounded-lg border border-green-500/10">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-mono text-slate-400 uppercase tracking-wide">Archivo cargado exitosamente</p>
                  <p className="text-sm font-black text-rose-100">{fileName}</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-2 bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-all border border-white/5 cursor-pointer"
                title="Quitar archivo excel"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Dashboard Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/20 border border-white/5 rounded-xl p-3.5 text-center">
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">Total Filas</p>
                <p className="text-2xl font-black text-white mt-1">{totalRows}</p>
              </div>

              <div className="bg-green-950/15 border border-green-500/15 rounded-xl p-3.5 text-center">
                <p className="text-[10px] text-green-400 font-mono uppercase tracking-wide">Válidos para Enviar</p>
                <p className="text-2xl font-black text-green-400 mt-1">{validRowsCount - duplicateDbRows}</p>
              </div>

              <div className="bg-orange-950/15 border border-orange-500/15 rounded-xl p-3.5 text-center">
                <p className="text-[10px] text-orange-450 font-mono uppercase tracking-wide">Duplicados BD (Sobrescribe)</p>
                <p className="text-2xl font-black text-orange-400 mt-1">{duplicateDbRows}</p>
              </div>

              <div className="bg-red-950/15 border border-[#D92323]/15 rounded-xl p-3.5 text-center">
                <p className="text-[10px] text-red-400 font-mono uppercase tracking-wide">Filas con Errores</p>
                <p className="text-2xl font-black text-red-400 mt-1">{invalidRows}</p>
              </div>
            </div>

            {/* Render Preview Table */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-950/10">
              <div className="bg-slate-900/60 px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-300 tracking-wider">Detalle del Archivo / Reporte de Fila</span>
                <span className="text-[10px] text-slate-400 font-mono">Los registros con errores serán ignorados de la importación</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/30 text-blue-200 border-b border-white/5 font-bold">
                      <th className="py-2.5 px-3 text-center"># Fila</th>
                      <th className="py-2.5 px-3">DNI</th>
                      <th className="py-2.5 px-3">Docente</th>
                      <th className="py-2.5 px-3">Cargo/Grado</th>
                      <th className="py-2.5 px-3">Especialidad</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Observaciones / Alertas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr
                        key={row.index}
                        className={`border-b border-white/5 hover:bg-white/5 transition-all ${
                          row.status === "invalid" || row.status === "duplicate_file"
                            ? "bg-red-500/5"
                            : row.status === "duplicate_db"
                            ? "bg-orange-500/5"
                            : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-450 font-mono">{row.index}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{row.dni || "VACÍO"}</td>
                        <td className="py-2.5 px-3 font-extrabold text-white">{row.apellidosNombres || "SÍN NOMBRE"}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {row.grado} / {row.seccion}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{row.especialidad}</td>
                        <td className="py-2.5 px-3">
                          {row.status === "invalid" || row.status === "duplicate_file" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/40 text-red-400 border border-red-500/20">
                              Error
                            </span>
                          ) : row.status === "duplicate_db" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950/40 text-orange-400 border border-orange-500/20">
                              Existe
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-950/40 text-green-400 border border-green-500/20">
                              Válido
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-[11px] text-slate-350">
                          {row.errors.length > 0 ? (
                            <div className="text-red-400 font-medium space-y-0.5">
                              {row.errors.map((err, errIdx) => (
                                <div key={errIdx} className="flex items-center gap-1">
                                  <span className="w-1 h-1 bg-red-405 rounded-full inline-block"></span>
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          ) : row.status === "duplicate_db" ? (
                            <span className="text-orange-350 flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-orange-400" />
                              DNI registrado. Se actualizarán los datos.
                            </span>
                          ) : (
                            <span className="text-green-350 font-medium">Todo conforme</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Support instructions inside loading mode */}
        {totalRows === 0 && (
          <div className="bg-[#0B1E36]/30 border border-white/5 rounded-xl p-5 text-xs text-slate-450 leading-relaxed space-y-2">
            <p className="font-bold text-slate-200 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              Requisitos de archivo
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Admite el formato oficial de columnas prefabricado en la plantilla.</li>
              <li>Las cabeceras de columnas deben ir estrictamente en la <strong>primera fila</strong> de la primera hoja.</li>
              <li>El sistema validará en su celular, edad para docencia (18 - 80 años) y campos reglamentarios del aula.</li>
              <li>Si un DNI ya existe en el padrón, el programa se encargará de realizar una <strong>actualización segura</strong>.</li>
            </ul>
          </div>
        )}

        {/* Sticky Action Buttons */}
        <div className="pt-5 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
          >
            Atrás / Cancelar
          </button>
          
          {totalRows > 0 && (
            <button
              type="button"
              disabled={validRowsCount === 0 || isProcessing}
              onClick={handleSaveImport}
              className={`px-6 py-2.5 border text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                validRowsCount === 0 || isProcessing
                  ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-red-650/15 hover:bg-[#D92323] text-red-400 hover:text-white border-[#D92323]/35"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Confirmar Importación ({validRowsCount} filas)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
