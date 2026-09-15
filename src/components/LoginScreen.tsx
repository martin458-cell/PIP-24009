import React, { useState } from "react";
import { 
  Lock, 
  User, 
  Key, 
  LogIn, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  ShieldCheck
} from "lucide-react";
import { SCHOOL_LOGO_PATH } from "../assets/schoolLogo";
import { AuthUser, SecurityConfig, Docente } from "../types";
import { evaluateSingleAccessLogin } from "../firebase";

interface LoginScreenProps {
  securityConfig: SecurityConfig;
  onLoginSuccess: (user: AuthUser) => void;
  docentes?: Docente[];
}

export default function LoginScreen({
  securityConfig,
  onLoginSuccess
}: LoginScreenProps) {
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem("iepm_last_login_user") || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = evaluateSingleAccessLogin(username, password, securityConfig);
      
      if (result.success && result.authUser) {
        if (rememberMe) {
          try {
            localStorage.setItem("iepm_last_login_user", username.trim());
          } catch (err) {
            console.warn("Storage warning:", err);
          }
        }
        onLoginSuccess(result.authUser);
      } else {
        setErrorMessage(result.errorMessage || "Usuario o contraseña incorrectos.");
      }
    } catch (err) {
      setErrorMessage("Ocurrió un error inesperado al comprobar las credenciales.");
      console.error("Login verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative selection:bg-red-600 selection:text-white">
      
      {/* Background Subtle Accent */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: "28px 28px"
        }}
      />

      {/* Top Simple Ribbon */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-slate-700 shadow-sm flex items-center justify-center shrink-0">
              <img
                src={SCHOOL_LOGO_PATH}
                alt="Insignia 24009"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-black tracking-wider uppercase text-white">
                I.E.P.M. N° 24009 TÚPAC AMARU II
              </p>
              <p className="text-[10px] text-slate-400">
                Puquio, Lucanas • Aula de Innovación Pedagógica (AIP)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-medium hidden sm:inline text-slate-300">
              Acceso Privado
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Top Red Accent Strip */}
            <div className="h-1.5 bg-linear-to-r from-red-600 via-red-500 to-amber-500 w-full" />

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Header inside Card */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-xl bg-white p-1.5 shadow-lg border border-slate-700/60 mx-auto flex items-center justify-center">
                  <img
                    src={SCHOOL_LOGO_PATH}
                    alt="Escudo Institucional"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <h1 className="text-xl font-black text-white tracking-tight">
                    Iniciar Sesión
                  </h1>
                  <p className="text-xs text-slate-400">
                    Ingrese su usuario y contraseña para acceder al sistema.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-800/80 flex items-start gap-2.5 text-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Simple Login Form: Usuario y Contraseña */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Field: Usuario */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Usuario
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="Ingrese su usuario"
                      autoFocus
                      required
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Field: Contraseña */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="Ingrese su contraseña"
                      required
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer transition-colors p-1"
                      title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-sm bg-slate-950 border-slate-700 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                    />
                    <span>Recordar mi usuario</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !username || !password}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Ingresando...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Ingresar</span>
                    </>
                  )}
                </button>

              </form>

            </div>
          </div>

          {/* Institutional Credits */}
          <div className="text-center mt-6 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-400">
              I.E.P.M. N° 24009 &quot;Túpac Amaru II&quot; — Puquio
            </p>
            <p className="text-[11px] text-slate-400">
              Derechos de autor: <span className="font-bold text-slate-300">Bach. Martín H. Cahuana Mendoza</span>
            </p>
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950 px-4 py-2.5 text-center text-[11px] text-slate-500">
        Sistema Institucional AIP — Acceso Privado
      </footer>

    </div>
  );
}
