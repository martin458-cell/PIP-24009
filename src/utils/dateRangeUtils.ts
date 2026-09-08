import { FechaEspecial } from "../types";

/**
 * Normaliza y compara si una fecha dada (YYYY-MM-DD) se encuentra dentro del rango
 * de una FechaEspecial (desde f.fecha hasta f.fechaFin inclusive).
 */
export function isDateInRange(targetDateStr: string, startDateStr: string, endDateStr?: string): boolean {
  if (!startDateStr) return false;
  const start = startDateStr.slice(0, 10);
  const end = (endDateStr && endDateStr.trim().length >= 10) ? endDateStr.slice(0, 10) : start;
  
  return targetDateStr >= start && targetDateStr <= end;
}

/**
 * Verifica si una FechaEspecial está activa e incide en una fecha específica (YYYY-MM-DD).
 */
export function isSpecialDateActiveOnDate(dateStr: string, f: FechaEspecial): boolean {
  if (!f.activo) return false;
  return isDateInRange(dateStr, f.fecha, f.fechaFin);
}

/**
 * Verifica si una FechaEspecial se cruza o intersecta con un mes determinado (0..11).
 */
export function doesSpecialDateOverlapMonth(f: FechaEspecial, year: number, monthZeroIndexed: number): boolean {
  if (!f.activo || !f.fecha) return false;

  const monthNum = String(monthZeroIndexed + 1).padStart(2, "0");
  const monthStart = `${year}-${monthNum}-01`;
  const lastDay = new Date(year, monthZeroIndexed + 1, 0).getDate();
  const monthEnd = `${year}-${monthNum}-${String(lastDay).padStart(2, "0")}`;

  const start = f.fecha.slice(0, 10);
  const end = (f.fechaFin && f.fechaFin.trim().length >= 10) ? f.fechaFin.slice(0, 10) : start;

  // Se cruzan si el inicio es menor o igual al fin de mes y el fin es mayor o igual al inicio de mes
  return start <= monthEnd && end >= monthStart;
}

/**
 * Calcula la cantidad total de días calendario y días hábiles (lunes a viernes)
 * entre dos fechas YYYY-MM-DD inclusive.
 */
export function calculatePeriodDays(startDateStr: string, endDateStr?: string): { totalDias: number; diasHabiles: number } {
  if (!startDateStr) return { totalDias: 0, diasHabiles: 0 };

  const start = startDateStr.slice(0, 10);
  const end = (endDateStr && endDateStr.trim().length >= 10) ? endDateStr.slice(0, 10) : start;

  if (start > end) {
    return { totalDias: 0, diasHabiles: 0 };
  }

  const [y1, m1, d1] = start.split("-").map(Number);
  const [y2, m2, d2] = end.split("-").map(Number);

  const curDate = new Date(y1, m1 - 1, d1);
  const targetDate = new Date(y2, m2 - 1, d2);

  let totalDias = 0;
  let diasHabiles = 0;

  while (curDate <= targetDate) {
    totalDias++;
    const dayOfWeek = curDate.getDay(); // 0 = Dom, 1 = Lun, ..., 6 = Sáb
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      diasHabiles++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }

  return { totalDias, diasHabiles };
}

/**
 * Devuelve una etiqueta legible del periodo:
 * - Un solo día: "01/05/2026"
 * - Rango: "Del 27/07/2026 al 07/08/2026 (12 días)"
 */
export function formatPeriodoDisplay(startDateStr: string, endDateStr?: string, showDuration = true): string {
  if (!startDateStr) return "";
  const start = startDateStr.slice(0, 10);
  const end = (endDateStr && endDateStr.trim().length >= 10) ? endDateStr.slice(0, 10) : start;

  const [y1, m1, d1] = start.split("-");
  const formattedStart = `${d1}/${m1}/${y1}`;

  if (!end || end === start) {
    return formattedStart;
  }

  const [y2, m2, d2] = end.split("-");
  const formattedEnd = `${d2}/${m2}/${y2}`;

  const { totalDias, diasHabiles } = calculatePeriodDays(start, end);

  if (!showDuration) {
    return `Del ${formattedStart} al ${formattedEnd}`;
  }

  return `Del ${formattedStart} al ${formattedEnd} (${totalDias} días • ${diasHabiles} hábiles)`;
}
