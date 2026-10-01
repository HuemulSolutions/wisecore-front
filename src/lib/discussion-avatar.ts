/** Colores pastel del avatar de un autor: determinísticos por `userId`. */
const AVATAR_TONES = [
  'bg-[#dbeafe] text-[#1d4ed8]',
  'bg-[#dcfce7] text-[#15803d]',
  'bg-[#fef3c7] text-[#b45309]',
  'bg-[#e0e7ff] text-[#4338ca]',
] as const;

/** Violeta reservado a los hilos creados por IA. */
const AI_AVATAR_TONE = 'bg-[#ede9fe] text-[#6d28d9]';

export function avatarToneClass(userId: string | undefined, isAi = false): string {
  if (isAi) return AI_AVATAR_TONE;
  if (!userId) return AVATAR_TONES[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/** Hasta dos iniciales ("Ana Pérez" → "AP"). */
export function nameInitials(name: string | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}
