import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RouteExplorer from './RouteExplorer';
import type { LearningRoute } from '../../../types';

const sampleRoutes: LearningRoute[] = [
  {
    id: 'r1',
    title: 'Desarrollo Web Frontend Moderno',
    description: 'Aprende React, Tailwind y Vite desde cero',
    category: 'Desarrollo Web Frontend',
    difficulty: 'BEGINNER',
    estimatedTime: 90,
    modules: [],
  },
  {
    id: 'r2',
    title: 'Bases de Datos y SQL',
    description: 'Modelado relacional y optimización de consultas',
    category: 'Bases de Datos y Persistencia',
    difficulty: 'INTERMEDIATE',
    estimatedTime: 120,
    modules: [],
  },
];

describe('RouteExplorer — buscador de rutas curriculares', () => {
  const onSelectRoute = vi.fn();
  const onOpenSelfDiagnosis = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza todas las rutas inicialmente con el contador', () => {
    render(
      <RouteExplorer
        routes={sampleRoutes}
        loading={false}
        onSelectRoute={onSelectRoute}
        onOpenSelfDiagnosis={onOpenSelfDiagnosis}
      />
    );

    expect(screen.getByText('Desarrollo Web Frontend Moderno')).toBeTruthy();
    expect(screen.getByText('Bases de Datos y SQL')).toBeTruthy();
    expect(screen.getByText('2 rutas disponibles')).toBeTruthy();
  });

  it('filtra las rutas en tiempo real por título o categoría', () => {
    render(
      <RouteExplorer
        routes={sampleRoutes}
        loading={false}
        onSelectRoute={onSelectRoute}
        onOpenSelfDiagnosis={onOpenSelfDiagnosis}
      />
    );

    const input = screen.getByPlaceholderText('Buscar rutas por título, descripción o categoría...');
    fireEvent.change(input, { target: { value: 'frontend' } });

    expect(screen.getByText('Desarrollo Web Frontend Moderno')).toBeTruthy();
    expect(screen.queryByText('Bases de Datos y SQL')).toBeNull();
    expect(screen.getByText('1 de 2 rutas')).toBeTruthy();

    // Limpiar búsqueda
    const clearBtn = screen.getByRole('button', { name: 'Borrar texto' });
    fireEvent.click(clearBtn);

    expect(screen.getByText('Bases de Datos y SQL')).toBeTruthy();
    expect(screen.getByText('2 rutas disponibles')).toBeTruthy();
  });

  it('muestra estado vacío y permite reintentar cuando no hay coincidencias', () => {
    render(
      <RouteExplorer
        routes={sampleRoutes}
        loading={false}
        onSelectRoute={onSelectRoute}
        onOpenSelfDiagnosis={onOpenSelfDiagnosis}
      />
    );

    const input = screen.getByPlaceholderText('Buscar rutas por título, descripción o categoría...');
    fireEvent.change(input, { target: { value: 'inexistente' } });

    expect(screen.getByText('No se encontraron rutas')).toBeTruthy();
    expect(screen.getByText('0 de 2 rutas')).toBeTruthy();

    const clearBtn = screen.getByRole('button', { name: 'Limpiar búsqueda' });
    fireEvent.click(clearBtn);

    expect(screen.getByText('Desarrollo Web Frontend Moderno')).toBeTruthy();
  });

  it('filtra defensivamente y excluye rutas privadas, adaptativas o generadas por IA', () => {
    const mixedRoutes: LearningRoute[] = [
      {
        id: 'pub-1',
        title: 'Ruta Institucional Pública',
        category: 'Ingeniería',
        difficulty: 'BEGINNER',
        isPublic: 1,
        modules: [],
      },
      {
        id: 'priv-1',
        title: 'Ruta Privada de Estudiante',
        category: 'Personal',
        difficulty: 'BEGINNER',
        isPublic: 0,
        modules: [],
      },
      {
        id: 'adapt-1',
        title: 'Ruta Adaptativa de Autodiagnóstico',
        category: 'Personal',
        difficulty: 'ADAPTIVE',
        isPublic: 1, // incluso si backend erróneamente la guardó con isPublic=1
        modules: [],
      },
      {
        id: 'ai-1',
        title: 'Ruta Creada con IA',
        category: 'Generada por IA',
        difficulty: 'INTERMEDIATE',
        isPublic: 1,
        modules: [],
      },
    ];

    render(
      <RouteExplorer
        routes={mixedRoutes}
        loading={false}
        onSelectRoute={onSelectRoute}
        onOpenSelfDiagnosis={onOpenSelfDiagnosis}
      />
    );

    expect(screen.getByText('Ruta Institucional Pública')).toBeTruthy();
    expect(screen.queryByText('Ruta Privada de Estudiante')).toBeNull();
    expect(screen.queryByText('Ruta Adaptativa de Autodiagnóstico')).toBeNull();
    expect(screen.queryByText('Ruta Creada con IA')).toBeNull();
    expect(screen.getByText('1 ruta disponible')).toBeTruthy();
  });
});
