import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { getRoutes, deleteRoute } from '../../../api/route.api';
import RoutesManager from './RoutesManager';
import type { LearningRoute } from '../../../types';

vi.mock('../../../api/route.api', () => ({
  getRoutes: vi.fn(),
  deleteRoute: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('./GenerateRouteModal', () => ({
  default: () => null,
}));

vi.mock('./RouteBuilder', () => ({
  default: () => <div>RouteBuilder Mock</div>,
}));

const mockGetRoutes = vi.mocked(getRoutes);
const mockDeleteRoute = vi.mocked(deleteRoute);

const sampleRoutes: LearningRoute[] = [
  {
    id: 'route-1',
    title: 'Arquitectura Limpia en Node.js',
    description: 'Aprende hexagonal y clean code',
    category: 'Backend',
    difficulty: 'INTERMEDIATE',
    estimatedTime: 120,
    modules: [
      { id: 'm1', title: 'Capas y Puertos', description: '', position: 1, resources: [] },
      { id: 'm2', title: 'Adaptadores y Repositorios', description: '', position: 2, resources: [] },
    ],
  },
  {
    id: 'route-2',
    title: 'React con TypeScript',
    description: 'Componentes tipados y hooks',
    category: 'Frontend',
    difficulty: 'BEGINNER',
    estimatedTime: 90,
    modules: [],
  },
];

describe('RoutesManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza las rutas agrupadas por categoría', async () => {
    mockGetRoutes.mockResolvedValue(sampleRoutes);
    render(<RoutesManager />);

    await waitFor(() => {
      expect(screen.getByText('Arquitectura Limpia en Node.js')).toBeInTheDocument();
    });

    expect(screen.getByText('React con TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });

  it('muestra el modal de confirmación antes de eliminar y permite cancelar', async () => {
    mockGetRoutes.mockResolvedValue(sampleRoutes);
    render(<RoutesManager />);

    await waitFor(() => {
      expect(screen.getByText('Arquitectura Limpia en Node.js')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: 'Eliminar Arquitectura Limpia en Node.js' });
    fireEvent.click(deleteBtn);

    // Debe mostrarse el modal
    expect(screen.getByText('¿Eliminar ruta de aprendizaje?')).toBeInTheDocument();
    expect(
      screen.getByText(/¿Confirmas que deseas eliminar permanentemente la ruta/i)
    ).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/módulos asociados/i)).toBeInTheDocument();

    // Cancelar
    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('¿Eliminar ruta de aprendizaje?')).toBeNull();
    expect(mockDeleteRoute).not.toHaveBeenCalled();
  });

  it('elimina la ruta al confirmar en el modal', async () => {
    mockGetRoutes.mockResolvedValue(sampleRoutes);
    mockDeleteRoute.mockResolvedValue(undefined);
    render(<RoutesManager />);

    await waitFor(() => {
      expect(screen.getByText('Arquitectura Limpia en Node.js')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: 'Eliminar Arquitectura Limpia en Node.js' });
    fireEvent.click(deleteBtn);

    expect(screen.getByText('¿Eliminar ruta de aprendizaje?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Sí, eliminar' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteRoute).toHaveBeenCalledWith('route-1');
    });
  });

  it('muestra estado vacío cuando no existen rutas registradas', async () => {
    mockGetRoutes.mockResolvedValue([]);
    render(<RoutesManager />);

    await waitFor(() => {
      expect(screen.getByText('No hay rutas estructuradas aún')).toBeInTheDocument();
    });
  });
});
