import type { Module } from '../types';

export const RESOURCE_WEIGHT   = 60;
export const ASSESSMENT_WEIGHT = 40;

export interface RouteProgressInput {
  modules?: Module[];
  /** IDs de recursos abiertos, tal como los devuelve GET /routes/:id */
  openedResourceIds: readonly string[];
}

export interface RouteProgress {
  /** Entero 0–100, redondeado una sola vez al final. */
  percentage: number;
  openedResources: number;
  totalResources: number;
  passedEvaluations: number;
  totalEvaluations: number;
  passedModules: number;
  totalModules: number;
}

export const computeRouteProgress = ({
  modules = [],
  openedResourceIds,
}: RouteProgressInput): RouteProgress => {
  // Recursos únicos de todos los módulos (deduplicados por id)
  const allResourceIds = new Set(
    modules.flatMap((m) => (m.resources ?? []).map((r) => r.id))
  );
  const totalResources = allResourceIds.size;

  // Solo contar recursos que pertenecen a esta ruta (evita inflado por ids ajenos)
  const openedInRoute = openedResourceIds.filter((id) => allResourceIds.has(id));
  const openedResources = new Set(openedInRoute).size;

  const totalModules = modules.length;

  // Evaluaciones disponibles: N cuestionarios + 1 reto final (mismo que backend)
  const totalEvaluations = totalModules > 0 ? totalModules + 1 : 0;

  // Evaluaciones aprobadas
  const passedTheoryCount   = modules.filter((m) => m.passedTheory).length;
  const passedPracticeCount = modules.filter((m) => m.passedPractice).length;
  const passedEvaluations   = passedTheoryCount + passedPracticeCount;

  // Módulos aprobados (cualquier tipo): para el desglose textual
  const passedModules = modules.filter((m) => m.isPassed).length;

  // Fórmula 60/40 — una sola vez al final
  const resourceScore = totalResources > 0
    ? (openedResources / totalResources) * RESOURCE_WEIGHT
    : 0;
  const evalScore = totalEvaluations > 0
    ? (passedEvaluations / totalEvaluations) * ASSESSMENT_WEIGHT
    : 0;

  const raw = resourceScore + evalScore;
  const percentage = Math.min(100, Math.max(0, Number.isNaN(raw) ? 0 : Math.round(raw)));

  return {
    percentage,
    openedResources,
    totalResources,
    passedEvaluations,
    totalEvaluations,
    passedModules,
    totalModules,
  };
};
