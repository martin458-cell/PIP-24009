import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to initialize Gemini SDK safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.warn("Could not instantiate Gemini client:", err);
    return null;
  }
}

// =========================================================================
// API ROUTE: Proponer Objetivo Pedagógico a partir de la Descripción
// =========================================================================
app.post("/api/ai/generate-objectives", async (req, res) => {
  try {
    const { titulo, descripcion, beneficiarios, mes } = req.body;
    const cleanDesc = (descripcion || "").trim();
    const cleanTitle = (titulo || "").trim();
    const cleanBeneficiarios = (beneficiarios || "Docentes y Estudiantes").trim();

    if (!cleanDesc && !cleanTitle) {
      return res.status(400).json({ 
        error: "Se requiere al menos el título o la descripción de las actividades realizadas." 
      });
    }

    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `Actúa como un Especialista en Tecnologías Educativas del Ministerio de Educación del Perú (MINEDU) y Profesor de Innovación Pedagógica (PIP) de la IEPM N° 24009 "Túpac Amaru II" de Puquio, Lucanas.
A partir de la siguiente actividad pedagógica/tecnológica realizada en el mes de ${mes || "este periodo"}:

Título: "${cleanTitle}"
Acciones/Descripción de lo realizado por el docente: "${cleanDesc}"
Beneficiarios: "${cleanBeneficiarios}"

Formula UN único objetivo general claro, formal, pedagógico y conciso (entre 15 y 30 palabras).
Debe comenzar con un verbo en infinitivo (por ejemplo: Fortalecer, Promover, Garantizar, Desarrollar, Optimizar, Capacitar, Implementar, Fomentar).
Responde únicamente con el texto del objetivo, sin comillas, sin introducciones ni explicaciones adicionales.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const generatedText = (response.text || "").trim();
        if (generatedText) {
          return res.json({ objetivo: generatedText });
        }
      } catch (geminiError) {
        console.warn("Gemini call failed, switching to smart rule fallback:", geminiError);
      }
    }

    // Smart pedagogical fallback if AI key unavailable or error
    let fallbackObjetivo = "";
    const lower = (cleanDesc + " " + cleanTitle).toLowerCase();

    if (lower.includes("capacit") || lower.includes("taller") || lower.includes("colegiado") || lower.includes("formaci")) {
      fallbackObjetivo = `Fortalecer las competencias digitales y el uso pedagógico de herramientas tecnológicas e inteligencia artificial en la plana docente para optimizar la planificación y ejecución curricular.`;
    } else if (lower.includes("aip") || lower.includes("sesion") || lower.includes("acompañ") || lower.includes("estudiante") || lower.includes("niño")) {
      fallbackObjetivo = `Facilitar el acceso y dinamizar el aprendizaje de los estudiantes mediante la mediación de recursos tecnológicos interactivos en las áreas curriculares fundamentales dentro del Aula de Innovación Pedagógica.`;
    } else if (lower.includes("manten") || lower.includes("soporte") || lower.includes("laptop") || lower.includes("computador") || lower.includes("equipo")) {
      fallbackObjetivo = `Garantizar la operatividad continua, seguridad y óptimo funcionamiento del parque informático y periféricos del Aula de Innovación Pedagógica para beneficio de la comunidad escolar.`;
    } else if (lower.includes("padre") || lower.includes("familia") || lower.includes("apafa")) {
      fallbackObjetivo = `Sensibilizar y orientar a los padres de familia sobre la importancia del acompañamiento responsable y el uso seguro de las tecnologías digitales en el hogar para apoyar el aprendizaje de sus hijos.`;
    } else {
      fallbackObjetivo = `Promover la integración efectiva de recursos y entornos digitales en los procesos educativos para potenciar el desarrollo de las competencias del Currículo Nacional en los estudiantes.`;
    }

    return res.json({ objetivo: fallbackObjetivo });
  } catch (err: any) {
    console.error("Error in /api/ai/generate-objectives:", err);
    res.status(500).json({ error: err.message || "Error al procesar la propuesta de objetivos." });
  }
});

// =========================================================================
// API ROUTE: Redacción Automática de Logros, Dificultades y Sugerencias
// Evaluando:
// 1. Asistencia de los docentes y sus actividades pedagógicas en el AIP
// 2. Actividades planificadas y realizadas por el PIP
// En los 3 puntos: Logros, Dificultades y Sugerencias de Mejora
// =========================================================================
app.post("/api/ai/generate-balance", async (req, res) => {
  try {
    const { 
      actividades, 
      beneficiariosGlobales, 
      mes, 
      ano, 
      estadisticasAip,
      docentesDetalle,
      fechasEspecialesMes,
      seccion = "todos"
    } = req.body;

    const mesNombre = mes || "el mes";
    const anoNum = ano || 2026;

    // Resumen de Actividades Realizadas por el PIP
    const actSummaries = Array.isArray(actividades) && actividades.length > 0
      ? actividades
          .map((a: any, idx: number) => {
            const tareasList = Array.isArray(a.tareas) && a.tareas.length > 0
              ? a.tareas.map((t: any) => `• ${t.subtitulo}: ${t.detalle}`).join(" ")
              : "";
            const desc = a.descripcionTexto || tareasList || "Ejecución regular de actividades";
            return `Actividad ${idx + 1}: ${a.titulo || "Actividad PIP"}. Descripción y Acciones: ${desc}. Objetivo: ${a.objetivo || "Desarrollo de competencias digitales"}. Beneficiarios: ${a.metasBeneficiarios || beneficiariosGlobales || "Docentes y Estudiantes"}.`;
          })
          .join("\n")
      : "Actividades de soporte técnico pedagógico, mantenimiento del equipamiento informático y capacitación en recursos TIC.";

    // Estadísticas y asistencia de los docentes en el AIP
    const stats = estadisticasAip || {};
    const totalSes = stats.totalSesiones || 0;
    const totalEst = stats.totalEstudiantes || 0;
    const totalDocAtendidos = stats.docentesAtendidos || 0;
    const pctSesion = stats.pctConSesion || 0;

    // Detalle de docentes
    const docInfo = docentesDetalle || {};
    const totalDocentesColegio = docInfo.totalDocentesColegio || 0;
    const asistenciaDocentesList = Array.isArray(docInfo.docentesAsistieronDetalle) && docInfo.docentesAsistieronDetalle.length > 0
      ? docInfo.docentesAsistieronDetalle.slice(0, 10).join("; ")
      : "Docentes de diversos grados y secciones de primaria";
    
    const docentesSinAsistencia = Array.isArray(docInfo.docentesSinVisita) && docInfo.docentesSinVisita.length > 0
      ? docInfo.docentesSinVisita.slice(0, 8).join("; ")
      : "Ninguno reportado o todos asistieron";

    const areasDesarrolladas = docInfo.resumenAreas || "Matemática, Comunicación, Ciencia y Tecnología, Personal Social";
    const recursosUtilizados = docInfo.resumenRecursos || "Laptops XO, computadoras de escritorio, software educativo interactivo, proyectores";

    // Fechas especiales que justifican no atención
    const fechasEspList = Array.isArray(fechasEspecialesMes) && fechasEspecialesMes.length > 0
      ? fechasEspecialesMes.map((f: any) => `${f.fecha}: ${f.titulo} (${f.tipo}) - ${f.motivoJustificacion || "Sin atención en AIP"}`).join("; ")
      : "No hubo suspensiones ni feriados reportados en el periodo";

    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `Actúa como el Profesor de Innovación Pedagógica (PIP) de la IEPM N° 24009 "Túpac Amaru II" de Puquio, Lucanas, Ayacucho, Perú.
Debes evaluar y redactar la sección "IV. BALANCE GENERAL DE LA EXPERIENCIA EN EL MES" del Informe Mensual de Actividades del mes de ${mesNombre} de ${anoNum}.

LA EVALUACIÓN DEBE EVALUAR OBLIGATORIAMENTE DOS EJES FUNDAMENTALES EN LOS TRES PUNTOS SOLICITADOS (LOGROS ALCANZADOS, DIFICULTADES Y SUGERENCIAS DE MEJORA):

EJE 1: ASISTENCIA DE LOS DOCENTES Y SUS ACTIVIDADES PEDAGÓGICAS EN EL AIP:
- Asistencia y puntualidad de los docentes con sus secciones al AIP (${totalDocAtendidos} de ${totalDocentesColegio || totalDocAtendidos} docentes asistieron, totalizando ${totalSes} sesiones de aprendizaje y ${totalEst} estudiantes atendidos).
- Detalle de docentes con sesiones realizadas en el AIP: ${asistenciaDocentesList}.
- Docentes de aula con menor concurrencia o sin asistencia en el mes: ${docentesSinAsistencia}.
- Actividades curriculares que los docentes desarrollaron con sus estudiantes en el AIP: Áreas trabajadas (${areasDesarrolladas}) y recursos TIC utilizados (${recursosUtilizados}).
- Cumplimiento de la presentación previa de su sesión de aprendizaje integrada con TIC: ${pctSesion}% de sesiones contaron con sesión presentada oportunamente.
- Justificación de fechas sin atención en el AIP (feriados de calendario escolar, semanas de gestión o vacaciones de medio año): ${fechasEspList}.

EJE 2: ACTIVIDADES REALIZADAS POR EL PIP:
- Ejecución de las actividades del PIP programadas en el plan de trabajo del mes:
${actSummaries}
- Beneficiarios atendidos: ${beneficiariosGlobales || "Profesores, Estudiantes y Padres de Familia"}.
- Soporte técnico y pedagógico continuo brindado por el PIP en el AIP y en las aulas de clase.
- Mantenimiento preventivo y correctivo de computadoras, laptops XO y conectividad.

INSTRUCCIÓN ESPECÍFICA PARA LA REDACCIÓN:
Para cada uno de los 3 puntos (o el solicitado "${seccion}"):
Debes formular entre 4 y 6 ítems equilibrados (al menos 2 sobre la Asistencia y Actividades Docentes en AIP, y al menos 2 sobre las Actividades Realizadas por el PIP).
Cada ítem DEBE comenzar obligatoriamente con una de estas dos etiquetas exactas:
- "[Asistencia y Sesiones Docentes en AIP] ..." para lo referente a los docentes de aula, su asistencia y sus sesiones con estudiantes en el AIP.
- "[Actividades y Soporte PIP] ..." para lo referente a las actividades planificadas, talleres, mantenimiento técnico y gestión del PIP.

Genera una respuesta en formato JSON exacto:
{
  "logros": ["lista de 4 a 6 logros con las etiquetas [Asistencia y Sesiones Docentes en AIP] y [Actividades y Soporte PIP]"],
  "dificultades": ["lista de 4 a 6 dificultades con las etiquetas [Asistencia y Sesiones Docentes en AIP] y [Actividades y Soporte PIP]"],
  "sugerencias": ["lista de 4 a 6 sugerencias con las etiquetas [Asistencia y Sesiones Docentes en AIP] y [Actividades y Soporte PIP]"]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                logros: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Lista de 4 a 6 logros alcanzados, etiquetados por eje evaluado",
                },
                dificultades: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Lista de 4 a 6 dificultades presentadas, etiquetadas por eje evaluado",
                },
                sugerencias: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Lista de 4 a 6 sugerencias de mejora, etiquetadas por eje evaluado",
                },
              },
              required: ["logros", "dificultades", "sugerencias"],
            },
          },
        });

        const jsonStr = (response.text || "").trim();
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed.logros) && Array.isArray(parsed.dificultades) && Array.isArray(parsed.sugerencias)) {
            return res.json(parsed);
          }
        }
      } catch (geminiError) {
        console.warn("Gemini balance call failed, using intelligent fallback:", geminiError);
      }
    }

    // High quality pedagogical fallback evaluating both axes
    const fallbackBalance = {
      logros: [
        `[Asistencia y Sesiones Docentes en AIP] Asistencia activa y comprometida de ${totalDocAtendidos > 0 ? totalDocAtendidos : "la mayoría de"} docentes de aula, quienes desarrollaron ${totalSes > 0 ? totalSes : "múltiples"} sesiones pedagógicas en el AIP beneficiando a más de ${totalEst > 0 ? totalEst : "centenares de"} estudiantes en áreas como ${areasDesarrolladas}.`,
        `[Asistencia y Sesiones Docentes en AIP] Se alcanzó un ${pctSesion}% de cumplimiento en la entrega oportuna de sesiones de aprendizaje articuladas con recursos interactivos y laptops XO, garantizando una mediación pedagógica estructurada.`,
        `[Actividades y Soporte PIP] Cumplimiento satisfactorio del cronograma de actividades del PIP durante el mes de ${mesNombre}, ejecutando capacitaciones colegiadas y brindando acompañamiento técnico-pedagógico permanente a la comunidad educativa.`,
        `[Actividades y Soporte PIP] Mantenimiento preventivo, desinfección digital y optimización operativa del 100% de los equipos de cómputo y periféricos del Aula de Innovación, previniendo incidentes técnicos durante las clases.`,
      ],
      dificultades: [
        `[Asistencia y Sesiones Docentes en AIP] Algunos docentes de aula presentaron dificultades para asistir puntualmente según el horario asignado al AIP debido a actividades extracurriculares imprevistas y suspensiones por feriados/semanas de gestión.`,
        `[Asistencia y Sesiones Docentes en AIP] Persistencia de brechas en el dominio de plataformas digitales interactivas por parte de ciertos docentes, requiriendo mayor tiempo de inducción previa antes de iniciar su sesión con los alumnos.`,
        `[Actividades y Soporte PIP] Intermitencia y caídas temporales en la señal de internet institucional durante las horas punta, lo que retrasó la descarga de contenidos multimedia pesados y recursos educativos en la nube.`,
        `[Actividades y Soporte PIP] Tiempo limitado en las reuniones de trabajo colegiado para profundizar en talleres de Inteligencia Artificial aplicada a la educación y robótica pedagógica debido a la recarga de actividades escolares.`,
      ],
      sugerencias: [
        `[Asistencia y Sesiones Docentes en AIP] Establecer un mecanismo de reprogramación inmediata de turnos en el AIP para aquellos docentes cuyas sesiones coincidieron con feriados calendario o jornadas institucionales de gestión.`,
        `[Asistencia y Sesiones Docentes en AIP] Reforzar el compromiso de los docentes para presentar con 24 horas de antelación su sesión de aprendizaje con TIC, permitiendo al PIP preparar el software y equipamiento requerido.`,
        `[Actividades y Soporte PIP] Gestionar ante la Dirección de la IE y la UGEL Lucanas el aumento del ancho de banda y la dotación de nuevos componentes de repuesto para el parque tecnológico del AIP.`,
        `[Actividades y Soporte PIP] Continuar con los microtalleres prácticos quincenales de interaprendizaje docente sobre aplicaciones de IA educativa y herramientas interactivas adaptadas al Currículo Nacional.`,
      ],
    };

    return res.json(fallbackBalance);
  } catch (err: any) {
    console.error("Error in /api/ai/generate-balance:", err);
    res.status(500).json({ error: err.message || "Error al redactar el balance de logros, dificultades y sugerencias." });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// =========================================================================
// Vite Middleware / Static Assets serving
// =========================================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IEPM 24009 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
