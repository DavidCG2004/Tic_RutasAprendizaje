import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseTypewriterOptions {
  /** Habilita o deshabilita la animación (ej. para mensajes históricos es false). */
  enabled?: boolean;
  /** Intervalo en milisegundos entre cada tick de tipeo (default: 18ms). */
  speedMs?: number;
  /** Duración máxima de la animación en milisegundos para textos largos (default: 2200ms). */
  maxDurationMs?: number;
  /** Callback ejecutado al finalizar la animación o al hacer skip. */
  onComplete?: () => void;
  /** Callback ejecutado en cada avance de caracteres (útil para auto-scroll). */
  onTick?: () => void;
}

export interface UseTypewriterResult {
  /** Texto acumulado visible hasta el momento. */
  displayedText: string;
  /** Indica si la animación ya terminó. */
  isComplete: boolean;
  /** Salta inmediatamente la animación y muestra el texto completo. */
  skip: () => void;
}

export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterResult {
  const {
    enabled = true,
    speedMs = 18,
    maxDurationMs = 2200,
    onComplete,
    onTick,
  } = options;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  // Comprobar preferencia de accesibilidad (prefers-reduced-motion)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const shouldAnimate = enabled && !prefersReducedMotion && text.length > 0;

  const [displayedIndex, setDisplayedIndex] = useState(() =>
    shouldAnimate ? 0 : text.length
  );

  const isComplete = displayedIndex >= text.length;

  const skip = useCallback(() => {
    setDisplayedIndex(text.length);
    onCompleteRef.current?.();
  }, [text.length]);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedIndex(text.length);
      return;
    }

    setDisplayedIndex(0);

    const totalChars = text.length;
    const maxTicks = Math.max(1, Math.floor(maxDurationMs / speedMs));
    // Calculamos el incremento por tick para que nunca exceda maxDurationMs
    const stepSize = Math.max(1, Math.ceil(totalChars / maxTicks));

    let currentIndex = 0;

    const intervalId = window.setInterval(() => {
      currentIndex = Math.min(totalChars, currentIndex + stepSize);
      setDisplayedIndex(currentIndex);
      onTickRef.current?.();

      if (currentIndex >= totalChars) {
        window.clearInterval(intervalId);
        onCompleteRef.current?.();
      }
    }, speedMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [text, shouldAnimate, speedMs, maxDurationMs]);

  const displayedText = shouldAnimate ? text.slice(0, displayedIndex) : text;

  return {
    displayedText,
    isComplete: !shouldAnimate || isComplete,
    skip,
  };
}
