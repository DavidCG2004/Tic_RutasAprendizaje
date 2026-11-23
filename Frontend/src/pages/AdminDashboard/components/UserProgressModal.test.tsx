import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import UserProgressModal from './UserProgressModal';
import {
  getUserProgress,
  deleteStudentEnrollment,
  resetStudentEnrollments,
  type AdminUserProgress,
} from '../../../api/admin.api';
import { exportStudentProgressPdf } from '../../../utils/pdfExport';
import type { User } from '../../../types';

vi.mock('../../../api/admin.api', () => ({
  getUserProgress: vi.fn(),
  deleteStudentEnrollment: vi.fn(),
  resetStudentEnrollments: vi.fn(),
}));

vi.mock('../../../utils/pdfExport', () => ({
  exportStudentProgressPdf: vi.fn(),
}));

const mockGetUserProgress = vi.mocked(getUserProgress);
const mockDeleteStudentEnrollment = vi.mocked(deleteStudentEnrollment);
const mockResetStudentEnrollments = vi.mocked(resetStudentEnrollments);
const mockExportStudentProgressPdf = vi.mocked(exportStudentProgressPdf);

const MOCK_USER: User = {
  id: '42',
  name: 'Carlos Mendoza',
  email: 'carlos.mendoza@epn.edu.ec',
  roles: ['STUDENT'],
  career: 'Desarrollo de Software',
  semester: 4,
  uniqueId: '202310999',
  createdAt: '2026-10-15T10:00:00.000Z',
  lastLogin: '2026-11-20T15:30:00.000Z',
};

const MOCK_PROGRESS: AdminUserProgress = {
  user: MOCK_USER,
  progress: {
    points: 1250,
    level: 3,
    streak: 5,
    modulesCompleted: 2,
    modulesPassed: 2,
    averageScore: 88,
    routesEnrolled: 4,
    averageProgress: 44,
    routes: [
      { id: '1', title: 'Fundamentos de Programación', category: 'Software', progress: 100, enrolledAt: '2026-01-01' },
      { id: '2', title: 'Estructuras de Datos', category: 'Software', progress: 50, enrolledAt: '2026-01-02' },
      { id: '3', title: 'Bases de Datos SQL', category: 'Software', progress: 25, enrolledAt: '2026-01-03' },
      { id: '4', title: 'Arquitectura Web', category: 'Software', progress: 0, enrolledAt: '2026-01-04' },
    ],
  },
};

