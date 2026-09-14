import React, { useState } from "react";
import { 
  ShieldCheck, 
  X, 
  Key, 
  UserCheck, 
  Mail, 
  Plus, 
  Trash2, 
  Lock, 
  Check, 
  AlertCircle,
  Users,
  ShieldAlert,
  Save,
  Building2
} from "lucide-react";
import { SecurityConfig, Docente, AuthUser } from "../types";
import { DEFAULT_ADMIN_EMAIL, saveSecurityConfigToFirebase } from "../firebase";

interface SecurityAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityConfig: SecurityConfig;
  docentes: Docente[];
  currentUser: AuthUser | null;
  onUpdateSecurityConfig: (updated: SecurityConfig) => void;
}

export default function SecurityAccessModal({
  isOpen,
  onClose,
  securityConfig,
  docentes,
  currentUser,
  onUpdateSecurityConfig
}: SecurityAccessModalProps) {
  if (!isOpen) return null;

  const [newEmail, setNewEmail] = useState("");
  const [pin, setPin] = useState(securityConfig.institutionalPin || "AIP24009");
  const [emails, setEmails] = useState<string[]>(securityConfig.whitelistedEmails || []);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isMasterAdmin = currentUser?.role === "admin" || currentUser?.email === DEFAULT_ADMIN_EMAIL;

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setStatusMessage({ type: "error", text: "Ingrese un correo electrónico válido." });
      return;
    }
    if (emails.some((em) => em.toLowerCase() === clean)) {
      setStatusMessage({ type: "error", text: "Este correo ya se encuentra en la lista autorizada." });
      return;
    }

    setEmails([...emails, clean]);
    setNewEmail("");
    setStatusMessage({ type: "success", text: "Correo agregado a la lista temporal. Guarde los cambios para aplicar." });
  };

  const handleRemoveEmail = (target: string) => {
    if (target.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      setStatusMessage({ type: "error", text: "El correo del administrador PIP principal no se puede eliminar." });
      return;
    }
    setEmails(emails.filter((em) => em.toLowerCase() !== target.toLowerCase()));
    setStatusMessage({ type: "success", text: "Correo retirado de la lista temporal. Guarde los cambios." });
  };

  const handleSave = async () => {
    if (!pin.trim()) {
      setStatusMessage({ type: "error", text: "La clave institucional no puede quedar vacía." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const updated: SecurityConfig = {
      ...securityConfig,
      institutionalPin: pin.trim(),
      whitelistedEmails: emails,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveSecurityConfigToFirebase(updated);
      onUpdateSecurityConfig(updated);
      setStatusMessage({ type: "success", text: "Configuración de seguridad y accesos actualizada correctamente en la nube." });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Error saving security config:", err);
      setStatusMessage({ type: "error", text: "Error al guardar la configuración en la base de datos." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-600 text-white font-mono">
                  Seguridad Institucional
                </span>
                <span className="text-xs text-slate-400 font-mono">Control de Acceso</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Filtro de Usuarios & Clave Institucional
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700">
          
          {/* Status notification */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {statusMessage.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Current Policy Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-slate-900">
                Política de Privacidad Estricta: Terceros Bloqueados
              </p>
              <p className="text-slate-600">
                Cualquier cuenta o persona ajena al padrón oficial de la I.E. 24009 tiene el acceso denegado por el sistema. Sólo tienen acceso:
              </p>
              <ul className="mt-1 list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                <li>El Profesor de Innovación Pedagógica (PIP) Administrador.</li>
                <li>Los <strong>{docentes.length} docentes</strong> registrados con su DNI y correo oficial.</li>
                <li>Los correos autorizados expresamente en la lista blanca inferior.</li>
              </ul>
            </div>
          </div>

          {/* Institutional Pin Configuration */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                Clave Institucional de Acceso AIP
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Uso interno docentes</span>
            </div>
            <p className="text-xs text-slate-500">
              Esta clave de seguridad es requerida para el ingreso de docentes mediante DNI en computadoras de la escuela.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={pin}
                disabled={!isMasterAdmin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ej: AIP24009"
                className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:outline-hidden focus:border-red-500 focus:bg-white transition-all disabled:opacity-60"
              />
              {!isMasterAdmin && (
                <span className="text-[11px] text-slate-400">Solo el Administrador PIP puede cambiar la clave.</span>
              )}
            </div>
          </div>

          {/* Authorized Emails Whitelist */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Lista Blanca de Correos Autorizados ({emails.length})
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Filtro Google</span>
            </div>

            <p className="text-xs text-slate-500">
              Las cuentas Google añadidas aquí podrán iniciar sesión directamente en la plataforma.
            </p>

            {isMasterAdmin && (
              <form onSubmit={handleAddEmail} className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com o usuario@iepm24009.edu.pe"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </form>
            )}

            {/* List of Whitelisted Emails */}
            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {emails.map((em) => {
                const isMaster = em.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();
                return (
                  <div
                    key={em}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="font-mono text-slate-800 font-medium">{em}</span>
                      {isMaster && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          Admin PIP
                        </span>
                      )}
                    </div>
                    {isMasterAdmin && !isMaster && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(em)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar de la lista blanca"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registered Teachers Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-slate-600" />
              <div>
                <p className="font-bold text-slate-800">
                  {docentes.length} Docentes Registrados en el Padrón
                </p>
                <p className="text-[11px] text-slate-500">
                  Tienen acceso automático habilitado con su DNI oficial de 8 dígitos.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {isMasterAdmin && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#D92323] hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Guardar Cambios de Seguridad</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
