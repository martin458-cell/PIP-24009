import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  TextRun, 
  WidthType, 
  AlignmentType, 
  BorderStyle, 
  HeadingLevel,
  HeightRule,
  ImageRun,
  VerticalAlign
} from "docx";
import { InformeMensualData, RegistroAip, FechaEspecial } from "../types";
import { SCHOOL_LOGO_PNG_BASE64 } from "../assets/schoolLogo";

function base64ToUint8Array(base64String: string): Uint8Array {
  try {
    const clean = base64String.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(clean);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Error al decodificar logo base64 a Uint8Array:", e);
    return new Uint8Array();
  }
}

const MESES_NOMBRES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"
];

export async function generateWordDocument(
  data: InformeMensualData,
  registrosMes: RegistroAip[] = [],
  fechasEspecialesMes: FechaEspecial[] = []
): Promise<Blob> {
  const monthName = MESES_NOMBRES[data.mes] || "Mes";

  // Table cell borders style helper
  const standardBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
  };

  const headerBorder = {
    top: { style: BorderStyle.SINGLE, size: 6, color: "1E293B" },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: "1E293B" },
    left: { style: BorderStyle.SINGLE, size: 6, color: "1E293B" },
    right: { style: BorderStyle.SINGLE, size: 6, color: "1E293B" },
  };

  // Header institutional rows
  const infoRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: "A", bold: true, font: "Arial", size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `: ${data.directorNombre.toUpperCase()}`, bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: `\n  ${data.directorCargo}`, font: "Arial", size: 18, italics: true }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: "DE", bold: true, font: "Arial", size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `: ${data.remitenteNombre.toUpperCase()}`, bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: `\n  ${data.remitenteCargo}`, font: "Arial", size: 18, italics: true }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: "ASUNTO", bold: true, font: "Arial", size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `: ${data.asunto}`, bold: true, font: "Arial", size: 20 }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: "REFERENCIA", bold: true, font: "Arial", size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `: ${data.referencia || "Plan Anual de Trabajo AIP 2026"}`, font: "Arial", size: 20 }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: "FECHA", bold: true, font: "Arial", size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `: ${data.lugar}, ${data.fechaTexto}`, font: "Arial", size: 20 }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  // Activities Table rows
  const activityHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9" },
        borders: headerBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "ACTIVIDAD N° Y OBJETIVO", bold: true, font: "Arial", size: 19, color: "0F172A" }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9" },
        borders: headerBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "DESCRIPCIÓN DE ACCIONES REALIZADAS", bold: true, font: "Arial", size: 19, color: "0F172A" }),
            ],
          }),
        ],
      }),
    ],
  });

  const activityRows = data.actividades.map((act) => {
    // Left side: Actividad title, number and objective
    const leftCellParagraphs: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: `Actividad ${String(act.numero).padStart(2, "0")}: `,
            bold: true,
            font: "Arial",
            size: 20,
            color: "B91C1C", // Red accent
          }),
          new TextRun({
            text: `${act.titulo}`,
            bold: true,
            font: "Arial",
            size: 20,
          }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Objetivo: ", bold: true, italics: true, font: "Arial", size: 18 }),
          new TextRun({ text: act.objetivo, font: "Arial", size: 18 }),
        ],
        spacing: { after: 100 },
      }),
    ];

    if (act.metasBeneficiarios) {
      leftCellParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Metas / Cobertura: ", bold: true, font: "Arial", size: 17, color: "334155" }),
            new TextRun({ text: act.metasBeneficiarios, font: "Arial", size: 17 }),
          ],
          spacing: { after: 60 },
        })
      );
    }

    if (act.mediosVerificacion) {
      leftCellParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Evidencias: ", bold: true, font: "Arial", size: 17, color: "334155" }),
            new TextRun({ text: act.mediosVerificacion, font: "Arial", size: 17 }),
          ],
        })
      );
    }

    // Right side: Tasks breakdown with bullet points
    const rightCellParagraphs: Paragraph[] = [];

    // General description text
    if (act.descripcionTexto && act.descripcionTexto.trim().length > 0) {
      const lines = act.descripcionTexto.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      lines.forEach((line) => {
        // Strip leading hyphen or bullet if user typed one
        const cleanLine = line.replace(/^[-•*]\s*/, "");
        rightCellParagraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: cleanLine,
                font: "Arial",
                size: 19,
                color: "1E293B",
              }),
            ],
          })
        );
      });
    }

    // Specific itemized actions (tareas incorporadas por el docente)
    if (act.tareas && act.tareas.length > 0) {
      act.tareas.forEach((tarea) => {
        rightCellParagraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: `${tarea.subtitulo}: `,
                bold: true,
                font: "Arial",
                size: 19,
                color: "0F172A",
              }),
              new TextRun({
                text: tarea.detalle,
                font: "Arial",
                size: 19,
                color: "334155",
              }),
            ],
          })
        );
      });
    }

    if (rightCellParagraphs.length === 0) {
      rightCellParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Actividades desarrolladas con total normalidad según la programación del periodo.",
              font: "Arial",
              size: 18,
              italics: true,
            }),
          ],
        })
      );
    }

    return new TableRow({
      children: [
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: leftCellParagraphs,
        }),
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: rightCellParagraphs,
        }),
      ],
    });
  });

  // Balance Table (Logros, Dificultades, Sugerencias)
  const balanceHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9" },
        borders: headerBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "LOGROS ALCANZADOS", bold: true, font: "Arial", size: 18, color: "0F172A" }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9" },
        borders: headerBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "DIFICULTADES EXPERIMENTADAS", bold: true, font: "Arial", size: 18, color: "0F172A" }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 34, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9" },
        borders: headerBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "SUGERENCIAS DE MEJORA", bold: true, font: "Arial", size: 18, color: "0F172A" }),
            ],
          }),
        ],
      }),
    ],
  });

  const formatBalanceRuns = (text: string) => {
    if (text.startsWith("[") && text.includes("]")) {
      const closeIdx = text.indexOf("]");
      const tag = text.substring(0, closeIdx + 1);
      const rest = text.substring(closeIdx + 1).trim();
      return [
        new TextRun({ text: tag + " ", bold: true, font: "Arial", size: 18, color: "0B1E36" }),
        new TextRun({ text: rest, font: "Arial", size: 18 }),
      ];
    }
    return [new TextRun({ text, font: "Arial", size: 18 })];
  };

  const logrosParagraphs = (data.logros || []).map(
    (l) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 60, after: 60 },
        children: formatBalanceRuns(l),
      })
  );

  const dificultadesParagraphs = (data.dificultades || []).map(
    (d) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 60, after: 60 },
        children: formatBalanceRuns(d),
      })
  );

  const sugerenciasParagraphs = (data.sugerencias || []).map(
    (s) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 60, after: 60 },
        children: formatBalanceRuns(s),
      })
  );

  const balanceBodyRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE },
        borders: standardBorder,
        children: logrosParagraphs.length > 0 ? logrosParagraphs : [new Paragraph({ children: [new TextRun({ text: "Sin observaciones.", italics: true, font: "Arial", size: 18 })] })],
      }),
      new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE },
        borders: standardBorder,
        children: dificultadesParagraphs.length > 0 ? dificultadesParagraphs : [new Paragraph({ children: [new TextRun({ text: "Ninguna dificultad mayor.", italics: true, font: "Arial", size: 18 })] })],
      }),
      new TableCell({
        width: { size: 34, type: WidthType.PERCENTAGE },
        borders: standardBorder,
        children: sugerenciasParagraphs.length > 0 ? sugerenciasParagraphs : [new Paragraph({ children: [new TextRun({ text: "Continuar con el trabajo coordinado.", italics: true, font: "Arial", size: 18 })] })],
      }),
    ],
  });

  // Calculate AIP statistics for month if available
  const totalSesiones = registrosMes.length;
  const totalEstudiantes = registrosMes.reduce((s, r) => s + (r.estudiantesAsistentes || 0), 0);
  const sesionesConSesion = registrosMes.filter((r) => r.presentoSesion).length;
  const pctConSesion = totalSesiones > 0 ? Math.round((sesionesConSesion / totalSesiones) * 100) : 0;
  
  // Teachers who attended
  const docentesUnicos = Array.from(new Set(registrosMes.map((r) => r.docenteNombre))).length;

  // Special Dates Table Rows (Fechas Especiales / Justificaciones AIP)
  const specialDatesHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 6, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9" },
        borders: headerBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "N°", bold: true, font: "Arial", size: 18 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 18, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9" },
        borders: headerBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "FECHA", bold: true, font: "Arial", size: 18 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9" },
        borders: headerBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "DENOMINACIÓN / MOTIVO", bold: true, font: "Arial", size: 18 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 46, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9" },
        borders: headerBorder,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "JUSTIFICACIÓN OFICIAL DE NO ASISTENCIA AL AIP", bold: true, font: "Arial", size: 18 })],
          }),
        ],
      }),
    ],
  });

  const specialDatesRows = fechasEspecialesMes.map((fe, idx) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(idx + 1), font: "Arial", size: 18 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ 
                  text: (fe.fechaFin && fe.fechaFin !== fe.fecha) ? `${fe.fecha} al ${fe.fechaFin}` : fe.fecha, 
                  bold: true, 
                  font: "Arial", 
                  size: 18 
                }),
                ...((fe.fechaFin && fe.fechaFin !== fe.fecha) ? [
                  new TextRun({
                    text: `\n(${fe.diasRango ? `${fe.diasRango} días` : "Varios días"})`,
                    font: "Arial",
                    size: 15,
                    color: "64748B"
                  })
                ] : [])
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: fe.titulo, bold: true, font: "Arial", size: 18 }),
                new TextRun({ text: `\nTipo: ${fe.tipo}`, italics: true, font: "Arial", size: 16, color: "64748B" }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 46, type: WidthType.PERCENTAGE },
          borders: standardBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: fe.motivoJustificacion, font: "Arial", size: 18, color: "334155" })],
            }),
          ],
        }),
      ],
    });
  });

  // Dynamic Section Roman Numerals
  let sectionCounter = 1;
  const toRoman = (num: number) => ["I", "II", "III", "IV", "V", "VI", "VII"][num - 1] || String(num);

  const actSectionTitle = `${toRoman(sectionCounter++)}. DESCRIPCIÓN DE LAS ACTIVIDADES REALIZADAS`;
  
  const hasSpecialDates = (data.incluirFechasEspeciales !== false) && fechasEspecialesMes.length > 0;
  const specialDatesSectionTitle = hasSpecialDates ? `${toRoman(sectionCounter++)}. JUSTIFICACIÓN DE FECHAS SIN ATENCIÓN EN EL AIP (FERIADOS Y GESTIÓN)` : "";

  const hasAipSummary = Boolean(data.incluirResumenAip && totalSesiones > 0);
  const aipSummarySectionTitle = hasAipSummary ? `${toRoman(sectionCounter++)}. CUADRO ESTADÍSTICO DE ASISTENCIA Y USO DEL AULA DE INNOVACIÓN PEDAGÓGICA (AIP)` : "";

  const balanceSectionTitle = `${toRoman(sectionCounter++)}. BALANCE GENERAL DE LA EXPERIENCIA EN EL MES`;

  const hasConclusiones = Boolean(data.conclusiones && data.conclusiones.length > 0);
  const conclusionesSectionTitle = hasConclusiones ? `${toRoman(sectionCounter++)}. CONCLUSIONES Y RECOMENDACIONES` : "";

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 20,
            color: "0F172A",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // Institutional Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: "“AÑO DEL BICENTENARIO, DE LA CONSOLIDACIÓN DE NUESTRA INDEPENDENCIA, Y DE LA CONMEMORACIÓN DE LAS HEROICAS BATALLAS DE JUNÍN Y AYACUCHO”",
                italics: true,
                bold: true,
                size: 16,
                font: "Arial",
                color: "475569",
              }),
            ],
          }),
          // Institutional Header Table with Official Crest and Hierarchy
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new ImageRun({
                            data: base64ToUint8Array(SCHOOL_LOGO_PNG_BASE64),
                            transformation: { width: 72, height: 82 },
                            type: "png",
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 82, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 30 },
                        children: [
                          new TextRun({
                            text: "MINISTERIO DE EDUCACIÓN\n",
                            bold: true,
                            size: 16,
                            font: "Arial",
                            color: "475569",
                          }),
                          new TextRun({
                            text: "DIRECCIÓN REGIONAL DE EDUCACIÓN DE AYACUCHO • UGEL LUCANAS - PUQUIO\n",
                            font: "Arial",
                            size: 14,
                            color: "64748B",
                          }),
                          new TextRun({
                            text: "I.E.P.M. N° 24009 “TÚPAC AMARU II”\n",
                            bold: true,
                            size: 22,
                            font: "Arial",
                            color: "0B1E36",
                          }),
                          new TextRun({
                            text: "AULA DE INNOVACIÓN PEDAGÓGICA (AIP)",
                            bold: true,
                            size: 18,
                            font: "Arial",
                            color: "B91C1C",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Thin separator line
          new Paragraph({
            spacing: { before: 80, after: 140 },
            children: [
              new TextRun({
                text: "_________________________________________________________________________________",
                color: "94A3B8",
                size: 14,
              }),
            ],
          }),

          // Report Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 240 },
            children: [
              new TextRun({
                text: data.numeroInforme.toUpperCase(),
                bold: true,
                underline: {},
                size: 22,
                font: "Arial",
                color: "0F172A",
              }),
            ],
          }),

          // Header Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: infoRows,
          }),

          // Divider spacing
          new Paragraph({ spacing: { before: 200, after: 160 }, children: [] }),

          // Introduction greeting paragraph
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200, line: 320 },
            children: [
              new TextRun({
                text: data.introduccion || `Tengo el agrado de dirigirme a su digno despacho para hacerle llegar mis cordiales saludos y a la vez informarle detalladamente sobre las actividades y acciones pedagógicas desarrolladas como Docente de Innovación Pedagógica (PIP) de nuestra Institución Educativa correspondientes al mes de ${monthName} de ${data.ano}, el cual se detalla a continuación:`,
                font: "Arial",
                size: 20,
              }),
            ],
          }),

          // Section: Description of Activities
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: actSectionTitle,
                bold: true,
                size: 22,
                font: "Arial",
                color: "0B1E36",
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [activityHeaderRow, ...activityRows],
          }),

          // Special Dates & Justifications of non-attendance in AIP
          ...(hasSpecialDates
            ? [
                new Paragraph({
                  spacing: { before: 240, after: 100 },
                  children: [
                    new TextRun({
                      text: specialDatesSectionTitle,
                      bold: true,
                      size: 22,
                      font: "Arial",
                      color: "0B1E36",
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: { after: 140, line: 300 },
                  children: [
                    new TextRun({
                      text: `Se deja constancia formal que durante el mes de ${monthName} de ${data.ano} no se desarrollaron actividades pedagógicas presenciales en el Aula de Innovación Pedagógica (AIP) en las siguientes fechas programadas, justificando plenamente la no asistencia de los docentes a dicha aula por los motivos institucionales, de gestión escolar y feriados oficiales detallados a continuación:`,
                      font: "Arial",
                      size: 19,
                      color: "334155",
                    }),
                  ],
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [specialDatesHeaderRow, ...specialDatesRows],
                }),
              ]
            : []),

          // Optional Section: Resumen Cuantitativo del AIP
          ...(hasAipSummary
            ? [
                new Paragraph({
                  spacing: { before: 240, after: 120 },
                  children: [
                    new TextRun({
                      text: aipSummarySectionTitle,
                      bold: true,
                      size: 22,
                      font: "Arial",
                      color: "0B1E36",
                    }),
                  ],
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          borders: headerBorder,
                          shading: { fill: "F1F5F9" },
                          children: [new Paragraph({ children: [new TextRun({ text: "INDICADOR DE GESTIÓN AIP", bold: true, size: 18 })] })],
                        }),
                        new TableCell({
                          borders: headerBorder,
                          shading: { fill: "F1F5F9" },
                          children: [new Paragraph({ children: [new TextRun({ text: "VALOR DEL MES", bold: true, size: 18 })] })],
                        }),
                        new TableCell({
                          borders: headerBorder,
                          shading: { fill: "F1F5F9" },
                          children: [new Paragraph({ children: [new TextRun({ text: "OBSERVACIÓN / DETALLE", bold: true, size: 18 })] })],
                        }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: "Sesiones de Aprendizaje Atendidas", size: 18 })] })] }),
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: `${totalSesiones} sesiones`, bold: true, size: 18 })] })] }),
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: "Registradas en el Libro Diario Oficial (Anexo 1)", size: 18 })] })] }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: "Estudiantes Beneficiados Directos", size: 18 })] })] }),
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: `${totalEstudiantes} estudiantes`, bold: true, size: 18 })] })] }),
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: "Nivel primaria de menores", size: 18 })] })] }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: "Docentes de Aula Participantes", size: 18 })] })] }),
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: `${docentesUnicos} docentes`, bold: true, size: 18 })] })] }),
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: "Acompañamiento técnico-pedagógico en aula", size: 18 })] })] }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: "Cumplimiento de Presentación de Sesión TIC", size: 18 })] })] }),
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: `${pctConSesion}% (${sesionesConSesion}/${totalSesiones})`, bold: true, size: 18 })] })] }),
                        new TableCell({ borders: standardBorder, children: [new Paragraph({ children: [new TextRun({ text: "Planificaciones pedagógicas con inclusión digital", size: 18 })] })] }),
                      ],
                    }),
                  ],
                }),
              ]
            : []),

          // Section: Balance General
          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: balanceSectionTitle,
                bold: true,
                size: 22,
                font: "Arial",
                color: "0B1E36",
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [balanceHeaderRow, balanceBodyRow],
          }),

          // Conclusions & Recommendations
          ...(hasConclusiones
            ? [
                new Paragraph({
                  spacing: { before: 240, after: 120 },
                  children: [
                    new TextRun({
                      text: conclusionesSectionTitle,
                      bold: true,
                      size: 22,
                      font: "Arial",
                      color: "0B1E36",
                    }),
                  ],
                }),
                ...data.conclusiones.map(
                  (c) =>
                    new Paragraph({
                      bullet: { level: 0 },
                      spacing: { before: 60, after: 60 },
                      children: [new TextRun({ text: c, font: "Arial", size: 19 })],
                    })
                ),
              ]
            : []),

          // Closing phrase
          new Paragraph({
            spacing: { before: 280, after: 280 },
            children: [
              new TextRun({
                text: "Es todo cuanto tengo que informar a usted, señor Director, para su conocimiento y fines pertinentes del servicio educativo.",
                font: "Arial",
                size: 20,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [
              new TextRun({
                text: "Atentamente,",
                font: "Arial",
                size: 20,
                bold: true,
              }),
            ],
          }),

          // Signatures block
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "____________________________________\n", font: "Arial", size: 20 }),
                          new TextRun({ text: data.remitenteNombre.toUpperCase(), bold: true, font: "Arial", size: 19 }),
                          new TextRun({ text: `\n${data.remitenteCargo}`, font: "Arial", size: 17 }),
                          new TextRun({ text: "\nI.E.P.M. N° 24009 “Túpac Amaru II”", font: "Arial", size: 16 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "____________________________________\n", font: "Arial", size: 20 }),
                          new TextRun({ text: data.directorNombre.toUpperCase(), bold: true, font: "Arial", size: 19 }),
                          new TextRun({ text: `\n${data.directorCargo}`, font: "Arial", size: 17 }),
                          new TextRun({ text: "\nVisto Bueno Dirección", italics: true, font: "Arial", size: 16 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
