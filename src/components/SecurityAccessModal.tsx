import React, { useState } from "react";
import { 
  X, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Save,
  Eye,
  EyeOff,
  User,
  Lock
} from "lucide-react";
import { SecurityConfig, AuthUser, Docente } from "../types";
import { saveSecurityConfigToFirebase } from "../firebase";

interface SecurityAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityConfig: SecurityConfig;
  onUpdateSecurityConfig: (updated: SecurityConfig) => void;
  currentUser: AuthUser | null;
  docentes?: Docente[];
}

export default function SecurityAccessModal({
  isOpen,
  onClose,
  securityConfig,
  onUpdateSecurityConfig
}: SecurityAccessModalProps) {
  if (!isOpen) return null;

  const [adminUser, setAdminUser] = useState(securityConfig.adminUsername || "admin");
  const [adminPass, setAdminPass] = useState(securityConfig.adminPassword || "AIP24009");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser.trim()) {
      setStatusMessage({ type: "error", text: "El usuario no puede quedar vacío." });
      return;
    }
    if (!adminPass.trim()) {
      setStatusMessage({ type: "error", text: "La contraseña no puede quedar vacía." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const updated: SecurityConfig = {
      ...securityConfig,
      adminUsername: adminUser.trim(),
      adminPassword: adminPass.trim(),
      institutionalPin: adminPass.trim(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveSecurityConfigToFirebase(updated);
      onUpdateSecurityConfig(updated);
      setStatusMessage({ type: "success", text: "Credenciales actualizadas correctamente en el sistema." });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Error saving security config:", err);
      setStatusMessage({ type: "error", text: "Error al guardar en la base de datos." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-600 text-white font-mono">
                Seguridad AIP
              </span>
              <h2 className="text-base font-black text-white">
                Cambiar Usuario y Contraseña
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

        {/* Modal Body / Form */}
        <form onSubmit={handleSave}>
          <div className="p-5 space-y-4">
            
            {statusMessage && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-red-50 border-red-300 text-red-800"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span className="font-semibold">{statusMessage.text}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Defina el usuario y la contraseña necesarios para ingresar al sistema del Aula de Innovación Pedagógica.
            </p>

            {/* Field: Usuario */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:outline-hidden focus:border-red-500 focus:bg-white transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Field: Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {showAdminPass ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showAdminPass ? "text" : "password"}
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="Contraseña"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:outline-hidden focus:border-red-500 focus:bg-white transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                >
                  {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Guardar Credenciales</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
