import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResourceCard from './ResourceCard';
import type { Resource } from '../../../../types';

const mockResource: Resource = {
  id: 'res-1',
  title: 'Guía de React',
  type: 'PDF',
  url: 'https://example.com/guide.pdf',
};

describe('ResourceCard', () => {
  it('llama a onOpen con su id al hacer clic en un recurso válido', () => {
    const onOpen = vi.fn();
    render(<ResourceCard resource={mockResource} onOpen={onOpen} />);

    const link = screen.getByRole('link', { name: /Abrir el recurso: Guía de React/i });
    fireEvent.click(link);

    expect(onOpen).toHaveBeenCalledWith('res-1');
  });

  it('NO llama a onOpen si la URL es inválida ("#")', () => {
    const onOpen = vi.fn();
    const brokenResource: Resource = {
      ...mockResource,
      url: 'javascript:alert(1)', // sanitizeUrl lo convertirá a '#'
    };
    render(<ResourceCard resource={brokenResource} onOpen={onOpen} />);

    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('muestra la marca "Abierto" y actualiza aria-label cuando isOpened es true', () => {
    render(<ResourceCard resource={mockResource} isOpened={true} />);

    expect(screen.getByText('Abierto')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Abrir el recurso: Guía de React (ya abierto)' })
    ).toBeInTheDocument();
  });

  it('no falla si onOpen no se pasa (compatibilidad hacia atrás)', () => {
    render(<ResourceCard resource={mockResource} />);
    const link = screen.getByRole('link');
    expect(() => fireEvent.click(link)).not.toThrow();
  });
});
