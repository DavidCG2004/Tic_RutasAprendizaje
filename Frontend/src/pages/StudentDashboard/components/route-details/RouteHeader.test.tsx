import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RouteHeader from './RouteHeader';
import type { LearningRoute } from '../../../../types';
import type { RouteProgress } from '../../../../utils/routeProgress';

const mockRoute: LearningRoute = {
  id: 'r1',
  title: 'Ruta de Arquitectura de Software',
  description: 'Aprende patrones y clean architecture.',
  difficulty: 'INTERMEDIATE',
  estimatedTime: 120,
};

const mockProgress: RouteProgress = {
  percentage: 38,
  openedResources: 3,
  totalResources: 8,
  passedEvaluations: 1,
  totalEvaluations: 3,
  passedModules: 1,
  totalModules: 2,
};

describe('RouteHeader — barra de avance', () => {
  it('no muestra barra de progreso si no está inscrito', () => {
    render(
      <RouteHeader
        route={mockRoute}
        isEnrolled={false}
        isEnrolling={false}
        onEnroll={vi.fn()}
        progress={mockProgress}
      />
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('no muestra barra si progress es null o undefined', () => {
    render(
      <RouteHeader
        route={mockRoute}
        isEnrolled={true}
        isEnrolling={false}
        onEnroll={vi.fn()}
        progress={null}
      />
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('muestra la barra con porcentaje y desglose textual cuando isEnrolled && progress', () => {
    render(
      <RouteHeader
        route={mockRoute}
        isEnrolled={true}
        isEnrolling={false}
        onEnroll={vi.fn()}
        progress={mockProgress}
      />
    );

    const bar = screen.getByRole('progressbar', { name: 'Avance de la ruta' });
    expect(bar).toHaveAttribute('aria-valuenow', '38');
    expect(screen.getByText('38%')).toBeInTheDocument();
    expect(screen.getByText('3 de 8 recursos · 1 de 2 módulos aprobados')).toBeInTheDocument();
  });

  it('muestra pill "Ruta completada" cuando percentage es 100', () => {
    render(
      <RouteHeader
        route={mockRoute}
        isEnrolled={true}
        isEnrolling={false}
        onEnroll={vi.fn()}
        progress={{ ...mockProgress, percentage: 100 }}
      />
    );

    expect(screen.getByText('Ruta completada')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('omite la parte de recursos en el desglose si totalResources es 0', () => {
    render(
      <RouteHeader
        route={mockRoute}
        isEnrolled={true}
        isEnrolling={false}
        onEnroll={vi.fn()}
        progress={{ ...mockProgress, totalResources: 0, openedResources: 0 }}
      />
    );

    expect(screen.getByText('1 de 2 módulos aprobados')).toBeInTheDocument();
    expect(screen.queryByText(/recursos/)).not.toBeInTheDocument();
  });

  it('el botón de inscripción funciona cuando no está inscrito', () => {
    const onEnroll = vi.fn();
    render(
      <RouteHeader
        route={mockRoute}
        isEnrolled={false}
        isEnrolling={false}
        onEnroll={onEnroll}
      />
    );

    const btn = screen.getByRole('button', { name: 'Inscribirme en esta ruta' });
    fireEvent.click(btn);
    expect(onEnroll).toHaveBeenCalledTimes(1);
  });
});
