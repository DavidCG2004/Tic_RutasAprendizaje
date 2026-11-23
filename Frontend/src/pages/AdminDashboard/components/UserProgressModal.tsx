import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  ProgressBar,
  Spinner,
} from '@/components/ui';
import {
  getUserProgress,
  deleteStudentEnrollment,
  resetStudentEnrollments,
  type AdminUserProgress,
} from '../../../api/admin.api';
import { getApiErrorMessage } from '../../../api/errors';
import { exportStudentProgressPdf } from '../../../utils/pdfExport';
import type { User } from '../../../types';

export interface UserProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const formatDate = (dateStr?: string | null, includeTime = false): string => {
  if (!dateStr) return includeTime ? 'Sin registros recientes' : 'No disponible';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
};

const UserProgressModal = ({ isOpen, onClose, user }: UserProgressModalProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminUserProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const { completedRoutes, totalRoutes } = useMemo(() => {
    if (!data) return { completedRoutes: 0, totalRoutes: 0 };
    const routes = data.progress?.routes || [];
    const completed = routes.filter((route) => (route.progress ?? 0) >= 100).length;
    const total = routes.length;
    return { completedRoutes: completed, totalRoutes: total };
  }, [data]);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUserProgress(user.id);
      setData(res);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo cargar el progreso del usuario.'));
    }
  }, [user]);

  const handleDeleteRoute = async (routeId: string) => {
    if (!user || deletingRouteId) return;
    try {
      setDeletingRouteId(routeId);
      await deleteStudentEnrollment(user.id, routeId);
      toast.success('Inscripción eliminada correctamente.');
      await fetchProgress();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'No se pudo eliminar la ruta del estudiante.'));
    } finally {
      setDeletingRouteId(null);
    }
  };

  const handleResetRoutes = async () => {
    if (!user || isResetting) return;
    try {
      setIsResetting(true);
      await resetStudentEnrollments(user.id);
      toast.success('Todas las rutas del estudiante fueron eliminadas.');
      await fetchProgress();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'No se pudieron reiniciar las rutas del estudiante.'));
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!data) return;
    try {
      setIsExporting(true);
      await exportStudentProgressPdf(data);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !user) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getUserProgress(user.id)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) setError(getApiErrorMessage(err, 'No se pudo cargar el progreso del usuario.'));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-surface-900 rounded-3xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100 dark:border-surface-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white truncate">
                Progreso del estudiante
              </h2>
              {user.uniqueId && (
                <Badge variant="brand" size="sm">
                  EPN: {user.uniqueId}
                </Badge>
              )}
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 truncate">
              {user.name} ({user.email})
              {user.career && ` • ${user.career}`}
              {user.semester && ` • ${user.semester}° Semestre`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Spinner size="lg" />
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Consultando el avance del usuario…
              </p>
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"
            >
              <Icon name="circleAlert" className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p>{error}</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    getUserProgress(user.id)
                      .then(setData)
                      .catch((err) => setError(getApiErrorMessage(err)))
                      .finally(() => setLoading(false));
                  }}
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Metadatos de registro y acceso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-surface-100 dark:bg-surface-700/60 text-surface-500 dark:text-surface-400 shrink-0">
                    <Icon name="calendar" className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-surface-400 block">
                      Fecha de registro
                    </span>
                    <span className="text-sm font-semibold text-surface-800 dark:text-surface-100 truncate block">
                      {formatDate(data.user?.createdAt || user.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-surface-100 dark:bg-surface-700/60 text-surface-500 dark:text-surface-400 shrink-0">
                    <Icon name="clock" className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-surface-400 block">
                      Último acceso
                    </span>
                    <span className="text-sm font-semibold text-surface-800 dark:text-surface-100 truncate block">
                      {formatDate(data.user?.lastLogin || data.user?.lastAccess || user.lastLogin || user.lastAccess, true)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700">
                  <span className="text-2xs font-semibold uppercase tracking-wider text-surface-400">
                    Progreso
                  </span>
                  <p className="mt-1 text-lg font-bold text-surface-900 dark:text-white">
                    {data.progress.points} <span className="text-xs font-normal text-surface-400">pts</span>
                  </p>
                  <p className="text-2xs text-brand-600 dark:text-brand-400 font-medium mt-0.5">
                    Nivel {data.progress.level}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700">
                  <span className="text-2xs font-semibold uppercase tracking-wider text-surface-400">
                    Racha
                  </span>
                  <p className="mt-1 text-lg font-bold text-surface-900 dark:text-white">
                    {data.progress.streak} <span className="text-xs font-normal text-surface-400">días</span>
                  </p>
                  <p className="text-2xs text-surface-500 mt-0.5">Constancia</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700">
                  <span className="text-2xs font-semibold uppercase tracking-wider text-surface-400">
                    Rutas
                  </span>
                  <p className="mt-1 text-lg font-bold text-surface-900 dark:text-white">
                    {completedRoutes} <span className="text-xs font-normal text-surface-400">/ {totalRoutes}</span>
                  </p>
                  <p className="text-2xs text-surface-500 mt-0.5">Completadas</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700">
                  <span className="text-2xs font-semibold uppercase tracking-wider text-surface-400">
                    Promedio
                  </span>
                  <p className="mt-1 text-lg font-bold text-surface-900 dark:text-white">
                    {data.progress.averageScore !== null ? `${data.progress.averageScore}%` : '—'}
                  </p>
                  <p className="text-2xs text-surface-500 mt-0.5">Evaluaciones</p>
                </div>
              </div>

              {/* Rutas inscritas */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                      Rutas de Aprendizaje ({data.progress.routes.length})
                    </h3>
                    {data.progress.routes.length > 0 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={handleResetRoutes}
                        isLoading={isResetting}
                        iconLeft={<Icon name="trash" className="h-3 w-3" />}
                        className="text-2xs py-0.5 px-2 h-6"
                      >
                        Eliminar todas
                      </Button>
                    )}
                  </div>
                  <span className="text-xs text-surface-400">
                    Avance promedio: {data.progress.averageProgress}%
                  </span>
                </div>

                {data.progress.routes.length === 0 ? (
                  <EmptyState
                    icon="bookOpen"
                    title="Sin rutas inscritas"
                    description="El estudiante aún no se ha inscrito en ninguna ruta de aprendizaje."
                  />
                ) : (
                  <div className="space-y-2.5">
                    {data.progress.routes.map((route) => (
                      <Card key={route.id} padding="sm" className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                              {route.title}
                            </h4>
                            {route.category && (
                              <Badge variant="default" size="sm" className="mt-1">
                                {route.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold tabular-nums text-surface-900 dark:text-white">
                              {route.progress}%
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoute(route.id)}
                              disabled={deletingRouteId === route.id}
                              className="p-1 rounded-lg text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors disabled:opacity-50"
                              aria-label={`Eliminar inscripción en ${route.title}`}
                              title="Eliminar ruta del estudiante"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <ProgressBar value={route.progress} max={100} size="sm" />
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-850">
          <div>
            {!loading && !error && data && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleExportPdf}
                isLoading={isExporting}
                iconLeft={<Icon name="download" className="h-4 w-4" />}
              >
                Descargar PDF
              </Button>
            )}
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProgressModal;