describe('UserProgressModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen es false o user es null', () => {
    const { rerender } = render(
      <UserProgressModal isOpen={false} onClose={vi.fn()} user={MOCK_USER} />
    );
    expect(screen.queryByText('Progreso del estudiante')).not.toBeInTheDocument();

    rerender(<UserProgressModal isOpen={true} onClose={vi.fn()} user={null} />);
    expect(screen.queryByText('Progreso del estudiante')).not.toBeInTheDocument();
  });

  it('calcula y muestra Rutas completadas (1 / 4) en lugar de un conteo engañoso de módulos', async () => {
    mockGetUserProgress.mockResolvedValueOnce(MOCK_PROGRESS);

    render(<UserProgressModal isOpen={true} onClose={vi.fn()} user={MOCK_USER} />);

    expect(screen.getByText('Consultando el avance del usuario…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Progreso del estudiante')).toBeInTheDocument();
    });

    // Encabezado con datos del estudiante
    expect(screen.getByText(/Carlos Mendoza/i)).toBeInTheDocument();
    expect(screen.getByText(/EPN: 202310999/i)).toBeInTheDocument();

    // Verificamos la tarjeta de Rutas Completadas
    expect(screen.getByText('Rutas')).toBeInTheDocument();
    expect(screen.getByText('Completadas')).toBeInTheDocument();

    const rutascCard = screen.getByText('Rutas').closest('div');
    expect(rutascCard).toHaveTextContent('1');
    expect(rutascCard).toHaveTextContent('/ 4');

    // Verificamos que lista las 4 rutas
    expect(screen.getByText('Fundamentos de Programación')).toBeInTheDocument();
    expect(screen.getByText('Estructuras de Datos')).toBeInTheDocument();
  });

  it('muestra la fecha de registro y el último acceso del estudiante cuando están disponibles', async () => {
    mockGetUserProgress.mockResolvedValueOnce(MOCK_PROGRESS);

    render(<UserProgressModal isOpen={true} onClose={vi.fn()} user={MOCK_USER} />);

    await waitFor(() => {
      expect(screen.getByText('Progreso del estudiante')).toBeInTheDocument();
    });

    expect(screen.getByText('Fecha de registro')).toBeInTheDocument();
    expect(screen.getByText('15/10/2026')).toBeInTheDocument();

    expect(screen.getByText('Último acceso')).toBeInTheDocument();
    expect(screen.getByText(/20\/11\/2026/)).toBeInTheDocument();
  });

  it('muestra fallback "Sin registros recientes" cuando no hay último acceso registrado', async () => {
    const userWithoutLogin: User = {
      ...MOCK_USER,
      lastLogin: null,
    };
    const progressWithoutLogin: AdminUserProgress = {
      ...MOCK_PROGRESS,
      user: userWithoutLogin,
    };
    mockGetUserProgress.mockResolvedValueOnce(progressWithoutLogin);

    render(<UserProgressModal isOpen={true} onClose={vi.fn()} user={userWithoutLogin} />);

    await waitFor(() => {
      expect(screen.getByText('Progreso del estudiante')).toBeInTheDocument();
    });

    expect(screen.getByText('Sin registros recientes')).toBeInTheDocument();
  });

  it('permite reintentar si la llamada al backend falla', async () => {
    mockGetUserProgress.mockRejectedValueOnce(new Error('Fallo de red'));

    render(<UserProgressModal isOpen={true} onClose={vi.fn()} user={MOCK_USER} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    mockGetUserProgress.mockResolvedValueOnce(MOCK_PROGRESS);
    const retryBtn = screen.getByRole('button', { name: 'Reintentar' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Fundamentos de Programación')).toBeInTheDocument();
    });
  });

  it('ejecuta onClose al pulsar el botón cerrar', async () => {
    mockGetUserProgress.mockResolvedValueOnce(MOCK_PROGRESS);
    const onClose = vi.fn();

    render(<UserProgressModal isOpen={true} onClose={onClose} user={MOCK_USER} />);

    await waitFor(() => {
      expect(screen.getByText('Progreso del estudiante')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: 'Cerrar' });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('llama a exportStudentProgressPdf al pulsar Descargar PDF', async () => {
    mockGetUserProgress.mockResolvedValueOnce(MOCK_PROGRESS);

    render(<UserProgressModal isOpen={true} onClose={vi.fn()} user={MOCK_USER} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Descargar PDF' })).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: 'Descargar PDF' });
    fireEvent.click(downloadBtn);

    expect(mockExportStudentProgressPdf).toHaveBeenCalledWith(MOCK_PROGRESS);
  });

  it('permite eliminar una ruta inscrita individualmente', async () => {
    mockGetUserProgress.mockResolvedValue(MOCK_PROGRESS);
    mockDeleteStudentEnrollment.mockResolvedValue({ message: 'Inscripción eliminada' });

    render(<UserProgressModal isOpen={true} onClose={vi.fn()} user={MOCK_USER} />);

    await waitFor(() => {
      expect(screen.getByText('Fundamentos de Programación')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', {
      name: 'Eliminar inscripción en Fundamentos de Programación',
    });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteStudentEnrollment).toHaveBeenCalledWith('42', '1');
      // Debe refetch para actualizar la lista
      expect(mockGetUserProgress).toHaveBeenCalledTimes(2);
    });
  });

  it('permite eliminar todas las rutas inscritas con el botón Eliminar todas', async () => {
    mockGetUserProgress.mockResolvedValue(MOCK_PROGRESS);
    mockResetStudentEnrollments.mockResolvedValue({ message: 'Rutas reiniciadas' });

    render(<UserProgressModal isOpen={true} onClose={vi.fn()} user={MOCK_USER} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Eliminar todas' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar todas' }));

    await waitFor(() => {
      expect(mockResetStudentEnrollments).toHaveBeenCalledWith('42');
      expect(mockGetUserProgress).toHaveBeenCalledTimes(2);
    });
  });
});
