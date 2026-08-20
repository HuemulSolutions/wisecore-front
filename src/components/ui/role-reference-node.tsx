'use client';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement, useFocused, useSelected } from 'platejs/react';
import { Shield, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useResolvedRoleReference } from '@/contexts/role-refs-context';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import type { RoleReferenceElement as RoleReferenceElementType } from '@/types/reference';

function tintFromColor(color?: string | null): string | undefined {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  return `${color}1A`;
}

export function RoleReferenceNode(props: PlateElementProps<RoleReferenceElementType>) {
  const { element, editor } = props;
  const selected = useSelected();
  const focused = useFocused();
  const { t } = useTranslation('editor');
  const resolved = useResolvedRoleReference(element);

  const handleRemove = () => {
    const path = editor.api.findPath(element);
    if (path) editor.tf.removeNodes({ at: path });
  };

  return (
    <PlateElement
      {...props}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 align-baseline font-medium text-sm',
        resolved.isMissing && 'opacity-50 line-through decoration-1',
        selected && focused && 'ring-2 ring-ring'
      )}
      style={{ backgroundColor: tintFromColor(resolved.color), color: resolved.color || undefined }}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        draggable: true,
      }}
    >
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: resolved.color || 'currentColor' }} />
            <span className="truncate">{resolved.name}</span>
          </span>
        </HoverCardTrigger>

        <HoverCardContent className="w-72">
          {resolved.isMissing ? (
            <p className="text-sm text-muted-foreground">{t('mention.missingRole')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="truncate text-sm font-medium">{resolved.name}</p>
              </div>
              {resolved.description && <p className="text-xs text-muted-foreground">{resolved.description}</p>}
              {resolved.parentName && (
                <p className="text-xs text-muted-foreground">{t('mention.dependsOn', { role: resolved.parentName })}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {resolved.usersCount != null && t('mention.peopleCount', { count: resolved.usersCount })}
                {resolved.usersCount != null && resolved.permissionCount != null && ' · '}
                {resolved.permissionCount != null && t('mention.permissionCount', { count: resolved.permissionCount })}
              </p>

              <div className="flex items-center gap-1 pt-1">
                <HuemulButton
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemove}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  {t('mention.hoverCard.remove')}
                </HuemulButton>
              </div>
            </div>
          )}
        </HoverCardContent>
      </HoverCard>

      {props.children}
    </PlateElement>
  );
}
