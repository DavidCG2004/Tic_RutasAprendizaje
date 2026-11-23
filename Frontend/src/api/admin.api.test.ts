import { describe, it, expect, beforeEach, vi } from 'vitest';
import httpClient from './httpClient';
import {
  deleteStudentEnrollment,
  resetStudentEnrollments,
  getUserProgress,
} from './admin.api';

vi.mock('./httpClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGet = vi.mocked(httpClient.get);
const mockDelete = vi.mocked(httpClient.delete);

describe('admin.api — Inscripciones y progreso de estudiantes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deleteStudentEnrollment llama al endpoint correcto DELETE /admin/users/:userId/enrollments/:routeId', async () => {
    mockDelete.mockResolvedValueOnce({
      data: { message: 'Inscripción eliminada correctamente' },
    });

    const result = await deleteStudentEnrollment('15', '4');

    expect(mockDelete).toHaveBeenCalledWith('/admin/users/15/enrollments/4');
    expect(result.message).toBe('Inscripción eliminada correctamente');
  });

  it('resetStudentEnrollments llama al endpoint correcto DELETE /admin/users/:userId/enrollments', async () => {
    mockDelete.mockResolvedValueOnce({
      data: { message: 'Todas las rutas fueron eliminadas' },
    });

    const result = await resetStudentEnrollments('15');

    expect(mockDelete).toHaveBeenCalledWith('/admin/users/15/enrollments');
    expect(result.message).toBe('Todas las rutas fueron eliminadas');
  });

  it('getUserProgress llama al endpoint correcto GET /admin/users/:id/progress', async () => {
    const mockProgress = {
      user: { id: '15', name: 'Estudiante Prueba' },
      progress: { points: 100, level: 2, routes: [] },
    };
    mockGet.mockResolvedValueOnce({ data: mockProgress });

    const result = await getUserProgress('15');

    expect(mockGet).toHaveBeenCalledWith('/admin/users/15/progress');
    expect(result).toEqual(mockProgress);
  });
});
