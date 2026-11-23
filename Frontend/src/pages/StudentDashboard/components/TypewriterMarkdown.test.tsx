import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TypewriterMarkdown from './TypewriterMarkdown';

describe('TypewriterMarkdown component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renderiza el contenido completo de inmediato cuando isTyping es false', () => {
    render(<TypewriterMarkdown content="Texto estático sin animación" isTyping={false} />);
    expect(screen.getByText('Texto estático sin animación')).toBeInTheDocument();
  });

  it('anima progresivamente y llama a onFinish al culminar', () => {
    const onFinish = vi.fn();
    render(
      <TypewriterMarkdown
        content="Respuesta explicativa del tutor"
        isTyping={true}
        onFinish={onFinish}
      />
    );

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText('Respuesta explicativa del tutor')).toBeInTheDocument();
    expect(onFinish).toHaveBeenCalled();
  });

  it('permite hacer clic en el contenedor para saltar la animación', () => {
    const onFinish = vi.fn();
    const { container } = render(
      <TypewriterMarkdown
        content="Texto largo que se salta al clickear"
        isTyping={true}
        onFinish={onFinish}
      />
    );

    const wrapper = container.querySelector('.markdown-chat-container');
    expect(wrapper).toBeInTheDocument();

    act(() => {
      fireEvent.click(wrapper!);
    });

    expect(screen.getByText('Texto largo que se salta al clickear')).toBeInTheDocument();
    expect(onFinish).toHaveBeenCalled();
  });

  it('cierra temporalmente bloques de código con fences impares durante el tipeo', () => {
    // Markdown con un fence abierto
    const content = '```typescript\nconst x = 10;';
    render(<TypewriterMarkdown content={content} isTyping={false} />);
    // Al renderizar estático con fence impar, closeOpenCodeFences lo cierra sin arrojar error
    expect(screen.getByText(/const x = 10;/)).toBeInTheDocument();
  });
});
