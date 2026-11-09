import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Icon,
  PageHeader,
  Skeleton,
  type BadgeVariant,
  type IconName,
} from '@/components/ui';
import { getUsers } from '../../../api/admin.api';
import { getApiErrorMessage } from '../../../api/errors';

interface RoleInfo {
  description: string;
  tone: BadgeVariant;
  icon: IconName;
}

/**
 * Incluye MODERATOR a propósito: es una tarjeta informativa del panel, aunque
 * ningún endpoint del backend reconoce ese rol, así que su contador siempre
 * sale en 0.
 */
const ROLE_INFO: Record<string, RoleInfo> = {
  ADMIN: {
    description: 'Acceso total al sistema',
    tone: 'brand',
    icon: 'shield',
  },
  STUDENT: {
    description: 'Acceso a rutas y editor de código',
    tone: 'primary',
    icon: 'graduationCap',
  },
  MODERATOR: {
    description: 'Puede gestionar rutas pero no usuarios',
    tone: 'accent',
    icon: 'keyRound',
  },
};

interface RoleSummary {
  id: string;
  name: string;
  description: string;
  tone: BadgeVariant;
  icon: IconName;
  users: number;
}

const RoleManager = () => {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchRoles = async () => {
      setLoading(true);
      setError(null);

      try {
        const users = await getUsers();

        const roleCounts: Record<string, number> = {};
        users.forEach((user) => {
          user.roles?.forEach((role) => {
            roleCounts[role] = (roleCounts[role] ?? 0) + 1;
          });
        });

        if (cancelled) return;

        setRoles(
          Object.entries(ROLE_INFO).map(([name, info]) => ({
            id: name,
            name,
            description: info.description,
            tone: info.tone,
            icon: info.icon,
            users: roleCounts[name] ?? 0,
          }))
        );
      } catch (caught: unknown) {
        if (!cancelled) {
          setError(getApiErrorMessage(caught, 'No se pudieron cargar los roles.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRoles();

    return () => {
      cancelled = true;
    };
    // `reloadKey` solo dispara el reintento manual.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [reloadKey]);

  const totalUsers = roles.reduce((acc, role) => acc + role.users, 0);

  return (
    <div className="animate-in fade-in mx-auto max-w-5xl space-y-6 pb-12 duration-300 sm:space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Roles del sistema"
        description="Distribución de usuarios por rol en la plataforma."
        actions={
          !loading && !error ? (
            <Badge variant="default" size="md">
              {totalUsers} {totalUsers === 1 ? 'asignación' : 'asignaciones'}
            </Badge>
          ) : undefined
        }
      />

      {error ? (
        <Card padding="md" role="alert" className="space-y-3 border-red-200/70 dark:border-red-500/20">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Icon name="circleAlert" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-surface-900 dark:text-white">
                No pudimos cargar los roles
              </p>
              <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">{error}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setReloadKey((key) => key + 1)}
            iconLeft={<Icon name="refreshCw" className="h-3.5 w-3.5" />}
          >
            Reintentar
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {loading
            ? [0, 1, 2].map((index) => (
                <Card key={index} padding="md" className="space-y-3">
                  <Skeleton variant="rect" className="h-11 w-11" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="w-3/4" />
                  <Skeleton className="h-8 w-full" />
                </Card>
              ))
            : roles.map((role) => (
                <Card key={role.id} padding="md" className="group flex flex-col">
                  <span
                    className={
                      role.tone === 'brand'
                        ? 'flex h-11 w-11 items-center justify-center rounded-control bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300'
                        : role.tone === 'primary'
                          ? 'flex h-11 w-11 items-center justify-center rounded-control bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300'
                          : 'flex h-11 w-11 items-center justify-center rounded-control bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-300'
                    }
                  >
                    <Icon name={role.icon} className="h-5 w-5" />
                  </span>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-surface-900 dark:text-white">
                      {role.name}
                    </h3>
                    <Badge variant={role.tone} size="sm">
                      {role.users} {role.users === 1 ? 'usuario' : 'usuarios'}
                    </Badge>
                  </div>

                  <p className="mt-1 flex-1 text-xs leading-relaxed text-surface-500 dark:text-surface-400">
                    {role.description}
                  </p>

                  <div className="mt-4 border-t border-surface-100 pt-3 dark:border-surface-800">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                      Usuarios asignados
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold tabular-nums text-surface-900 dark:text-white">
                      {role.users}
                    </p>
                  </div>
                </Card>
              ))}
        </div>
      )}
    </div>
  );
};

export default RoleManager;
