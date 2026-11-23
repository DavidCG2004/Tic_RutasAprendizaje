/**
 * Cálculo del progreso de XP.
 *
 * Fórmula de nivel: `Math.floor(xp / XP_PER_LEVEL) + 1`.
 * Umbral de nivel ajustado a 100 XP para asegurar una progresión dinámica
 * alineada al otorgamiento de puntos por módulos (+25/+50) y recursos (+10).
 */

/** XP que cuesta subir de nivel (ajustado a 100 XP para progresión dinámica). */
export const XP_PER_LEVEL = 100;

/**
 * Calcula el nivel alcanzado a partir de la experiencia total acumulada.
 * Fórmula: `Math.floor(xp / XP_PER_LEVEL) + 1` (mínimo nivel 1).
 *
 * @param xp XP total acumulada.
 * @returns Nivel actual correspondiente (1, 2, 3...).
 */
export const calculateLevel = (xp = 0): number => {
  const totalXp = Math.max(0, Number(xp) || 0);
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
};

/**
 * Progreso dentro del nivel actual.
 *
 * @param xp        XP total acumulada.
 * @param level     Nivel actual (si se omite, se deriva de `xp`).
 * @returns `{ xpInLevel, xpNeeded, percent, totalXp }` — `percent` va de 0 a 100.
 */
export const levelProgress = (xp = 0, level?: number) => {
  const totalXp = Math.max(0, Number(xp) || 0);
  const currentLevel = level !== undefined ? Math.max(1, Number(level) || 1) : calculateLevel(totalXp);

  // El XP acumulado en los niveles anteriores.
  const baseXp = (currentLevel - 1) * XP_PER_LEVEL;
  const xpInLevel = Math.max(0, totalXp - baseXp);
  const xpNeeded = Math.max(XP_PER_LEVEL - xpInLevel, 0);
  const percent = Math.min(Math.round((xpInLevel / XP_PER_LEVEL) * 100), 100);

  return { xpInLevel, xpNeeded, percent, totalXp };
};
