import React, { useState } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  User, 
  Key, 
  LogIn, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Building2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  LogOut
} from "lucide-react";
import { SCHOOL_LOGO_PATH } from "../assets/schoolLogo";
import { Docente, AuthUser, SecurityConfig } from "../types";
import { 
  signInWithGoogle, 
  signOutFirebase, 
  evaluateGoogleAuthorization, 
  evaluateInstitutionalCredentialAccess,
  DEFAULT_ADMIN_EMAIL
} from "../firebase";

interface LoginScreenProps {
  docentes: Docente[];
  securityConfig: SecurityConfig;
  onLoginSuccess: (user: AuthUser) => void;
}

export default function LoginScreen({
  docentes,
  securityConfig,
  onLoginSuccess
}: LoginScreenProps) {
  const [authTab, setAuthTab] = useState<"google" | "institutional">("google");
  
  // Institutional Credential Form State
  const [dni, setDni] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  // Status & Errors
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deniedUser, setDeniedUser] = useState<{ email: string; reason: string } | null>(null);
  const [showDemoHelp, setShowDemoHelp] = useState(false);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setDeniedUser(null);

    try {
      const fbUser = await signInWithGoogle();
      
      // Evaluate if the Google user is authorized
      const authResult = evaluateGoogleAuthorization(
        {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL
        },
        docentes,
        securityConfig
      );

      if (authResult.isAuthorized && authResult.authUser) {
        onLoginSuccess(authResult.authUser);
      } else {
        // Sign out unauthorized user immediately
        await signOutFirebase();
        setDeniedUser({
          email: fbUser.email || "Cuenta desconocida",
          reason: authResult.rejectionReason || "Acceso exclusivo para personal docente y directivo autorizado."
        });
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errStr = String(err);
      if (errStr.includes("popup-closed-by-user")) {
        setErrorMessage("La ventana de inicio de sesión de Google fue cerrada antes de completar el ingreso.");
      } else if (errStr.includes("cancelled-popup-request")) {
        setErrorMessage("Petición de ingreso cancelada. Intente de nuevo.");
      } else {
        setErrorMessage("Ocurrió un inconveniente al conectar con el servicio de autenticación de Google. Puede ingresar también utilizando su DNI y Clave Institucional.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Institutional Credential Login
  const handleInstitutionalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setDeniedUser(null);

    if (!dni.trim()) {
      setErrorMessage("Por favor ingrese su número de DNI.");
      return;
    }

    if (!pin.trim()) {
      setErrorMessage("Por favor ingrese la Clave de Seguridad Institucional AIP.");
      return;
    }

    setIsLoading(true);

    try {
      const authResult = evaluateInstitutionalCredentialAccess(
        dni,
        pin,
        docentes,
        securityConfig
      );

      if (authResult.success && authResult.authUser) {
        onLoginSuccess(authResult.authUser);
      } else {
        setErrorMessage(authResult.errorMessage || "Credenciales no válidas para esta institución.");
      }
    } catch (err) {
      console.error("Institutional login error:", err);
      setErrorMessage("Error al validar credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill for test / demo teacher
  const handleSelectSampleDocente = (sampleDni: string) => {
    setDni(sampleDni);
    setPin(securityConfig.institutionalPin || "AIP24009");
    setAuthTab("institutional");
    setErrorMessage(null);
    setDeniedUser(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      
      {/* Background Institutional Pattern & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-black pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Peruvian Flag Decorative Ribbon */}
      <header className="relative z-10 w-full">
        <div className="h-1.5 w-full flex shadow-sm">
          <div className="w-[18%] bg-[#D92323] h-full" />
          <div className="w-[64%] bg-white h-full" />
          <div className="w-[18%] bg-[#D92323] h-full" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">MINISTERIO DE EDUCACIÓN</span>
            <span className="text-slate-600">•</span>
            <span>DREA AYACUCHO</span>
            <span className="text-slate-600">•</span>
            <span>UGEL LUCANAS</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Servidor Seguro AIP Activo</span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          
          {/* Card Frame */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
            
            {/* Institution Brand Header */}
            <div className="text-center space-y-3">
              <div className="inline-block relative">
                <div className="w-20 h-24 sm:w-22 sm:h-26 mx-auto bg-white rounded-2xl p-2 border border-slate-700/60 shadow-xl flex items-center justify-center">
                  <img 
                    src={SCHOOL_LOGO_PATH} 
                    alt="Escudo Oficial I.E.P.M. N° 24009 Túpac Amaru II" 
                    className="w-full h-full object-contain filter drop-shadow-xs" 
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 bg-[#D92323] text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-900 shadow-xs font-mono">
                  PUQUIO
                </span>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest font-mono mb-1.5">
                  <Building2 className="w-3 h-3" />
                  <span>I.E.P.M. N° 24009 “TÚPAC AMARU II”</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Aula de Innovación Pedagógica
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Sistema de Gestión Escolar & Control de Asistencia AIP
                </p>
              </div>

              {/* Strict Privacy Notice */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5 text-left">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <p className="font-bold text-[11px] text-amber-300 uppercase tracking-wide">
                    Acceso Privado & Restringido
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Plataforma institucional de uso exclusivo para el personal docente y directivo autorizado. <strong>Prohibido el acceso a terceros.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* THIRD-PARTY DENIED ALERT SCREEN */}
            {deniedUser && (
              <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-left space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-900/50 rounded-lg shrink-0 border border-red-700/50">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-red-300 uppercase tracking-wider">
                      Acceso Denegado (403 Prohibido)
                    </h2>
                    <p className="text-[11px] text-slate-300 mt-1 font-mono break-all">
                      Cuenta: <span className="text-white font-bold">{deniedUser.email}</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-red-200 leading-relaxed bg-red-900/30 p-2.5 rounded-lg border border-red-800/40">
                  {deniedUser.reason}
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDeniedUser(null);
                      setAuthTab("institutional");
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Ingresar con DNI y Clave Institucional</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeniedUser(null);
                      handleGoogleLogin();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Intentar con otra Cuenta Google</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && !deniedUser && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Auth Tab Switcher */}
            {!deniedUser && (
              <>
                <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("google");
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authTab === "google"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google Oficial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("institutional");
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authTab === "institutional"
                        ? "bg-[#D92323] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>DNI + Clave AIP</span>
                  </button>
                </div>

                {/* TAB 1: GOOGLE AUTH */}
                {authTab === "google" && (
                  <div className="space-y-4 pt-1">
                    <div className="text-center space-y-1">
                      <p className="text-xs text-slate-300 font-medium">
                        Autenticación con Cuenta Google Institucional
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Inicie sesión con su correo registrado como docente o directivo de la institución.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group border border-slate-200"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      )}
                      <span>Ingresar con Google Autorizado</span>
                    </button>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Filtro Anti-Terceros:</span>
                      </div>
                      <p>
                        Si ingresa con una cuenta personal no registrada en el padrón de la I.E. 24009, el sistema <strong>bloqueará automáticamente el acceso</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: INSTITUTIONAL CREDENTIAL (DNI + PIN) */}
                {authTab === "institutional" && (
                  <form onSubmit={handleInstitutionalLogin} className="space-y-4 pt-1">
                    <div className="text-center space-y-1">
                      <p className="text-xs text-slate-300 font-medium">
                        Acceso por Padrón Docente de la I.E.P.M. 24009
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Ideal para computadoras compartidas del AIP y docentes sin cuenta Google activa.
                      </p>
                    </div>

                    {/* DNI Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-red-400" />
                          DNI del Docente / Responsable
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">8 dígitos</span>
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        value={dni}
                        onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ej: 45892147 o 24009"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm placeholder:text-slate-500 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                        required
                      />
                    </div>

                    {/* PIN Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          Clave Institucional AIP
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Clave Privada</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? "text" : "password"}
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="Clave de seguridad institucional"
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-[#D92323] hover:bg-red-700 text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                      <span>Validar y Entrar al Sistema</span>
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Quick Helper / Demo Credentials Toggle */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDemoHelp(!showDemoHelp)}
                className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer py-1"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  ¿Cómo acceder o solicitar autorización?
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  {showDemoHelp ? "Ocultar" : "Ver información"}
                </span>
              </button>

              {showDemoHelp && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 space-y-2 text-left">
                  <div>
                    <p className="font-bold text-slate-200 text-[11px]">
                      1. Administrador del Sistema / PIP:
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Prof. Martin Herick Cahuana Mendoza ({DEFAULT_ADMIN_EMAIL})
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Ingreso directo maestro: DNI <code className="text-amber-300 font-bold">24009</code> y Clave <code className="text-amber-300 font-bold">AIP24009</code>
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-200 text-[11px]">
                      2. Docentes Registrados de la I.E. 24009 ({docentes.length} en padrón):
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Ingrese con su DNI registrado y la clave institucional <code className="text-amber-300 font-bold">AIP24009</code>.
                    </p>
                    {docentes.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {docentes.slice(0, 3).map((d) => (
                          <button
                            key={d.dni}
                            type="button"
                            onClick={() => handleSelectSampleDocente(d.dni)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-mono border border-slate-700 cursor-pointer"
                            title={`Ingresar como ${d.apellidosNombres}`}
                          >
                            DNI {d.dni} ({d.apellidosNombres.split(",")[0]})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <p>
                      Para altas o modificación de accesos, contacte a la Dirección o al PIP institucional.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Security & Cloud Badge */}
          <div className="mt-4 text-center text-slate-500 text-[11px] flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Protección y Respaldo Cloud Firestore • Puquio, Lucanas, Ayacucho</span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 text-center text-slate-400 text-[11px] border-t border-slate-900 bg-slate-950/80">
        <p>
          I.E.P.M. N° 24009 “Túpac Amaru II” • Ccollana Alta, Puquio, Lucanas • Cód. Modular: 0361493
        </p>
      </footer>

    </div>
  );
}
