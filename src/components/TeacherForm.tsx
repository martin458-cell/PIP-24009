import React, { useState, useEffect } from "react";
import { Docente, ESPECIALIDADES_LIST, GRADOS_LIST, SECCIONES_LIST, CONDICIONES_LIST, ESCALAS_LIST, JORNADAS_LIST } from "../types";
import { UserPlus, Save, X } from "lucide-react";

interface TeacherFormProps {
  initialData?: Docente | null;
  onSubmit: (docente: Docente) => void;
  onCancel: () => void;
  existingDnis: string[];
}

export default function TeacherForm({
  initialData,
  onSubmit,
  onCancel,
  existingDnis,
}: TeacherFormProps) {
  const isEditing = !!initialData;

  // Form states
  const [dni, setDni] = useState("");
  const [apellidosNombres, setApellidosNombres] = useState("");
  const [grado, setGrado] = useState(GRADOS_LIST[0]);
  const [seccion, setSeccion] = useState(SECCIONES_LIST[0]);
  const [correo, setCorreo] = useState("");
  const [celular, setCelular] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [especialidad, setEspecialidad] = useState(ESPECIALIDADES_LIST[0]);
  const [otraEspecialidad, setOtraEspecialidad] = useState("");
  const [condicion, setCondicion] = useState(CONDICIONES_LIST[0]);
  const [escala, setEscala] = useState(ESCALAS_LIST[0]);
  const [jornadaLaboral, setJornadaLaboral] = useState<number>(JORNADAS_LIST[0]);

  // Validation states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Effect to populate form when in edit mode
  useEffect(() => {
    if (initialData) {
      setDni(initialData.dni);
      setApellidosNombres(initialData.apellidosNombres);
      setGrado(initialData.grado);
      setSeccion(initialData.seccion);
      setCorreo(initialData.correo);
      setCelular(initialData.celular);
      setFechaNacimiento(initialData.fechaNacimiento);

      // Check if current specialty is in pre-defined list
      const isPredefined = (ESPECIALIDADES_LIST as string[]).includes(initialData.especialidad);
      if (isPredefined) {
        setEspecialidad(initialData.especialidad as any);
        setOtraEspecialidad("");
      } else {
        setEspecialidad("Otra");
        setOtraEspecialidad(initialData.especialidad);
      }
      setCondicion(initialData.condicion || CONDICIONES_LIST[0]);
      setEscala(initialData.escala || ESCALAS_LIST[0]);
      setJornadaLaboral(initialData.jornadaLaboral || JORNADAS_LIST[0]);
    } else {
      // Clear form
      setDni("");
      setApellidosNombres("");
      setGrado(GRADOS_LIST[0]);
      setSeccion(SECCIONES_LIST[0]);
      setCorreo("");
      setCelular("");
      setFechaNacimiento("");
      setEspecialidad(ESPECIALIDADES_LIST[0]);
      setOtraEspecialidad("");
      setCondicion(CONDICIONES_LIST[0]);
      setEscala(ESCALAS_LIST[0]);
      setJornadaLaboral(JORNADAS_LIST[0]);
    }
    setErrors({});
  }, [initialData]);

  // Handle DNI input constraints (digits only, max 8)
  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 8) {
      setDni(val);
    }
  };

  // Handle Phone input constraints (digits only, max 9)
  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 9) {
      setCelular(val);
    }
  };

  // Main validator
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 1. DNI validation
    if (!dni) {
      newErrors.dni = "El DNI es obligatorio.";
    } else if (dni.length !== 8) {
      newErrors.dni = "El DNI debe tener exactamente 8 dígitos.";
    } else if (!isEditing && existingDnis.includes(dni)) {
      newErrors.dni = "Este DNI ya pertenece a un docente registrado.";
    }

    // 2. Apellidos y Nombres
    if (!apellidosNombres.trim()) {
      newErrors.apellidosNombres = "Los apellidos y nombres son obligatorios.";
    } else if (apellidosNombres.trim().length < 5) {
      newErrors.apellidosNombres = "Ingrese el nombre completo (ej. Quispe, Juan).";
    }

    // 3. Correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo) {
      newErrors.correo = "El correo electrónico es obligatorio.";
    } else if (!emailRegex.test(correo)) {
      newErrors.correo = "Ingrese un correo electrónico válido.";
    }

    // 4. Celular
    if (!celular) {
      newErrors.celular = "El número de celular es obligatorio.";
    } else if (celular.length !== 9) {
      newErrors.celular = "El celular debe tener exactamente 9 dígitos.";
    } else if (!celular.startsWith("9")) {
      newErrors.celular = "El celular de docente debe comenzar con el dígito 9.";
    }

    // 5. Fecha de Nacimiento
    if (!fechaNacimiento) {
      newErrors.fechaNacimiento = "La fecha de nacimiento es obligatoria.";
    } else {
      const birthDate = new Date(fechaNacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (birthDate > today) {
        newErrors.fechaNacimiento = "La fecha de nacimiento no puede ser en el futuro.";
      } else if (age < 18) {
        newErrors.fechaNacimiento = `El docente debe ser mayor de edad. Edad calculada: ${age} años.`;
      } else if (age > 80) {
        newErrors.fechaNacimiento = `Edad inválida o excede la límite para docencia activa (${age} años).`;
      }
    }

    // 6. Especialidad Académica Custom Option
    if (especialidad === "Otra" && !otraEspecialidad.trim()) {
      newErrors.otraEspecialidad = "Escriba la especialidad correspondiente.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const finalEspecialidad = especialidad === "Otra" ? otraEspecialidad.trim() : especialidad;
      onSubmit({
        dni,
        apellidosNombres: apellidosNombres.trim(),
        grado,
        seccion,
        correo: correo.trim().toLowerCase(),
        celular,
        fechaNacimiento,
        especialidad: finalEspecialidad,
        condicion,
        escala,
        jornadaLaboral,
      });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full">
      {/* Form Header Accent (Navy/translucent backdrop with thin red-white indicator ribbon of the institution) */}
      <div className="bg-slate-50 text-slate-950 px-6 py-4.5 relative border-b border-slate-200">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 flex">
          <div className="w-[12px] bg-[#D92323] h-full"></div>
          <div className="w-full bg-slate-200 h-full"></div>
        </div>
        <div className="flex items-center gap-2.5">
          <UserPlus className="w-5 h-5 text-[#D92323]" />
          <h2 className="font-extrabold text-sm tracking-widest uppercase text-slate-800">
            {isEditing ? "Modificar Datos de Docente" : "Registrar Nuevo Docente"}
          </h2>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
        {/* DNI & CELULAR Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              DNI (Identificación) <span className="text-red-650">*</span>
            </label>
            <input
              type="text"
              value={dni}
              onChange={handleDniChange}
              disabled={isEditing}
              placeholder="8 dígitos"
              maxLength={8}
              className={`w-full px-3 py-2 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.dni
                  ? "border-red-500 focus:ring-red-500/10 text-red-700"
                  : "border-slate-200 text-slate-900 focus:border-[#D92323] focus:ring-red-500/10"
              } ${isEditing ? "opacity-65 cursor-not-allowed bg-slate-100 text-slate-500" : ""}`}
            />
            {errors.dni ? (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.dni}</p>
            ) : (
              <p className="mt-1 text-[10px] text-slate-500 font-medium">8 números. No puede modificarse luego.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Número de Celular <span className="text-red-650">*</span>
            </label>
            <input
              type="text"
              value={celular}
              onChange={handleCelularChange}
              placeholder="Ej. 987654321"
              maxLength={9}
              className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 ${
                errors.celular
                  ? "border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-[#D92323] focus:ring-red-500/10"
              }`}
            />
            {errors.celular ? (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.celular}</p>
            ) : (
              <p className="mt-1 text-[10px] text-slate-500 font-medium">9 números que inicien con 9.</p>
            )}
          </div>
        </div>

        {/* Apellidos y Nombres */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Apellidos y Nombres <span className="text-red-650">*</span>
          </label>
          <input
            type="text"
            value={apellidosNombres}
            onChange={(e) => setApellidosNombres(e.target.value)}
            placeholder="Ej: QUISPE FLORES, Carlos Alberto"
            className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 ${
              errors.apellidosNombres
                ? "border-red-500 focus:ring-red-500/10"
                : "border-slate-200 focus:border-[#D92323] focus:ring-red-500/10"
            }`}
          />
          {errors.apellidosNombres ? (
            <p className="mt-1 text-xs text-red-600 font-medium">{errors.apellidosNombres}</p>
          ) : (
            <p className="mt-1 text-[10px] text-slate-500 font-medium">Ingrese: APELLIDOS, Nombres (separado por coma).</p>
          )}
        </div>

        {/* Grado & Sección */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Grado Cargo <span className="text-red-650">*</span>
            </label>
            <select
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#D92323] focus:ring-2 focus:ring-red-500/10"
            >
              {GRADOS_LIST.map((g) => (
                <option key={g} value={g} className="text-slate-900 bg-white">
                  {g} {!g.startsWith("Inicial") && g !== "Administrativo" && g !== "Sin aula a cargo" && g !== "Director" && g !== "SubDirectora (e)" ? "Grado" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sección <span className="text-red-650">*</span>
            </label>
            <select
              value={seccion}
              onChange={(e) => setSeccion(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#D92323] focus:ring-2 focus:ring-red-500/10"
            >
              {SECCIONES_LIST.map((s) => (
                <option key={s} value={s} className="text-slate-900 bg-white">
                  Sección {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Correo Electrónico */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Correo Electrónico <span className="text-red-650">*</span>
          </label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="docente@iepm24009.edu.pe"
            className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 ${
              errors.correo
                ? "border-red-500 focus:ring-red-500/10"
                : "border-slate-200 focus:border-[#D92323] focus:ring-red-500/10"
            }`}
          />
          {errors.correo ? (
            <p className="mt-1 text-xs text-red-600 font-medium">{errors.correo}</p>
          ) : (
            <p className="mt-1 text-[10px] text-slate-500 font-medium">Correo para notificaciones institucionales.</p>
          )}
        </div>

        {/* Fecha de Nacimiento */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Fecha de Nacimiento <span className="text-red-650">*</span>
          </label>
          <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 ${
              errors.fechaNacimiento
                ? "border-red-500 focus:ring-red-550/20"
                : "border-slate-200 focus:border-[#D92323] focus:ring-red-500/25"
            }`}
          />
          {errors.fechaNacimiento ? (
            <p className="mt-1 text-xs text-red-605 font-medium">{errors.fechaNacimiento}</p>
          ) : (
            <p className="mt-1 text-[10px] text-slate-500 font-medium">Debe ser mayor de 18 años.</p>
          )}
        </div>

        {/* Especialidad Académica */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Especialidad Académica <span className="text-red-650">*</span>
          </label>
          <select
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#D92323] focus:ring-2 focus:ring-red-500/10"
          >
            {ESPECIALIDADES_LIST.map((spec) => (
              <option key={spec} value={spec} className="text-slate-900 bg-white">
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Specialty Field if 'Otra' selected */}
        {especialidad === "Otra" && (
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 animate-fadeIn text-slate-800">
            <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5">
              Especifique la especialidad <span className="text-red-505">*</span>
            </label>
            <input
              type="text"
              value={otraEspecialidad}
              onChange={(e) => setOtraEspecialidad(e.target.value)}
              placeholder="Ej: Lic. en Psicopedagogía, Educación Especial"
              className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D92323]/20 focus:border-[#D92323]`}
            />
            {errors.otraEspecialidad && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.otraEspecialidad}
              </p>
            )}
          </div>
        )}

        {/* Condición, Escala y Jornada Laboral */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4.5 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Condición <span className="text-red-650">*</span>
            </label>
            <select
              value={condicion}
              onChange={(e) => setCondicion(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-805 focus:outline-none focus:border-[#D92323] focus:ring-2 focus:ring-red-500/10"
            >
              {CONDICIONES_LIST.map((cond) => (
                <option key={cond} value={cond} className="text-slate-900 bg-white">
                  {cond}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Escala Magisterial <span className="text-red-650">*</span>
            </label>
            <select
              value={escala}
              onChange={(e) => setEscala(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-805 focus:outline-none focus:border-[#D92323] focus:ring-2 focus:ring-red-500/10"
            >
              {ESCALAS_LIST.map((esc) => (
                <option key={esc} value={esc} className="text-slate-900 bg-white">
                  {esc === "Sin Escala" ? esc : `Escala ${esc}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jornada Laboral <span className="text-red-650">*</span>
            </label>
            <select
              value={jornadaLaboral}
              onChange={(e) => setJornadaLaboral(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-805 focus:outline-none focus:border-[#D92323] focus:ring-2 focus:ring-red-500/10"
            >
              {JORNADAS_LIST.map((jorn) => (
                <option key={jorn} value={jorn} className="text-slate-900 bg-white">
                  {jorn} Horas
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer font-bold flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm text-white bg-[#D92323] hover:bg-red-600 active:bg-red-800 rounded-xl transition-all cursor-pointer font-bold flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Guardar Cambios" : "Guardar Docente"}
          </button>
        </div>
      </form>
    </div>
  );
}
