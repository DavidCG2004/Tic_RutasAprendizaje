import { describe, it, expect } from 'vitest';
import { computeRouteProgress } from './routeProgress';

describe('computeRouteProgress', () => {
  // Helper para crear módulos de prueba
  const makeModules = (n: number, passedTheory = 0, passedPractice = 0) =>
    Array.from({ length: n }, (_, i) => ({
      id: String(i + 1),
      title: `Módulo ${i + 1}`,
      passedTheory: i < passedTheory,
      passedPractice: i === n - 1 && passedPractice > 0,
      isPassed: i < passedTheory,
      resources: Array.from({ length: 4 }, (_, j) => ({
        id: `r${i * 4 + j + 1}`,
        title: `Recurso ${i * 4 + j + 1}`,
        url: 'https://example.com',
        type: 'LINK' as const,
      })),
    }));

  it('0/12 recursos y 0/3 módulos → 0', () => {
    expect(computeRouteProgress({ modules: makeModules(3), openedResourceIds: [] }).percentage).toBe(0);
  });

  it('12/12 recursos y 3/3 módulos aprobados (teoria + practice) → 100', () => {
    const mods = makeModules(3, 3, 1);
    const allIds = mods.flatMap((m) => m.resources.map((r) => r.id));
    expect(computeRouteProgress({ modules: mods, openedResourceIds: allIds }).percentage).toBe(100);
  });

  it('percentage nunca supera 100 con datos corruptos', () => {
    const mods = makeModules(3, 10, 5); // más de lo posible
    const ids = Array.from({ length: 100 }, (_, i) => `r${i}`);
    expect(computeRouteProgress({ modules: mods, openedResourceIds: ids }).percentage).toBeLessThanOrEqual(100);
  });

  it('percentage nunca es negativo ni NaN', () => {
    const result = computeRouteProgress({ modules: [], openedResourceIds: [] });
    expect(result.percentage).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(result.percentage)).toBe(false);
  });

  it('ids de otra ruta no inflan el resultado', () => {
    const mods = makeModules(2);
    const result = computeRouteProgress({ modules: mods, openedResourceIds: ['ajeno-1', 'ajeno-2'] });
    expect(result.openedResources).toBe(0);
  });

  it('recurso compartido por dos módulos cuenta una vez', () => {
    const sharedId = 'shared';
    const mods = [
      {
        id: '1',
        title: 'M1',
        isPassed: false,
        resources: [{ id: sharedId, title: 'Shared', url: 'https://example.com', type: 'LINK' as const }],
      },
      {
        id: '2',
        title: 'M2',
        isPassed: false,
        resources: [{ id: sharedId, title: 'Shared', url: 'https://example.com', type: 'LINK' as const }],
      },
    ];
    const result = computeRouteProgress({ modules: mods, openedResourceIds: [sharedId] });
    expect(result.totalResources).toBe(1);
    expect(result.openedResources).toBe(1);
  });
});
