import type { ReactNode } from 'react'

export interface HuemulSectionCardProps {
  /**
   * Título de la sección. **Sin `title` la card es solo el shell blanco**, sin
   * header ni padding propio — el contenido se renderiza directo adentro y el
   * padding lo pone el consumidor por `className` (`p-4`, `p-3`, `divide-y`…).
   */
  title?: string;
  subtitle?: string;
  /** Bloque a la derecha del header (badges, botones). */
  headerRight?: ReactNode;
  /** Pie con borde superior y fondo tenue: avisos, hints. */
  footer?: ReactNode;
  /**
   * Colapsable **controlado**. Sin `open` la card es estática (el header, si
   * hay título, no es clickeable ni muestra chevron).
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Clase del body. Solo aplica cuando hay header. */
  bodyClassName?: string;
  /** Clase del shell exterior. */
  className?: string;
  children: ReactNode;
}
