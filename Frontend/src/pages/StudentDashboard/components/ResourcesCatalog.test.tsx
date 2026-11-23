import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ResourcesCatalog, { BATCH_SIZE } from './ResourcesCatalog';
import { getResources, getResourceCatalog } from '@/api';
import type { Resource } from '@/types';

vi.mock('@/api', () => ({
  getResources: vi.fn(),
  getResourceCatalog: vi.fn(),
}));

const mockGetResources = vi.mocked(getResources);
const mockGetResourceCatalog = vi.mocked(getResourceCatalog);

const generateMockResources = (count: number): Resource[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `res-${idx + 1}`,
    title: `Recurso de Estudio ${idx + 1}`,
    description: `Descripción detallada del material ${idx + 1}`,
    type: idx % 2 === 0 ? 'PDF' : 'VIDEO',
    url: `https://example.com/res-${idx + 1}`,
    subject: 'Estructuras de Datos',
  }));

describe('ResourcesCatalog — Carga progresiva y filtrado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BATCH_SIZE está calibrado en 12 elementos por lote', () => {
    expect(BATCH_SIZE).toBe(12);
  });

  it('despliega inicialmente 12 tarjetas y el botón "Cargar más recursos" con 25 ítems', async () => {
    const mockData = generateMockResources(25);
    mockGetResources.mockResolvedValue(mockData);

    render(<ResourcesCatalog />);

    // Esperar a que desaparezca el estado de carga y se muestre la cabecera
    await waitFor(() => {
      expect(screen.getByText('25 recursos disponibles')).toBeInTheDocument();
    });

    // Deben verse exactamente 12 enlaces "Abrir"
    const openButtons = screen.getAllByRole('link', { name: /Abrir/i });
    expect(openButtons).toHaveLength(12);

    // Debe mostrarse el texto de paginación
    expect(screen.getByText('Mostrando 12 de 25 recursos disponibles')).toBeInTheDocument();

    // Debe existir el botón "Cargar más recursos"
    const loadMoreBtn = screen.getByRole('button', { name: /Cargar más recursos/i });
    expect(loadMoreBtn).toBeInTheDocument();
  });

  it('al presionar "Cargar más recursos" expande a 24 tarjetas y luego a 25', async () => {
    const mockData = generateMockResources(25);
    mockGetResources.mockResolvedValue(mockData);

    render(<ResourcesCatalog />);

    await waitFor(() => {
      expect(screen.getByText('Mostrando 12 de 25 recursos disponibles')).toBeInTheDocument();
    });

    const loadMoreBtn = screen.getByRole('button', { name: /Cargar más recursos/i });
    fireEvent.click(loadMoreBtn);

    // Ahora deben verse 24 tarjetas
    expect(screen.getAllByRole('link', { name: /Abrir/i })).toHaveLength(24);
    expect(screen.getByText('Mostrando 24 de 25 recursos disponibles')).toBeInTheDocument();

    // Segundo click: se cargan los restantes (25 en total)
    fireEvent.click(screen.getByRole('button', { name: /Cargar más recursos/i }));
    expect(screen.getAllByRole('link', { name: /Abrir/i })).toHaveLength(25);

    // Al llegar al total de 25/25, el botón desaparece
    expect(screen.queryByRole('button', { name: /Cargar más recursos/i })).not.toBeInTheDocument();
  });

  it('reinicia la paginación a 12 ítems cuando se aplica un término de búsqueda', async () => {
    const mockData = generateMockResources(30);
    mockGetResources.mockResolvedValue(mockData);

    render(<ResourcesCatalog />);

    await waitFor(() => {
      expect(screen.getByText('Mostrando 12 de 30 recursos disponibles')).toBeInTheDocument();
    });

    // Expandir a 24
    fireEvent.click(screen.getByRole('button', { name: /Cargar más recursos/i }));
    expect(screen.getAllByRole('link', { name: /Abrir/i })).toHaveLength(24);

    // Buscar "Recurso de Estudio"
    const searchInput = screen.getByLabelText(/Buscar en el catálogo/i);
    fireEvent.change(searchInput, { target: { value: 'Recurso de Estudio 1' } });

    // Filtrados: 1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 (11 ítems)
    await waitFor(() => {
      expect(screen.getByText('11 recursos disponibles')).toBeInTheDocument();
    });

    // Con 11 ítems, no hay botón de cargar más porque caben en el lote de 12
    expect(screen.queryByRole('button', { name: /Cargar más recursos/i })).not.toBeInTheDocument();
  });

  it('permite filtrar por tipo de recurso', async () => {
    const mockData = generateMockResources(20); // 10 PDF (pares) y 10 VIDEO (impares)
    mockGetResources.mockResolvedValue(mockData);

    render(<ResourcesCatalog />);

    await waitFor(() => {
      expect(screen.getByText('20 recursos disponibles')).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Filtrar por tipo/i);
    fireEvent.change(select, { target: { value: 'PDF' } });

    await waitFor(() => {
      expect(screen.getByText('10 recursos disponibles')).toBeInTheDocument();
    });
    expect(screen.getAllByRole('link', { name: /Abrir/i })).toHaveLength(10);
  });

  it('muestra estado de error y botón de reintentar si la llamada falla', async () => {
    mockGetResources.mockRejectedValue(new Error('Fallo de conexión'));
    mockGetResourceCatalog.mockRejectedValue(new Error('Fallo de conexión'));

    render(<ResourcesCatalog />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Fallo de conexión')).toBeInTheDocument();

    // Reintentar exitosamente
    mockGetResources.mockResolvedValue(generateMockResources(5));
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    await waitFor(() => {
      expect(screen.getByText('5 recursos disponibles')).toBeInTheDocument();
    });
  });

  it('usa getResourceCatalog como fallback si getResources falla', async () => {
    mockGetResources.mockRejectedValue(new Error('Fallo getResources'));
    mockGetResourceCatalog.mockResolvedValue({
      resources: [
        {
          id: 'res-cat-1',
          title: 'Recurso desde catálogo fallback',
          description: 'Descripción fallback',
          type: 'LINK',
          url: 'https://example.com/fallback',
        },
      ],
      total: 1,
    });

    render(<ResourcesCatalog />);

    await waitFor(() => {
      expect(screen.getByText('1 recurso disponible')).toBeInTheDocument();
    });
    expect(screen.getByText('Recurso desde catálogo fallback')).toBeInTheDocument();
  });
});
