import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import GenerateRouteModal from './GenerateRouteModal';
import { generateRouteWithAI } from '@/api/route.api';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/api/route.api', () => ({
  generateRouteWithAI: vi.fn(),
}));

const mockGenerate = vi.mocked(generateRouteWithAI);

describe('GenerateRouteModal (Admin)', () => {
  const onClose = vi.fn();
  const onRouteGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza contenido cuando isOpen es false', () => {
    render(
      <GenerateRouteModal
        isOpen={false}
        onClose={onClose}
        onRouteGenerated={onRouteGenerated}
      />
    );
    expect(screen.queryByText(/Generador de Rutas con IA \(Administrador\)/i)).toBeNull();
  });

  it('renderiza el modal y sus campos cuando isOpen es true', () => {
    render(
      <GenerateRouteModal
        isOpen={true}
        onClose={onClose}
        onRouteGenerated={onRouteGenerated}
      />
    );
    expect(screen.getByText(/Generador de Rutas con IA \(Administrador\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tema o materia a estructurar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nivel de dificultad/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generar ruta con IA/i })).toBeInTheDocument();
  });

  it('muestra error cuando el tema está vacío al enviar', async () => {
    render(
      <GenerateRouteModal
        isOpen={true}
        onClose={onClose}
        onRouteGenerated={onRouteGenerated}
      />
    );

    const form = screen.getByRole('button', { name: /Generar ruta con IA/i }).closest('form')!;
    fireEvent.submit(form);

    expect(toast.error).toHaveBeenCalledWith('El tema o materia de estudio es obligatorio.');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('envía los datos correctamente y llama a onRouteGenerated en caso de éxito', async () => {
    const fakeRoute = { id: 'route-ai-1', title: 'Go Microservicios', modules: [] } as any;
    mockGenerate.mockResolvedValueOnce({
      message: 'Ruta creada exitosamente',
      route: fakeRoute,
    });

    render(
      <GenerateRouteModal
        isOpen={true}
        onClose={onClose}
        onRouteGenerated={onRouteGenerated}
      />
    );

    const topicInput = screen.getByLabelText(/Tema o materia a estructurar/i);
    fireEvent.change(topicInput, { target: { value: 'Microservicios con Go' } });

    const submitBtn = screen.getByRole('button', { name: /Generar ruta con IA/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalledWith({
        topic: 'Microservicios con Go',
        difficulty: 'INTERMEDIATE',
        additionalContext: undefined,
        file: undefined,
      });
      expect(onRouteGenerated).toHaveBeenCalledWith(fakeRoute);
      expect(onClose).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Ruta creada exitosamente');
    });
  });

  it('maneja errores de la API adecuadamente', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('Fallo al conectar con Gemini'));

    render(
      <GenerateRouteModal
        isOpen={true}
        onClose={onClose}
        onRouteGenerated={onRouteGenerated}
      />
    );

    const topicInput = screen.getByLabelText(/Tema o materia a estructurar/i);
    fireEvent.change(topicInput, { target: { value: 'Inteligencia Artificial' } });

    const submitBtn = screen.getByRole('button', { name: /Generar ruta con IA/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Fallo al conectar con Gemini');
      expect(onRouteGenerated).not.toHaveBeenCalled();
    });
  });
});
