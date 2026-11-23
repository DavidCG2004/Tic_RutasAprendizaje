import { Icon, type IconName } from '@/components/ui';
import type { Resource } from '../../../../types';

interface ResourceTypeConfig {
  badge: string;
  icon: IconName;
  label: string;
}

const getResourceIcon = (type?: string): ResourceTypeConfig => {
  switch (type?.toUpperCase()) {
    case 'PDF':
      return {
        badge: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 border-brand-200 dark:border-brand-500/20',
        icon: 'fileText',
        label: 'Documento PDF'
      };
    case 'VIDEO':
      return {
        badge: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 border-brand-200 dark:border-brand-500/20',
        icon: 'circlePlay',
        label: 'Video tutorial'
      };
    case 'LINK':
      return {
        badge: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 border-surface-200 dark:border-surface-700',
        icon: 'externalLink',
        label: 'Enlace web'
      };
    case 'IMAGE':
      return {
        badge: 'bg-transparent text-surface-700 border-surface-400 dark:text-surface-300 dark:border-surface-600',
        icon: 'image',
        label: 'Infografía'
      };
    default:
      return {
        badge: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 border-surface-200 dark:border-surface-700',
        icon: 'bookMarked',
        label: 'Recurso'
      };
  }
};

const sanitizeUrl = (url: string) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return '#';
};

export interface ResourceCardProps {
  resource: Resource | null | undefined;
  /** Invocado al abrir un recurso válido. Recibe el id del recurso. */
  onOpen?: (resourceId: string) => void;
  /** Marca visual de recurso ya abierto. */
  isOpened?: boolean;
}

const ResourceCard = ({ resource: res, onOpen, isOpened }: ResourceCardProps) => {
  if (!res) return null;

  const typeConfig = getResourceIcon(res.type);
  const isValidUrl = sanitizeUrl(res.url) !== '#';

  const handleClick = () => {
    if (isValidUrl && onOpen) {
      onOpen(res.id);
    }
  };

  return (
    <a
      href={sanitizeUrl(res.url)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={isOpened ? `Abrir el recurso: ${res.title} (ya abierto)` : `Abrir el recurso: ${res.title}`}
      className="flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-surface-900/60 rounded-xl border border-surface-200/80 dark:border-surface-800 hover:border-brand-500/50 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 transition-all group shadow-2xs hover:shadow-sm"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${typeConfig.badge}`}>
          <Icon name={typeConfig.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h5 className="font-semibold text-sm text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
            {res.title}
          </h5>
          <span className="text-[11px] font-medium text-surface-500 dark:text-surface-400">
            {typeConfig.label}
          </span>
        </div>
      </div>
      <div className="shrink-0 ml-3 flex items-center gap-1.5">
        {isOpened ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 border border-brand-200/80 dark:border-brand-500/25 px-2 py-0.5 rounded-full">
            <Icon name="check" className="w-3.5 h-3.5" />
            Abierto
          </span>
        ) : (
          <div className="p-1.5 rounded-lg text-surface-400 group-hover:text-brand-600 group-hover:bg-brand-100/50 dark:group-hover:bg-brand-900/30 transition-colors">
            <Icon name="externalLink" className="w-4 h-4" />
          </div>
        )}
      </div>
    </a>
  );
};

export default ResourceCard;
