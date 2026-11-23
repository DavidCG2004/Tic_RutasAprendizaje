import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import { Button, Icon, Input, Modal } from '@/components/ui';
import { generateRouteWithAI } from '@/api/route.api';
import { getApiErrorMessage } from '@/api/errors';
import type { LearningRoute } from '@/types';

export interface GenerateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRouteGenerated?: (route: LearningRoute) => void;
}

const DIFFICULTIES = [
  { value: 'BEGINNER', label: 'Básico / Introductorio' },
  { value: 'INTERMEDIATE', label: 'Intermedio' },
  { value: 'ADVANCED', label: 'Avanzado' },
] as const;

const GenerateRouteModal = ({
  isOpen,
  onClose,
  onRouteGenerated,
}: GenerateRouteModalProps) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<string>('INTERMEDIATE');
  const [additionalContext, setAdditionalContext] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTopic('');
    setDifficulty('INTERMEDIATE');
    setAdditionalContext('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isGenerating) return;
    resetForm();
    onClose();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.pdf', '.txt', '.md'];
    const lowerName = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isAllowed) {
      toast.error('Formato no permitido. Solo se admiten archivos PDF, TXT o MD.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande (máximo 10 MB).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      toast.error('El tema o materia de estudio es obligatorio.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateRouteWithAI({
        topic: trimmedTopic,
        difficulty,
        additionalContext: additionalContext.trim() || undefined,
        file: selectedFile || undefined,
      });

      toast.success(res.message || 'Ruta diseñada con éxito por IA.');
      onRouteGenerated?.(res.route);
      handleClose();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'No se pudo generar la ruta con IA.'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
            <Icon name="sparkles" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-surface-900 dark:text-white">
              Generador de Rutas con IA (Administrador)
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Diseña una propuesta estructurada de ruta formativa a partir de material didáctico.
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Input
            id="ai-topic"
            label="Tema o materia a estructurar"
            placeholder="Ej. Arquitectura Hexagonal y Microservicios en Go"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            disabled={isGenerating}
            hint="Describe con claridad el área que deseas estructurar en la ruta."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="ai-difficulty"
              className="block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300"
            >
              Nivel de dificultad
            </label>
            <select
              id="ai-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={isGenerating}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 transition-all focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800/60 dark:text-white"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="ai-file-input"
              className="block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300"
            >
              Material pedagógico (opcional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileChange}
              disabled={isGenerating}
              className="hidden"
              id="ai-file-input"
            />
            {selectedFile ? (
              <div className="flex items-center justify-between rounded-xl border border-surface-300 bg-surface-100 px-3 py-2 text-xs dark:border-surface-700 dark:bg-surface-800">
                <div className="flex items-center gap-2 truncate">
                  <Icon name="fileText" className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                  <span className="truncate font-medium text-surface-800 dark:text-surface-200">
                    {selectedFile.name}
                  </span>
                  <span className="text-2xs text-surface-400">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={isGenerating}
                  className="ml-2 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                  aria-label="Quitar archivo"
                >
                  <Icon name="x" className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-surface-300 bg-surface-50 py-2.5 text-xs font-medium text-surface-600 transition-colors hover:border-brand-500 hover:bg-surface-100 hover:text-brand-600 dark:border-surface-700 dark:bg-surface-800/40 dark:text-surface-300 dark:hover:border-brand-400 dark:hover:bg-surface-800"
              >
                <Icon name="fileText" className="h-4 w-4" />
                <span>Adjuntar PDF, TXT o MD (máx. 10 MB)</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="ai-context"
            className="block text-xs font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300"
          >
            Contexto u objetivos curriculares (opcional)
          </label>
          <textarea
            id="ai-context"
            rows={3}
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            disabled={isGenerating}
            placeholder="Ej. Priorizar ejercicios prácticos, patrones limpios y preparación para entornos productivos."
            className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 p-3.5 text-sm text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800/60 dark:text-white"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isGenerating}
            iconLeft={!isGenerating ? <Icon name="sparkles" className="h-4 w-4" /> : undefined}
          >
            {isGenerating ? 'Diseñando ruta curricular...' : 'Generar ruta con IA'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GenerateRouteModal;
