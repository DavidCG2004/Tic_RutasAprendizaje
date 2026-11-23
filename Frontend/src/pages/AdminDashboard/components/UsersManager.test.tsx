import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import UsersManager from './UsersManager';
import { getUsers } from '../../../api/admin.api';
import { exportGeneralUsersPdf } from '../../../utils/pdfExport';
import type { User } from '../../../types';

vi.mock('../../../api/admin.api', () => ({
  getUsers: vi.fn(),
  toggleUserStatus: vi.fn(),
  unlockUser: vi.fn(),
}));

vi.mock('../../../utils/pdfExport', () => ({
  exportGeneralUsersPdf: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockGetUsers = vi.mocked(getUsers);
const mockExportGeneralUsersPdf = vi.mocked(exportGeneralUsersPdf);

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Estudiante Uno',
    email: 'estudiante.uno@epn.edu.ec',
    roles: ['STUDENT'],
    uniqueId: '202310001',
    career: 'Software',
    semester: 3,
    isActive: true,
    isLocked: false,
  },
  {
    id: '2',
    name: 'Admin Dos',
    email: 'admin.dos@epn.edu.ec',
    roles: ['ADMIN'],
    uniqueId: '202010002',
    isActive: true,
    isLocked: false,
  },
];

describe('UsersManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la lista de usuarios y el botón de exportar reporte PDF', async () => {
    mockGetUsers.mockResolvedValueOnce(MOCK_USERS);

    render(<UsersManager />);

    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Estudiante Uno').length).toBeGreaterThanOrEqual(1);
    });

    const exportBtn = screen.getByRole('button', { name: /exportar reporte pdf/i });
    expect(exportBtn).toBeInTheDocument();
    expect(exportBtn).toBeEnabled();
  });

  it('deshabilita el botón de exportar PDF si la lista de usuarios está vacía', async () => {
    mockGetUsers.mockResolvedValueOnce([]);

    render(<UsersManager />);

    await waitFor(() => {
      expect(screen.getByText('Todavía no hay usuarios registrados')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /exportar reporte pdf/i });
    expect(exportBtn).toBeDisabled();
  });

  it('llama a exportGeneralUsersPdf con la lista de usuarios al hacer clic en el botón', async () => {
    mockGetUsers.mockResolvedValueOnce(MOCK_USERS);

    render(<UsersManager />);

    await waitFor(() => {
      expect(screen.getAllByText('Estudiante Uno').length).toBeGreaterThanOrEqual(1);
    });

    const exportBtn = screen.getByRole('button', { name: /exportar reporte pdf/i });
    fireEvent.click(exportBtn);

    expect(mockExportGeneralUsersPdf).toHaveBeenCalledTimes(1);
    expect(mockExportGeneralUsersPdf).toHaveBeenCalledWith(MOCK_USERS);
  });
});
