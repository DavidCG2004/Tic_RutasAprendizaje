import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from './useTypewriter';

describe('useTypewriter hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('devuelve el texto completo de inmediato si enabled es false', () => {
    const text = 'Mensaje histórico sin animación';
    const { result } = renderHook(() =>
      useTypewriter(text, { enabled: false })
    );

    expect(result.current.displayedText).toBe(text);
    expect(result.current.isComplete).toBe(true);
  });

  it('avanza progresivamente con el tiempo cuando enabled es true', () => {
    const text = 'Hola mundo';
    const onComplete = vi.fn();
    const onTick = vi.fn();

    const { result } = renderHook(() =>
      useTypewriter(text, { enabled: true, speedMs: 20, onComplete, onTick })
    );

    expect(result.current.isComplete).toBe(false);

    // Avanzamos 20ms (un tick)
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(result.current.displayedText.length).toBeGreaterThan(0);
    expect(onTick).toHaveBeenCalled();

    // Avanzamos hasta completar todo el texto
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.displayedText).toBe(text);
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('permite hacer skip() para mostrar todo el texto inmediatamente', () => {
    const text = 'Un texto muy largo que el usuario decide no esperar';
    const onComplete = vi.fn();

    const { result } = renderHook(() =>
      useTypewriter(text, { enabled: true, speedMs: 50, onComplete })
    );

    expect(result.current.isComplete).toBe(false);

    act(() => {
      result.current.skip();
    });

    expect(result.current.displayedText).toBe(text);
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('ajusta la velocidad adaptativamente para textos muy largos', () => {
    // Texto de 1000 caracteres
    const longText = 'A'.repeat(1000);
    const onComplete = vi.fn();

    const { result } = renderHook(() =>
      useTypewriter(longText, {
        enabled: true,
        speedMs: 20,
        maxDurationMs: 1000,
        onComplete,
      })
    );

    // En 20ms (primer tick), debería haber avanzado varios caracteres (stepSize > 1)
    act(() => {
      vi.advanceTimersByTime(20);
    });

    // 1000 chars / (1000ms / 20ms = 50 ticks) = 20 chars por tick
    expect(result.current.displayedText.length).toBeGreaterThanOrEqual(15);

    // En 1100ms ya debe estar completo
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current.displayedText).toBe(longText);
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalled();
  });

  it('respeta la preferencia de reduced-motion del sistema', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const text = 'Sin animación por accesibilidad';
    const { result } = renderHook(() =>
      useTypewriter(text, { enabled: true })
    );

    expect(result.current.displayedText).toBe(text);
    expect(result.current.isComplete).toBe(true);
  });
});
