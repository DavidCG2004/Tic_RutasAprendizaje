import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AnalyticsDashboard from './AnalyticsDashboard';
import { getMyRoutes } from '../../../api/route.api';
import { getSubjects } from '../../../api/graph.api';
import { getWeeklyActivity } from '../../../api/analytics.api';
import { useTheme } from '@/hooks/useTheme';
import type { UserDashboard } from '../../../types';

vi.mock('../../../api/route.api', () => ({
  getMyRoutes: vi.fn(),
}));

vi.mock('../../../api/graph.api', () => ({
  getSubjects: vi.fn(),
}));

vi.mock('../../../api/analytics.api', () => ({
  getWeeklyActivity: vi.fn(),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: vi.fn(),
}));

// Recharts ResponsiveContainer necesita mock de dimensiones en jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 400, height: 300 }}>{children}</div>
    ),
  };
});

const mockGetMyRoutes = vi.mocked(getMyRoutes);
const mockGetSubjects = vi.mocked(getSubjects);
const mockGetWeeklyActivity = vi.mocked(getWeeklyActivity);
const mockUseTheme = vi.mocked(useTheme);

const MOCK_USER: UserDashboard = {
  id: '1',
  name: 'Estudiante Demo',
  email: 'estudiante@epn.edu.ec',
  roles: ['STUDENT'],
  primaryRole: 'STUDENT',
  xp: 800,
  level: 2,
  streak: 4,
};

describe('AnalyticsDashboard — Theming de distribución de rutas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSubjects.mockResolvedValue([]);
    mockGetWeeklyActivity.mockResolvedValue({
      success: true,
      totalMinutes: 0,
      totalCompletedModules: 0,
      weeklyActivity: [],
    });
    mockGetMyRoutes.mockResolvedValue([
      { id: '1', title: 'Ruta 1', progress: 100 },
      { id: '2', title: 'Ruta 2', progress: 50 },
      { id: '3', title: 'Ruta 3', progress: 0 },
    ]);
  });

  it('usa los tonos claros en modo light (#e7e5e4 para En progreso)', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
    });

    render(<AnalyticsDashboard userData={MOCK_USER} />);

    await waitFor(() => {
      expect(screen.getByText('Distribución de rutas')).toBeInTheDocument();
    });

    // Validamos que los ítems de la leyenda tengan los estilos esperados
    const completadoDot = screen.getByText('Completado').querySelector('span[aria-hidden="true"]');
    expect(completadoDot).toHaveStyle({ backgroundColor: '#dc2626' });

    const enProgresoDot = screen.getByText('En progreso').querySelector('span[aria-hidden="true"]');
    expect(enProgresoDot).toHaveStyle({ backgroundColor: '#e7e5e4' });

    const sinIniciarDot = screen.getByText('Sin iniciar').querySelector('span[aria-hidden="true"]');
    expect(sinIniciarDot).toHaveStyle({ backgroundColor: '#1C1917' });
  });

  it('usa el tono oscuro #44403c para En progreso en modo dark, igual que en Progreso por materia', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
    });

    render(<AnalyticsDashboard userData={MOCK_USER} />);

    await waitFor(() => {
      expect(screen.getByText('Distribución de rutas')).toBeInTheDocument();
    });

    // En modo dark:
    // - Completado: #dc2626
    // - En progreso: #44403c (igual que la barra de total en progreso por materia)
    // - Sin iniciar: #a8a29e (tono visible en fondo oscuro)
    const completadoDot = screen.getByText('Completado').querySelector('span[aria-hidden="true"]');
    expect(completadoDot).toHaveStyle({ backgroundColor: '#dc2626' });

    const enProgresoDot = screen.getByText('En progreso').querySelector('span[aria-hidden="true"]');
    expect(enProgresoDot).toHaveStyle({ backgroundColor: '#44403c' });

    const sinIniciarDot = screen.getByText('Sin iniciar').querySelector('span[aria-hidden="true"]');
    expect(sinIniciarDot).toHaveStyle({ backgroundColor: '#a8a29e' });
  });
});
