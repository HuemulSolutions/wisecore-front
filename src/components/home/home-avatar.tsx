import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export interface HomeAvatarProps {
  name: string;
  className?: string;
}

/**
 * Avatar de iniciales compartido dentro del módulo Home (tabla de "Todos los
 * activos" + filas de grupo de "Mi trabajo") — evita repetir el mismo
 * `getInitials` + span que ya existía inline en el `home.tsx` original.
 */
export function HomeAvatar({ name, className }: HomeAvatarProps) {
  return (
    <span
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
