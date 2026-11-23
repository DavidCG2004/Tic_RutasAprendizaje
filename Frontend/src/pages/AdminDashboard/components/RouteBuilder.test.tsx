import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { toast } from 'react-toastify';
import { getResources } from '../../../api/resource.api';
import { updateRoute } from '../../../api/route.api';
import { uploadCoverImage } from '../../../api/upload.api';
import RouteBuilder from './RouteBuilder';
import type { LearningRoute } from '../../../types';

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('../../../api/resource.api', () => ({ getResources: vi.fn() }));
vi.mock('../../../api/route.api', () => ({ createRoute: vi.fn(), updateRoute: vi.fn() }));
vi.mock('../../../api/upload.api', () => ({ uploadCoverImage: vi.fn() }));

const mockGetResources = vi.mocked(getResources);
const mockUpdateRoute = vi.mocked(updateRoute);
const mockUploadCoverImage = vi.mocked(uploadCoverImage);
const mockToastError = vi.mocked(toast.error);

/** jsdom no implementa la API de blobs: se sustituye por un stub estable. */
beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: vi.fn(() => 'blob:mock-portada'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn(),
  });
});

/** Crea un archivo con el tamaño forzado (evita reservar 5 MB en memoria). */
const archivo = (nombre: string, tipo: string, size = 1024) => {
  const file = new File(['contenido'], nombre, { type: tipo });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const renderBuilder = () => {
  const utils = render(
    <RouteBuilder initialData={null} onCancel={vi.fn()} onSaveSuccess={vi.fn()} />
  );
  const input = utils.container.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  return { ...utils, input };
};

describe('RouteBuilder — validación del archivo de portada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetResources.mockResolvedValue([]);
  });

  /**
   * Regresión: el input solo llevaba `accept="image/*"`, que únicamente orienta
   * al explorador de archivos. El usuario todavía podía elegir "Todos los
   * archivos" y subir un PDF al endpoint de portada.
   */
  it('rechaza un archivo que no es una imagen', async () => {
    const { input } = renderBuilder();
    await waitFor(() => expect(mockGetResources).toHaveBeenCalled());

    fireEvent.change(input, {
      target: { files: [archivo('guia.pdf', 'application/pdf')] },
    });

    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('imagen'));
    expect(screen.queryByAltText('Portada')).toBeNull();
    expect(mockUploadCoverImage).not.toHaveBeenCalled();
  });

  it('rechaza un PDF aunque el navegador no informe el tipo MIME', async () => {
    const { input } = renderBuilder();
    await waitFor(() => expect(mockGetResources).toHaveBeenCalled());

    fireEvent.change(input, {
      target: { files: [archivo('guia.pdf', '')] },
    });

    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('imagen'));
    expect(mockUploadCoverImage).not.toHaveBeenCalled();
  });

  it('rechaza una imagen que supera los 5 MB', async () => {
    const { input } = renderBuilder();
    await waitFor(() => expect(mockGetResources).toHaveBeenCalled());

    fireEvent.change(input, {
      target: { files: [archivo('portada.png', 'image/png', 6 * 1024 * 1024)] },
    });

    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('5 MB'));
    expect(screen.queryByAltText('Portada')).toBeNull();
    expect(mockUploadCoverImage).not.toHaveBeenCalled();
  });

  it('acepta una imagen válida y muestra la vista previa', async () => {
    const { input } = renderBuilder();
    await waitFor(() => expect(mockGetResources).toHaveBeenCalled());

    fireEvent.change(input, {
      target: { files: [archivo('portada.png', 'image/png')] },
    });

    expect(mockToastError).not.toHaveBeenCalled();
    expect(screen.getByAltText('Portada')).toBeTruthy();
  });
});

describe('RouteBuilder — Categorías de Software y Submódulos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetResources.mockResolvedValue([]);
  });

  it('ofrece las 7 categorías progresivas de Ingeniería de Software', async () => {
    renderBuilder();
    await waitFor(() => expect(mockGetResources).toHaveBeenCalled());

    expect(screen.getByText('Fundamentos y Lógica de Programación')).toBeTruthy();
    expect(screen.getByText('Estructuras de Datos y POO')).toBeTruthy();
    expect(screen.getByText('Desarrollo Web Frontend')).toBeTruthy();
    expect(screen.getByText('Desarrollo Backend y APIs')).toBeTruthy();
    expect(screen.getByText('Bases de Datos y Persistencia')).toBeTruthy();
    expect(screen.getByText('Arquitectura y Calidad de Software')).toBeTruthy();
    expect(screen.getByText('DevOps, Infraestructura y Redes')).toBeTruthy();
  });

  it('permite reordenar módulos hacia arriba y hacia abajo y persiste el nuevo orden al guardar', async () => {
    const sampleRoute: LearningRoute = {
      id: 'route-100',
      title: 'Ruta de Arquitectura',
      description: 'Descripción detallada de arquitectura limpia',
      category: 'Desarrollo Backend y APIs',
      difficulty: 'INTERMEDIATE',
      estimatedTime: 120,
      modules: [
        { id: 'm-1', title: 'Módulo Alfa', description: 'Desc Alfa', position: 1, resources: [] },
        { id: 'm-2', title: 'Módulo Beta', description: 'Desc Beta', position: 2, resources: [] },
        { id: 'm-3', title: 'Módulo Gamma', description: 'Desc Gamma', position: 3, resources: [] },
      ],
    };

    mockUpdateRoute.mockResolvedValue({ message: 'Ruta actualizada', route: sampleRoute });

    render(
      <RouteBuilder
        initialData={sampleRoute}
        onCancel={vi.fn()}
        onSaveSuccess={vi.fn()}
      />
    );

    await waitFor(() => expect(mockGetResources).toHaveBeenCalled());

    // Verificar botones de subir y bajar
    const upButtons = screen.getAllByTitle('Mover hacia arriba');
    const downButtons = screen.getAllByTitle('Mover hacia abajo');

    expect(upButtons).toHaveLength(3);
    expect(downButtons).toHaveLength(3);

    // El primer módulo no puede subir
    expect(upButtons[0]).toBeDisabled();
    // El último módulo no puede bajar
    expect(downButtons[2]).toBeDisabled();

    // Mover Módulo Beta (index 1) hacia arriba
    fireEvent.click(upButtons[1]);

    // Ahora los inputs de títulos deben reflejar el nuevo orden: Beta (0), Alfa (1), Gamma (2)
    const titleInputs = screen.getAllByPlaceholderText(/Nombre del Curso/i) as HTMLInputElement[];
    expect(titleInputs[0].value).toBe('Módulo Beta');
    expect(titleInputs[1].value).toBe('Módulo Alfa');
    expect(titleInputs[2].value).toBe('Módulo Gamma');

    // Guardar cambios
    const saveButton = screen.getByRole('button', { name: 'Guardar Cambios' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateRoute).toHaveBeenCalledWith(
        'route-100',
        expect.objectContaining({
          modules: [
            expect.objectContaining({ title: 'Módulo Beta' }),
            expect.objectContaining({ title: 'Módulo Alfa' }),
            expect.objectContaining({ title: 'Módulo Gamma' }),
          ],
        })
      );
    });
  });
});

