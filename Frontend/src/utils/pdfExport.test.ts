import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportStudentProgressPdf, exportGeneralUsersPdf } from './pdfExport';
import type { AdminUserProgress } from '../api/admin.api';
import type { User } from '../types';

// Mockeamos jspdf y jspdf-autotable para aislar la prueba unitaria
const mockSave = vi.fn();
const mockText = vi.fn();
const mockLine = vi.fn();
const mockRect = vi.fn();
const mockRoundedRect = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetFillColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetLineWidth = vi.fn();
const mockSetPage = vi.fn();

const mockDoc = {
  internal: {
    pageSize: {
      getWidth: vi.fn(() => 210),
      getHeight: vi.fn(() => 297),
    },
    getNumberOfPages: vi.fn(() => 1),
  },
  save: mockSave,
  text: mockText,
  line: mockLine,
  rect: mockRect,
  roundedRect: mockRoundedRect,
  setFont: mockSetFont,
  setFontSize: mockSetFontSize,
  setTextColor: mockSetTextColor,
  setFillColor: mockSetFillColor,
  setDrawColor: mockSetDrawColor,
  setLineWidth: mockSetLineWidth,
  setPage: mockSetPage,
};

const mockAutoTable = vi.fn();

vi.mock('jspdf', () => ({
  default: vi.fn(function () {
    return mockDoc;
  }),
}));

vi.mock('jspdf-autotable', () => ({
  default: mockAutoTable,
}));

describe('pdfExport utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exportStudentProgressPdf genera el reporte individual y llama a save con el nombre adecuado', async () => {
    const data: AdminUserProgress = {
      user: {
        id: '1',
        name: 'Ana Belen',
        email: 'ana.belen@epn.edu.ec',
        uniqueId: '202310555',
        career: 'Computacion',
        semester: 3,
        roles: ['STUDENT'],
        isActive: true,
      },
      progress: {
        points: 450,
        level: 2,
        streak: 3,
        modulesCompleted: 2,
        modulesPassed: 2,
        averageScore: 90,
        routesEnrolled: 1,
        averageProgress: 100,
        routes: [
          {
            id: '10',
            title: 'Algoritmos I',
            category: 'Basica',
            progress: 100,
            enrolledAt: '2026-01-01',
          },
        ],
      },
    };

    await exportStudentProgressPdf(data);

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith('reporte_progreso_202310555.pdf');
    expect(mockAutoTable).toHaveBeenCalledTimes(1);
  });

  it('exportGeneralUsersPdf genera el reporte general consolidado y llama a save', async () => {
    const users: User[] = [
      {
        id: '1',
        name: 'Ana Belen',
        email: 'ana.belen@epn.edu.ec',
        roles: ['STUDENT'],
        uniqueId: '202310555',
        isActive: true,
      },
      {
        id: '2',
        name: 'Carlos Perez',
        email: 'carlos.perez@epn.edu.ec',
        roles: ['ADMIN'],
        uniqueId: '202010111',
        isActive: true,
      },
    ];

    await exportGeneralUsersPdf(users);

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave.mock.calls[0][0]).toMatch(/^reporte_general_usuarios_\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(mockAutoTable).toHaveBeenCalledTimes(1);
  });
});
