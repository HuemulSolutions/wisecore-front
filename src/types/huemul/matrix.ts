import type { ReactNode } from 'react'

/** Columna de la matriz. `groupKey` fusiona columnas CONTIGUAS en el encabezado nivel 1. */
export interface HuemulMatrixColumn<TCol> {
  key: string
  data: TCol
  groupKey: string
}

/** Grupo de columnas derivado internamente. `startIndex` es el offset dentro de `columns`. */
export interface HuemulMatrixColumnGroup<TCol> {
  groupKey: string
  columns: HuemulMatrixColumn<TCol>[]
  startIndex: number
}

/** Fila normal: primera columna sticky + una celda por columna. */
export interface HuemulMatrixCellsRow<TRow> {
  kind: "cells"
  key: string
  data: TRow
}

/**
 * Fila de banda: la primera columna lleva contenido y el resto se rellena a
 * ancho completo (`gridColumn: "2 / -1"`). Pensada para separadores, cabeceras
 * de sección colapsables y filas de acción («añadir…»).
 *
 * No combinar con `trailingColumn`: el relleno usa `-1` (última línea del grid
 * explícito), así que se metería debajo de la columna extra.
 */
export interface HuemulMatrixBandRow {
  kind: "band"
  key: string
  /** Contenido de la celda sticky. La zona focusable la aporta el consumidor. */
  content: ReactNode
  /** Clases compartidas por la celda sticky y el relleno (fondo, bordes, hover). */
  className?: string
  /** Clases extra solo de la celda sticky (padding propio, por ejemplo). */
  contentClassName?: string
  /**
   * Clic en el relleno de la banda (columna 2 en adelante). La columna sticky
   * NO lo recibe — si su contenido necesita clic, que lo maneje el propio
   * `content` (ej. un `<button>` interno), así no se dispara dos veces.
   */
  onClick?: () => void
  /** true → el wrapper expone `group/band`; usar `group-hover/band:` en `className`. */
  hoverable?: boolean
}

export type HuemulMatrixRow<TRow> = HuemulMatrixCellsRow<TRow> | HuemulMatrixBandRow

/** Columna extra al final, fuera del recuento de `columns` (ej. «añadir grupo»). */
export interface HuemulMatrixTrailingColumn<TRow> {
  /** Track CSS de la columna, ej. `"minmax(150px, auto)"`. */
  width: string
  /** Cabecera; abarca las dos filas del encabezado. */
  renderHeader: () => ReactNode
  renderCell?: (row: TRow) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

export interface HuemulMatrixProps<TRow, TCol> {
  columns: HuemulMatrixColumn<TCol>[]
  /** Ya ordenadas: el agrupado del encabezado solo fusiona contiguas. */
  rows: HuemulMatrixRow<TRow>[]

  // Encabezado
  /** Texto de la esquina superior izquierda (ya localizado por el consumidor). */
  cornerLabel?: string
  /** Sustituye por completo el contenido de la esquina. */
  renderCorner?: () => ReactNode
  /** Nivel 1: etiqueta de la etapa (+ acciones propias, ej. un botón de configurar). */
  renderGroupHeader: (group: HuemulMatrixColumnGroup<TCol>) => ReactNode
  /**
   * true → el grupo se subdivide y se pinta la fila de nivel 2.
   * false → la celda de nivel 1 abarca las dos filas.
   * Default: `group.columns.length > 1`.
   */
  hasColumnHeader?: (group: HuemulMatrixColumnGroup<TCol>) => boolean
  /** Nivel 2: nombre de la columna dentro de su grupo. */
  renderColumnHeader?: (
    column: HuemulMatrixColumn<TCol>,
    group: HuemulMatrixColumnGroup<TCol>,
  ) => ReactNode
  /** Clases extra de las celdas de encabezado del grupo (nivel 1 y nivel 2). */
  getGroupHeaderClassName?: (group: HuemulMatrixColumnGroup<TCol>) => string
  /** Alto en px de la fila de grupos; el nivel 2 se pega con este mismo offset. Default 30. */
  groupHeaderHeight?: number

  // Cuerpo
  /** Primera columna sticky de una fila `cells`. */
  renderRowHeader: (row: TRow) => ReactNode
  renderCell: (row: TRow, column: TCol) => ReactNode
  /** Clases extra de la celda sticky (fondo + hover; ej. tinte de fila). */
  getRowHeaderClassName?: (row: TRow) => string
  /** Clases extra de cada celda de datos (ej. tinte de columna activa). */
  getCellClassName?: (row: TRow, column: TCol) => string

  trailingColumn?: HuemulMatrixTrailingColumn<TRow>

  // Shell
  isLoading?: boolean
  /** Se renderiza dentro del marco cuando no hay nada que mostrar. */
  emptyState?: ReactNode
  /** Ancho de la primera columna. Default `"232px"`. */
  firstColumnWidth?: string
  /** Track de cada columna de datos. Default `"minmax(112px, 1fr)"`. */
  columnWidth?: string
  /** Clases del contenedor con scroll (ej. `min-h-0 flex-1` o `max-h-[420px]`). */
  className?: string
}
