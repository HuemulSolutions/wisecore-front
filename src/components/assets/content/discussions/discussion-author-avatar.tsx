import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { avatarToneClass, nameInitials } from '@/lib/discussion-avatar';
import { cn } from '@/lib/utils';
import type { TDiscussionUser } from '@/components/plate-editor/components/discussion-kit';

export interface DiscussionAuthorAvatarProps {
  user: TDiscussionUser | undefined;
  userId?: string;
  /** Violeta de IA en lugar del color pastel por persona. */
  isAi?: boolean;
  /** Lado en px (26 primer comentario, 22 respuestas, 20 popover). */
  size?: number;
  className?: string;
}

/** Avatar circular con iniciales y color pastel determinístico por autor. */
export function DiscussionAuthorAvatar({
  user,
  userId,
  isAi = false,
  size = 26,
  className,
}: DiscussionAuthorAvatarProps) {
  return (
    <Avatar className={cn('shrink-0', className)} style={{ width: size, height: size }}>
      <AvatarImage alt={user?.name} src={user?.avatarUrl || undefined} />
      <AvatarFallback
        className={cn('font-semibold', avatarToneClass(userId ?? user?.id, isAi))}
        style={{ fontSize: Math.max(9, Math.round(size * 0.38)) }}
      >
        {nameInitials(user?.name)}
      </AvatarFallback>
    </Avatar>
  );
}
