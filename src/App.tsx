import { useState, useEffect } from "react";
import { Docente, RegistroAip, RegistroBiblioteca, LibroStock, SystemModule, DEFAULT_MODULES, ActiveTabType, FechaEspecial, AuthUser, SecurityConfig } from "./types";
import { INITIAL_DOCENTES } from "./initialData";
import { INITIAL_FECHAS_ESPECIALES } from "./initialSpecialDates";
import { 
  subscribeDocentes, 
  saveDocenteToFirebase, 
  deleteDocenteFromFirebase, 
  testConnection,
  subscribeRegistrosAip,
  saveRegistroAipToFirebase,
  deleteRegistroAipFromFirebase,
  subscribeRegistrosBiblioteca,
  saveRegistroBibliotecaToFirebase,
  deleteRegistroBibliotecaFromFirebase,
  INITIAL_BIBLIOTECA_RECORDS,
  subscribeLibrosStock,
  saveLibroStockToFirebase,
  deleteLibroStockFromFirebase,
  INITIAL_LIBROS_STOCK,
  subscribeFechasEspeciales,
  saveFechaEspecialToFirebase,
  deleteFechaEspecialFromFirebase,
  subscribeSecurityConfig,
  DEFAULT_SECURITY_CONFIG,
  signOutFirebase,
  onAuthStateChanged,
  auth,
  evaluateGoogleAuthorization
} from "./firebase";
import TopNavbar from "./components/TopNavbar";
import Sidebar from "./components/Sidebar";
import GlobalSearchModal from "./components/GlobalSearchModal";
import ReportsCenter from "./components/ReportsCenter";
import InstitutionalMetrics from "./components/InstitutionalMetrics";
import TeacherStats from "./components/TeacherStats";
import TeacherForm from "./components/TeacherForm";
import TeacherTable from "./components/TeacherTable";
import TeacherDetailModal from "./components/TeacherDetailModal";
import TeacherBulkUpload from "./components/TeacherBulkUpload";
import AipForm from "./components/AipForm";
import AipTable from "./components/AipTable";
import AipStats from "./components/AipStats";
import AipPdfReportModal from "./components/AipPdfReportModal";
import MonthlyReportModule from "./components/MonthlyReportModule";
import SpecialDatesCalendar from "./components/SpecialDatesCalendar";
import BibliotecaModule from "./components/BibliotecaModule";
import LoginScreen from "./components/LoginScreen";
import SecurityAccessModal from "./components/SecurityAccessModal";
import { SCHOOL_LOGO_PATH } from "./assets/schoolLogo";
import { 
  Bell, 
  HelpCircle, 
  School, 
  BookOpen, 
  ChevronRight, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  Monitor, 
  Users, 
  LayoutDashboard, 
  Library, 
  PlusCircle, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Edit2, 
  Upload, 
  FileText,
  Boxes,
  Home,
  Layers,
  Sparkles,
  Calendar,
  Activity,
  Award,
  FileSpreadsheet
} from "lucide-react";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTabType>("dashboard");
  const [docenteSubTab, setDocenteSubTab] = useState<"directorio" | "registro" | "excel">("directorio");
  const [aipSubTab, setAipSubTab] = useState<"historial" | "registro">("historial");

  // System Modules
  const [modules] = useState<SystemModule[]>(() => {
    try {
      localStorage.setItem("iepm_system_modules", JSON.stringify(DEFAULT_MODULES));
    } catch (e) {
      console.warn("Could not save modules locally:", e);
    }
    return DEFAULT_MODULES;
  });

  // Mobile and Global Modals
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Main Data Source States
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [registros, setRegistros] = useState<RegistroAip[]>([]);
  const [bibliotecaRegistros, setBibliotecaRegistros] = useState<RegistroBiblioteca[]>([]);
  const [librosStock, setLibrosStock] = useState<LibroStock[]>(INITIAL_LIBROS_STOCK);
  const [fechasEspeciales, setFechasEspeciales] = useState<FechaEspecial[]>([]);
  
  // View/Edit Modal States
  const [selectedDocenteForFicha, setSelectedDocenteForFicha] = useState<Docente | null>(null);
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);
  const [editingRegistro, setEditingRegistro] = useState<RegistroAip | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  // Authentication & Security State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem("iepm_auth_user");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not parse saved user:", e);
    }
    return null;
  });

  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(DEFAULT_SECURITY_CONFIG);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Custom Confirmation Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Persistent Hydration with Firebase Real-time Sync
  useEffect(() => {
    testConnection();

    // Subscribe to Security Configuration in Firestore
    const unsubscribeSecurity = subscribeSecurityConfig((cfg) => {
      setSecurityConfig(cfg);
    });

    // Firebase Auth State Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const authEval = evaluateGoogleAuthorization(
          {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL
          },
          docentes,
          securityConfig
        );
        if (authEval.isAuthorized && authEval.authUser) {
          setCurrentUser(authEval.authUser);
          try {
            localStorage.setItem("iepm_auth_user", JSON.stringify(authEval.authUser));
          } catch (e) {}
        }
      }
    });

    // Subscribe to teachers changes in Firestore
    const unsubscribeDocentes = subscribeDocentes(async (list) => {
      const hasSeeded = localStorage.getItem("iepm_firebase_seeded");
      if (list.length === 0 && !hasSeeded) {
        try {
          const savePromises = INITIAL_DOCENTES.map((d) => saveDocenteToFirebase(d));
          await Promise.all(savePromises);
          localStorage.setItem("iepm_firebase_seeded", "true");
          showToast("Datos iniciales de la IEPM cargados con éxito en Firebase.", "success");
        } catch (e) {
          console.error("Error seeding Firebase:", e);
        }
      } else {
        setDocentes(list);
      }
    }, (error) => {
      showToast("Error de sincronización con Firestore: " + error.message, "error");
    });

    // Subscribe to AIP registers in Firestore
    const unsubscribeAip = subscribeRegistrosAip((list) => {
      setRegistros(list);
    }, (error) => {
      showToast("Error de sincronización de AIP con Firestore: " + error.message, "error");
    });

    // Subscribe to Biblioteca Escolar registers in Firestore
    const unsubscribeBiblioteca = subscribeRegistrosBiblioteca(async (list) => {
      // Purge any sample/test records from the database
      const sampleIds = ["bib-2026-001", "bib-2026-002", "bib-2026-003"];
      const samplesToDelete = list.filter((r) => sampleIds.includes(r.id) || r.id.startsWith("bib-2026-00"));
      
      if (samplesToDelete.length > 0) {
        for (const s of samplesToDelete) {
          try {
            await deleteRegistroBibliotecaFromFirebase(s.id);
          } catch (e) {
            console.warn("Error borrando registro de muestra:", e);
          }
        }
      }

      // Filter out sample records immediately for UI display
      const realRecords = list.filter((r) => !sampleIds.includes(r.id) && !r.id.startsWith("bib-2026-00"));
      setBibliotecaRegistros(realRecords);
    }, (error) => {
      showToast("Error de sincronización de Biblioteca con Firestore: " + error.message, "error");
    });

    // Subscribe to Libros en Stock in Firestore (Inventario oficial)
    const unsubscribeLibrosStock = subscribeLibrosStock(async (list) => {
      const hasSeededLibros = localStorage.getItem("iepm_firebase_libros_stock_seeded");
      if (list.length === 0 && !hasSeededLibros) {
        try {
          const savePromises = INITIAL_LIBROS_STOCK.map((l) => saveLibroStockToFirebase(l));
          await Promise.all(savePromises);
          localStorage.setItem("iepm_firebase_libros_stock_seeded", "true");
          showToast("Catálogo inicial de libros en stock cargado en Firestore con éxito.", "success");
        } catch (e) {
          console.error("Error seeding Libros Stock:", e);
        }
      } else {
        setLibrosStock(list);
      }
    }, (error) => {
      showToast("Error de sincronización de Libros en Stock con Firestore: " + error.message, "error");
    });

    // Subscribe to Fechas Especiales in Firestore
    const unsubscribeFechas = subscribeFechasEspeciales(async (list) => {
      const hasSeededFechas = localStorage.getItem("iepm_firebase_fechas_seeded");
      if (list.length === 0 && !hasSeededFechas) {
        try {
          const savePromises = INITIAL_FECHAS_ESPECIALES.map((f) => saveFechaEspecialToFirebase(f));
          await Promise.all(savePromises);
          localStorage.setItem("iepm_firebase_fechas_seeded", "true");
          showToast("Calendario oficial 2026 de fechas especiales y justificaciones AIP cargado.", "success");
        } catch (e) {
          console.error("Error seeding Fechas Especiales:", e);
        }
      } else {
        setFechasEspeciales(list);
      }
    }, (error) => {
      console.error("Error sincronizando fechas especiales:", error);
    });

    return () => {
      unsubscribeSecurity();
      unsubscribeAuth();
      unsubscribeDocentes();
      unsubscribeAip();
      unsubscribeBiblioteca();
      unsubscribeLibrosStock();
      unsubscribeFechas();
    };
  }, []);

  // Lock body scroll on small screens when mobile sidebar drawer is open
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Add or update handler for Docentes
  const handleAddOrUpdate = async (docenteToSave: Docente) => {
    const isEditingMode = docentes.some((d) => d.dni === docenteToSave.dni);

    try {
      await saveDocenteToFirebase(docenteToSave);
      if (isEditingMode) {
        showToast(`Docente ${docenteToSave.apellidosNombres} actualizado con éxito.`, "success");
        setEditingDocente(null);
      } else {
        showToast(`Docente ${docenteToSave.apellidosNombres} registrado con éxito en la institución.`, "success");
      }
      setActiveTab("docentes");
      setDocenteSubTab("directorio");
    } catch (e) {
      showToast(`Error al guardar en Firebase: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  // Bulk upload save handler
  const handleBulkUpload = async (importedDocentes: Docente[]) => {
    try {
      showToast(`Iniciando importación masiva de ${importedDocentes.length} docentes...`, "info");
      const promises = importedDocentes.map((docente) => saveDocenteToFirebase(docente));
      await Promise.all(promises);
      showToast(`¡Se importaron ${importedDocentes.length} docentes exitosamente!`, "success");
      setDocenteSubTab("directorio");
    } catch (e) {
      showToast(`Error durante la importación masiva: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  // Delete handler for Docentes
  const handleDelete = (dni: string) => {
    const target = docentes.find((d) => d.dni === dni);
    const targetName = target ? target.apellidosNombres : `DNI ${dni}`;

    setConfirmConfig({
      isOpen: true,
      title: "Eliminar Registro de Docente",
      message: `¿Está seguro que desea eliminar permanentemente al docente "${targetName}" de la base de datos de Firebase? Esta acción no se puede deshacer.`,
      confirmText: "Sí, Eliminar",
      onConfirm: async () => {
        if (editingDocente && editingDocente.dni === dni) {
          setEditingDocente(null);
        }

        try {
          await deleteDocenteFromFirebase(dni);
          showToast(
            `Registro del docente ${target ? target.apellidosNombres : "DNI " + dni} removido de Firebase.`, 
            "info"
          );
        } catch (e) {
          showToast(`Error al eliminar de Firebase: ${e instanceof Error ? e.message : String(e)}`, "error");
        }
        setConfirmConfig(null);
      }
    });
  };

  // AIP Add or update handler
  const handleAipAddOrUpdate = async (registroToSave: RegistroAip) => {
    const isEditingMode = registros.some((r) => r.id === registroToSave.id);

    try {
      await saveRegistroAipToFirebase(registroToSave);
      if (isEditingMode) {
        showToast(`Registro de AIP de "${registroToSave.docenteNombre}" actualizado con éxito.`, "success");
        setEditingRegistro(null);
      } else {
        showToast(`Ingreso al AIP registrado con éxito para "${registroToSave.docenteNombre}".`, "success");
      }
      setActiveTab("aip");
      setAipSubTab("historial");
    } catch (e) {
      showToast(`Error al guardar en Firebase: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  // AIP Delete handler
  const handleAipDelete = (id: string) => {
    const target = registros.find((r) => r.id === id);
    const targetName = target ? target.docenteNombre : `ID ${id}`;

    setConfirmConfig({
      isOpen: true,
      title: "Eliminar Entrada del AIP",
      message: `¿Está seguro que desea eliminar permanentemente el registro de sesión al AIP de "${targetName}"? Esta acción no se puede deshacer.`,
      confirmText: "Sí, Eliminar de Firebase",
      onConfirm: async () => {
        if (editingRegistro && editingRegistro.id === id) {
          setEditingRegistro(null);
        }

        try {
          await deleteRegistroAipFromFirebase(id);
          showToast(`Registro de ingreso AIP eliminado con éxito.`, "info");
        } catch (e) {
          showToast(`Error al eliminar registro AIP: ${e instanceof Error ? e.message : String(e)}`, "error");
        }
        setConfirmConfig(null);
      }
    });
  };

  // Biblioteca Add or update handler
  const handleSaveRegistroBiblioteca = async (registroToSave: RegistroBiblioteca) => {
    try {
      await saveRegistroBibliotecaToFirebase(registroToSave);
      showToast(`Registro de biblioteca guardado con éxito en Firebase.`, "success");
    } catch (e) {
      showToast(`Error al guardar en biblioteca: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  // Biblioteca Delete handler
  const handleDeleteRegistroBiblioteca = async (id: string) => {
    try {
      await deleteRegistroBibliotecaFromFirebase(id);
      showToast(`Registro de biblioteca eliminado correctamente.`, "info");
    } catch (e) {
      showToast(`Error al eliminar en biblioteca: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  // Libros en Stock (Inventario BD) Handlers
  const handleSaveLibroStock = async (libro: LibroStock) => {
    try {
      await saveLibroStockToFirebase(libro);
      showToast(`Libro "${libro.titulo}" guardado en la base de datos de la biblioteca.`, "success");
    } catch (e) {
      showToast(`Error al guardar libro en base de datos: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  const handleDeleteLibroStock = async (id: string) => {
    try {
      await deleteLibroStockFromFirebase(id);
      showToast(`Libro eliminado de la base de datos de stock.`, "info");
    } catch (e) {
      showToast(`Error al eliminar libro: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  // Special Dates Handlers (Firebase CRUD)
  const handleSaveFechaEspecial = async (fecha: FechaEspecial) => {
    try {
      await saveFechaEspecialToFirebase(fecha);
      showToast(`Fecha "${fecha.titulo}" guardada correctamente en Firebase.`, "success");
    } catch (e) {
      showToast(`Error al guardar fecha especial: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  };

  const handleDeleteFechaEspecial = (id: string) => {
    const target = fechasEspeciales.find((f) => f.id === id);
    const targetTitle = target ? target.titulo : `ID ${id}`;

    setConfirmConfig({
      isOpen: true,
      title: "Eliminar Fecha Especial",
      message: `¿Está seguro que desea eliminar la fecha especial "${targetTitle}"? Dejará de justificarse la inasistencia en dicha fecha.`,
      confirmText: "Sí, Eliminar de Firebase",
      onConfirm: async () => {
        try {
          await deleteFechaEspecialFromFirebase(id);
          showToast(`Fecha especial eliminada con éxito.`, "info");
        } catch (e) {
          showToast(`Error al eliminar fecha especial: ${e instanceof Error ? e.message : String(e)}`, "error");
        }
        setConfirmConfig(null);
      }
    });
  };

  const existingDnis = docentes.map((d) => d.dni);

  // Authentication Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("iepm_auth_user", JSON.stringify(user));
    } catch (e) {}
    showToast(`Bienvenido(a) al sistema AIP, ${user.displayName}. Acceso autorizado.`, "success");
  };

  const handleLogout = async () => {
    try {
      await signOutFirebase();
    } catch (e) {
      console.warn("Error signing out:", e);
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem("iepm_auth_user");
    } catch (e) {}
    showToast("Sesión institucional finalizada.", "info");
  };

  // If user is not authenticated, strictly show Institutional Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        docentes={docentes}
        securityConfig={securityConfig}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Current module meta
  const currentModule = modules.find((m) => m.routeTab === activeTab) || modules[0];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans relative">
      
      {/* Toast Notification HUD */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl border border-slate-200/90 backdrop-blur-xl flex items-center gap-3 animate-slideIn bg-white/95 max-w-sm">
          <div className="shrink-0">
            {toast.type === "success" && (
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
            {toast.type === "info" && (
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Info className="w-5 h-5" />
              </div>
            )}
            {toast.type === "error" && (
              <div className="w-8 h-8 rounded-full bg-red-50 text-[#D92323] flex items-center justify-center border border-red-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {toast.type === "success" ? "Operación Exitosa" : toast.type === "error" ? "Error Detectado" : "Aviso de Sistema"}
            </p>
            <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">
              {toast.text}
            </p>
          </div>
        </div>
      )}

      {/* Top Navbar Header */}
      <TopNavbar
        totalDocentes={docentes.length}
        totalAip={registros.length}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        activeModuleName={currentModule.name}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
      />

      {/* Institutional Sub-Ribbon */}
      <div className="bg-white border-b border-slate-200/80 py-2 shadow-2xs hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <School className="w-4 h-4 text-[#D92323]" />
            <span className="font-extrabold text-[#0B1E36]">LEMA:</span>
            <span className="text-slate-600 italic">
              &quot;Educación de calidad con valores morales inspirados en el ejemplo del prócer Túpac Amaru II.&quot;
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Jr. Andamarca S/N - Barrio de Ccollana
          </div>
        </div>
      </div>

      {/* Main Workspace Frame (Sidebar + Content) */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 items-start">
        
        {/* Left Modular Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          docenteSubTab={docenteSubTab}
          onChangeDocenteSubTab={(sub) => setDocenteSubTab(sub)}
          aipSubTab={aipSubTab}
          onChangeAipSubTab={(sub) => setAipSubTab(sub)}
          totalDocentes={docentes.length}
          totalAip={registros.length}
          totalBiblioteca={bibliotecaRegistros.length}
          modules={modules}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onOpenNewDocente={() => {
            setEditingDocente(null);
            setActiveTab("docentes");
            setDocenteSubTab("registro");
          }}
          onOpenNewAip={() => {
            setEditingRegistro(null);
            setActiveTab("aip");
            setAipSubTab("registro");
          }}
          onOpenPdfReport={() => setIsPdfModalOpen(true)}
        />

        {/* Right Main Content Stage */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* Breadcrumb Navigation & Action Ribbon */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-1.5 hover:text-[#D92323] transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>Portal</span>
              </button>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-[#0B1E36] font-extrabold uppercase font-mono tracking-wider">
                {currentModule.name}
              </span>
              {activeTab === "docentes" && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="text-[#D92323] font-medium capitalize">
                    {docenteSubTab === "directorio" ? "Directorio General" : docenteSubTab === "registro" ? "Formulario" : "Carga Masiva Excel"}
                  </span>
                </>
              )}
              {activeTab === "aip" && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="text-[#D92323] font-medium capitalize">
                    {aipSubTab === "historial" ? "Libro Diario" : "Registro de Visita"}
                  </span>
                </>
              )}
              {activeTab === "biblioteca" && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="text-emerald-700 font-medium capitalize">
                    Libros Físicos y Tabletas
                  </span>
                </>
              )}
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="flex items-center gap-2 flex-wrap">
              {activeTab !== "aip" && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRegistro(null);
                    setActiveTab("aip");
                    setAipSubTab("registro");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#D92323] border border-red-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Visita AIP</span>
                </button>
              )}

              {activeTab !== "biblioteca" && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("biblioteca");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>+ Biblioteca / Tabletas</span>
                </button>
              )}

              {activeTab !== "docentes" && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDocente(null);
                    setActiveTab("docentes");
                    setDocenteSubTab("registro");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Docente</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Anexo 1</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MÓDULO 1: DASHBOARD / TABLERO CENTRAL                                    */}
          {/* ========================================================================= */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Executive Welcome Hero */}
              <div className="bg-gradient-to-br from-white via-slate-50 to-red-50/40 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-red-100/30 rounded-bl-full pointer-events-none"></div>
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10 relative">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 max-w-3xl">
                    {/* Official Crest Insignia */}
                    <div className="relative shrink-0 group">
                      <div className="w-18 h-22 sm:w-20 sm:h-26 bg-white rounded-2xl p-2 border border-slate-200 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
                        <img 
                          src={SCHOOL_LOGO_PATH} 
                          alt="Escudo Oficial I.E.P.M. N° 24009 Túpac Amaru II" 
                          className="w-full h-full object-contain filter drop-shadow-xs" 
                        />
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-[#0B1E36] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-xs font-mono">
                        PUQUIO
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#D92323] text-[10px] font-black uppercase tracking-widest font-mono">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        IEPM N° 24009 TÚPAC AMARU II • PORTAL MODULAR
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                        Sistema Integrado de Gestión Escolar y Aula AIP
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                        Bienvenido a la plataforma oficial de la <strong>I.E.P.M. N° 24009 Túpac Amaru II (Puquio, Lucanas)</strong>. Su trabajo está organizado en <strong>módulos especializados</strong> para una navegación rápida, cómoda e intuitiva, con respaldo permanente en la nube de Firebase.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                      <p className="text-[9px] font-mono font-bold text-slate-400 uppercase">Servicio en Línea</p>
                      <p className="text-sm font-black font-mono text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        FIREBASE FIRESTORE SYNC
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">Cód. Modular: 0361493</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPdfModalOpen(true)}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#D92323] hover:bg-red-600 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Generar Reporte Mensual</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Module Cards Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-600 tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#D92323]" />
                    Sectores & Módulos Operativos
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Module 1: AIP */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-[#D92323]/60 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D92323] flex items-center justify-center font-bold">
                          <Monitor className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#D92323] border border-red-100">
                          {registros.length} Sesiones
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-[#D92323] transition-colors">
                        Aula AIP (Anexo 1)
                      </h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        Control del libro diario de visitas, registro pedagógico de temas, laptops XO y asistencia.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("aip");
                          setAipSubTab("historial");
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer text-center"
                      >
                        Libro Diario
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRegistro(null);
                          setActiveTab("aip");
                          setAipSubTab("registro");
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-red-50 hover:bg-[#D92323] text-[#D92323] hover:text-white text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        + Ingreso
                      </button>
                    </div>
                  </div>

                  {/* Module 2: Docentes */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-blue-500/60 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Users className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {docentes.length} Docentes
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        Personal Docente
                      </h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        Directorio institucional, asignación de grados, carpetas individuales y carga masiva Excel.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("docentes");
                          setDocenteSubTab("directorio");
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer text-center"
                      >
                        Directorio
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDocente(null);
                          setActiveTab("docentes");
                          setDocenteSubTab("registro");
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        + Docente
                      </button>
                    </div>
                  </div>

                  {/* Module 3: Fechas Especiales & Justificaciones AIP */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-amber-500/60 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          {fechasEspeciales.length} Fechas
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                        Fechas Especiales AIP
                      </h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        Calendario de feriados, semanas de gestión y justificación formal de no asistencia de docentes.
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("calendario");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="w-full py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-900 hover:text-white text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        Ver Calendario & Justificaciones
                      </button>
                    </div>
                  </div>

                  {/* Module 4: Informe Mensual Word */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-teal-500/60 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                          Word .docx
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-teal-600 transition-colors">
                        Informe Mensual PIP
                      </h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        Elaborador con IA para objetivos y balance, acciones del mes y descarga directa en Microsoft Word.
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("informe-mensual");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="w-full py-2 px-2.5 rounded-xl bg-teal-50 hover:bg-teal-600 text-teal-800 hover:text-white text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        Elaborar Informe Word
                      </button>
                    </div>
                  </div>

                  {/* Module 5: Reportes & PDF */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-purple-500/60 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                          Oficial UGEL
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                        Reportes & PDF
                      </h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        Exportación oficial en PDF del Anexo 1 con firmas directivas y del docente de innovación.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setActiveTab("reportes")}
                        className="flex-1 py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer text-center"
                      >
                        Reportes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPdfModalOpen(true)}
                        className="flex-1 py-2 px-2 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* Module 6: Biblioteca Escolar & Tabletas (Al final de los sectores operativos) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-emerald-500/60 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {bibliotecaRegistros.length} Atenciones
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Biblioteca y Tabletas
                      </h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        Registro de docentes para libros físicos, tabletas o ambos con horarios de turno y plan lector.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("biblioteca");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        Abrir Módulo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Quick Table Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Recent AIP visits */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#D92323]" />
                      Últimas Visitas Asentadas en el AIP
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("aip");
                        setAipSubTab("historial");
                      }}
                      className="text-[11px] font-bold text-[#D92323] hover:underline"
                    >
                      Ver todo ({registros.length})
                    </button>
                  </div>

                  {registros.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No hay registros aún.</p>
                  ) : (
                    <div className="space-y-2">
                      {registros.slice(0, 4).map((reg) => (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{reg.tema}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {reg.docenteNombre} • {reg.fecha} • Grado: {reg.grado} &quot;{reg.seccion}&quot;
                            </p>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shrink-0 ml-2">
                            {reg.area}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Directorial Guidelines & Tips */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <HelpCircle className="w-4 h-4 text-[#D92323]" />
                    Consejos de Operación Cómoda
                  </h4>
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-150 space-y-1">
                      <p className="font-extrabold text-slate-800 text-[11px]">Búsqueda Global Instantánea</p>
                      <p className="text-[11px] text-slate-500">
                        Presione <kbd className="px-1 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">Ctrl+K</kbd> en cualquier momento para buscar docentes o sesiones en tiempo real.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-150 space-y-1">
                      <p className="font-extrabold text-slate-800 text-[11px]">Nuevo Módulo Posterior</p>
                      <p className="text-[11px] text-slate-500">
                        Puede agregar nuevos sectores (como inventario TIC o asistencia) en la pestaña <strong>Gestor de Módulos</strong>.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* MÓDULO 2: CONTROL DE DOCENTES                                             */}
          {/* ========================================================================= */}
          {activeTab === "docentes" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Sector Header with Sub-tabs */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Carpeta del Personal Docente
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Directorio institucional, asignación de grados, especialidades y fichas de personal de la IEPM N° 24009.
                  </p>
                </div>

                {/* Subtabs switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDocenteSubTab("directorio")}
                    className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      docenteSubTab === "directorio"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Directorio ({docentes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDocente(null);
                      setDocenteSubTab("registro");
                    }}
                    className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      docenteSubTab === "registro" && !editingDocente
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    + Nuevo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDocente(null);
                      setDocenteSubTab("excel");
                    }}
                    className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      docenteSubTab === "excel"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Carga Excel
                  </button>
                  {editingDocente && (
                    <button
                      type="button"
                      onClick={() => setDocenteSubTab("registro")}
                      className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-orange-500 text-white shadow-sm"
                    >
                      Editando
                    </button>
                  )}
                </div>
              </div>

              {/* Editing Notification if active */}
              {editingDocente && (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 px-4 py-2.5 rounded-xl text-xs text-orange-800 font-bold">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 animate-pulse" />
                    <span>Modo Edición Activo: {editingDocente.apellidosNombres} (DNI: {editingDocente.dni})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDocente(null);
                      setDocenteSubTab("directorio");
                    }}
                    className="underline hover:no-underline text-orange-950 font-black cursor-pointer"
                  >
                    Cancelar Edición
                  </button>
                </div>
              )}

              {/* Subtab: Directorio */}
              {docenteSubTab === "directorio" && (
                <div className="space-y-6 animate-fadeIn">
                  <TeacherStats docentes={docentes} />
                  <TeacherTable
                    docentes={docentes}
                    onView={(docente) => setSelectedDocenteForFicha(docente)}
                    onEdit={(docente) => {
                      setEditingDocente(docente);
                      setDocenteSubTab("registro");
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }}
                    onDelete={handleDelete}
                  />
                </div>
              )}

              {/* Subtab: Registro Form */}
              {docenteSubTab === "registro" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl mx-auto animate-fadeIn">
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <p className="text-xs font-black uppercase text-blue-700 tracking-wider">
                        {editingDocente ? "✍️ Actualizar Datos de Docente" : "➕ Registrar Nuevo Docente"}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {editingDocente ? "Modifique los campos institucionales." : "Ingrese los datos para guardarlos en Firebase."}
                      </p>
                    </div>
                    <TeacherForm
                      initialData={editingDocente}
                      existingDnis={existingDnis}
                      onSubmit={handleAddOrUpdate}
                      onCancel={() => {
                        setEditingDocente(null);
                        setDocenteSubTab("directorio");
                      }}
                    />
                  </div>

                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
                      <p className="text-[10px] font-mono text-[#0B1E36] uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-[#D92323]" />
                        Pautas Institucionales
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        El DNI es el documento de identificación único y sirve para enlazar automáticamente las visitas pedagógicas al Aula AIP.
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
                        <li>Apellidos y nombres completos.</li>
                        <li>Indique el grado y sección asignados.</li>
                        <li>Escala magisterial y condición laboral.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab: Carga Masiva Excel */}
              {docenteSubTab === "excel" && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                  <TeacherBulkUpload
                    existingDnis={existingDnis}
                    onUploadSuccess={handleBulkUpload}
                    onCancel={() => setDocenteSubTab("directorio")}
                  />
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* MÓDULO 3: CONTROL AULA DE INNOVACIÓN (AIP)                               */}
          {/* ========================================================================= */}
          {activeTab === "aip" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Sector Header with Sub-tabs */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-[#D92323]" />
                    Control del Aula de Innovación (AIP - Anexo 1)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Libro oficial de visitas, registro de sesiones TIC, recursos tecnológicos y asistencia de alumnos.
                  </p>
                </div>

                {/* Subtabs switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAipSubTab("historial")}
                    className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      aipSubTab === "historial"
                        ? "bg-[#D92323] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Libro Diario ({registros.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRegistro(null);
                      setAipSubTab("registro");
                    }}
                    className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      aipSubTab === "registro" && !editingRegistro
                        ? "bg-[#D92323] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    + Registrar Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPdfModalOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg text-purple-700 hover:bg-purple-50 transition-all cursor-pointer"
                  >
                    Reporte PDF
                  </button>
                  {editingRegistro && (
                    <button
                      type="button"
                      onClick={() => setAipSubTab("registro")}
                      className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-orange-500 text-white shadow-sm"
                    >
                      Editando
                    </button>
                  )}
                </div>
              </div>

              {/* Editing Notification if active */}
              {editingRegistro && (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 px-4 py-2.5 rounded-xl text-xs text-orange-800 font-bold">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 animate-pulse" />
                    <span>Modo Edición de Visita: {editingRegistro.docenteNombre} - {editingRegistro.tema}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRegistro(null);
                      setAipSubTab("historial");
                    }}
                    className="underline hover:no-underline text-orange-950 font-black cursor-pointer"
                  >
                    Cancelar Edición
                  </button>
                </div>
              )}

              {/* Subtab: Historial / Libro Diario */}
              {aipSubTab === "historial" ? (
                <div className="space-y-6 animate-fadeIn">
                  <AipStats registros={registros} />
                  <AipTable
                    registros={registros}
                    onEdit={(registro) => {
                      setEditingRegistro(registro);
                      setAipSubTab("registro");
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }}
                    onDelete={handleAipDelete}
                  />
                </div>
              ) : (
                /* Subtab: Registro Form */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl mx-auto animate-fadeIn">
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <p className="text-xs font-black uppercase text-[#D92323] tracking-wider">
                        {editingRegistro ? "✍️ Modificar Ficha de Sesión AIP" : "➕ Registrar Visita al Aula AIP"}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {editingRegistro ? "Ajuste el detalle de los recursos asignados." : "Los datos se asientan directamente en el Libro Diario de la nube."}
                      </p>
                    </div>
                    <AipForm
                      initialData={editingRegistro}
                      docentesList={docentes}
                      onSubmit={handleAipAddOrUpdate}
                      onCancel={() => {
                        setEditingRegistro(null);
                        setAipSubTab("historial");
                      }}
                    />
                  </div>

                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
                      <p className="text-[10px] font-mono text-[#0B1E36] uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-[#D92323]" />
                        Búsqueda Asistida
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Escriba apellidos, nombres o DNI del docente para ver coincidencias automáticas en la lista desplegable.
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
                        <li>Auto-completará su grado y sección al seleccionarlo.</li>
                        <li>Describa los recursos TIC o laptops XO empleadas.</li>
                        <li>Marque si entregó o no la sesión de aprendizaje.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* MÓDULO: BIBLIOTECA ESCOLAR Y TABLETAS                                      */}
          {/* ========================================================================= */}
          {activeTab === "biblioteca" && (
            <BibliotecaModule
              registros={bibliotecaRegistros}
              docentesList={docentes}
              librosStock={librosStock}
              onSaveRegistro={handleSaveRegistroBiblioteca}
              onDeleteRegistro={handleDeleteRegistroBiblioteca}
              onSaveLibroStock={handleSaveLibroStock}
              onDeleteLibroStock={handleDeleteLibroStock}
            />
          )}

          {/* ========================================================================= */}
          {/* MÓDULO 4: CALENDARIO DE FECHAS ESPECIALES & JUSTIFICACIÓN AIP             */}
          {/* ========================================================================= */}
          {activeTab === "calendario" && (
            <SpecialDatesCalendar
              fechasEspeciales={fechasEspeciales}
              onAddFecha={handleSaveFechaEspecial}
              onUpdateFecha={handleSaveFechaEspecial}
              onDeleteFecha={handleDeleteFechaEspecial}
              registrosAip={registros}
              docentes={docentes}
            />
          )}

          {/* ========================================================================= */}
          {/* MÓDULO 5: ELABORACIÓN DE INFORME MENSUAL DE ACTIVIDADES (WORD DOCX)       */}
          {/* ========================================================================= */}
          {activeTab === "informe-mensual" && (
            <MonthlyReportModule
              registros={registros}
              docentes={docentes}
              fechasEspeciales={fechasEspeciales}
              onOpenPdfReportModal={() => setIsPdfModalOpen(true)}
              onNavigateToCalendario={() => {
                setActiveTab("calendario");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}

          {/* ========================================================================= */}
          {/* MÓDULO 6: CENTRO DE REPORTES & PDF OFICIAL                               */}
          {/* ========================================================================= */}
          {activeTab === "reportes" && (
            <ReportsCenter 
              registros={registros} 
              docentes={docentes}
              onNavigateToInformeMensual={() => {
                setActiveTab("informe-mensual");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}

          {/* ========================================================================= */}
          {/* MÓDULO 6: MÉTRICAS & MONITOREO INSTITUCIONAL                             */}
          {/* ========================================================================= */}
          {activeTab === "metricas" && (
            <InstitutionalMetrics docentes={docentes} registros={registros} />
          )}

        </main>
      </div>

      {/* Institutional Dignified Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 z-10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <School className="w-5 h-5 text-[#D92323]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white">
                  I.E.P.M. N° 24009 TÚPAC AMARU II
                </p>
                <p className="text-[10px] text-slate-400">
                  © 2026 Plataforma Modular de Registro Escolar y Aula AIP.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B1E36] border border-white/20"></span>
              <span className="text-xs font-mono text-slate-300 font-bold">Ayacucho, Perú</span>
            </div>

          </div>
        </div>
      </footer>

      {/* Teacher Detailed Modal Overlay */}
      {selectedDocenteForFicha && (
        <TeacherDetailModal
          docente={selectedDocenteForFicha}
          onClose={() => setSelectedDocenteForFicha(null)}
        />
      )}

      {/* Global Quick Search Modal Overlay */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        docentes={docentes}
        registros={registros}
        onSelectDocente={(docente) => {
          setSelectedDocenteForFicha(docente);
        }}
        onSelectRegistro={(registro) => {
          setEditingRegistro(registro);
          setActiveTab("aip");
          setAipSubTab("registro");
        }}
      />

      {/* Official PDF Report Generation Modal */}
      <AipPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        registros={registros}
        docentes={docentes}
      />

      {/* Confirmation Dialog Overlay */}
      {confirmConfig && confirmConfig.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6">
              <div className="flex items-center gap-3 text-[#D92323] mb-4">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
                  {confirmConfig.title}
                </h3>
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {confirmConfig.message}
              </p>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer transition-all"
              >
                No, Cancelar
              </button>
              <button
                type="button"
                onClick={confirmConfig.onConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-[#D92323] hover:bg-red-600 rounded-xl cursor-pointer transition-all border-b-2 border-red-800"
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Access Control Modal */}
      <SecurityAccessModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        securityConfig={securityConfig}
        docentes={docentes}
        currentUser={currentUser}
        onUpdateSecurityConfig={(updated) => setSecurityConfig(updated)}
      />

    </div>
  );
}
