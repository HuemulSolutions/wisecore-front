import * as React from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type {
  HuemulMatrixColumnGroup,
  HuemulMatrixProps,
  HuemulMatrixColumn,
  HuemulMatrixRow,
  HuemulMatrixCellsRow,
  HuemulMatrixBandRow,
  HuemulMatrixTrailingColumn,
} from "@/types/huemul"

export type {
  HuemulMatrixColumnGroup,
  HuemulMatrixProps,
  HuemulMatrixColumn,
  HuemulMatrixRow,
  HuemulMatrixCellsRow,
  HuemulMatrixBandRow,
  HuemulMatrixTrailingColumn,
}

/**
 * Alto por defecto de la fila de grupos del encabezado. La fila de columnas
 * (nivel 2) se pega justo debajo con este mismo offset (`groupHeaderHeight`),
 * así ambas quedan sticky sin superponerse.
 */
const DEFAULT_GROUP_HEADER_HEIGHT = 30

/**
 * `HuemulMatrix` — matriz genérica fila × columna con encabezado agrupado de
 * dos niveles (nivel 1: grupo; nivel 2: columna dentro del grupo). Usa CSS
 * Grid con `display: contents` por fila y posicionamiento explícito de cada
 * celda del encabezado — los grupos sin subdivisión abarcan las dos filas del
 * header y el auto-placement de grid no puede predecir eso.
 *
 * El componente no sabe nada de dominio: filas, columnas, celdas y encabezados
 * se renderizan por completo vía render props. Soporta filas de banda a ancho
 * completo (`HuemulMatrixBandRow`, para separadores o filas de acción) y una
 * columna extra al final (`trailingColumn`, para un botón de «añadir…»).
 *
 * @example
 * ```tsx
 * <HuemulMatrix<Role, LifecycleStep>
 *   columns={steps.map((s) => ({ key: s.id, data: s, groupKey: s.type }))}
 *   hasColumnHeader={(g) => isGroupableStepType(g.groupKey)}
 *   renderGroupHeader={(g) => <span>{stepTypeLabel(g.groupKey)}</span>}
 *   rows={roles.map((r) => ({ kind: "cells", key: r.id, data: r }))}
 *   renderRowHeader={(role) => <span>{role.name}</span>}
 *   renderCell={(role, step) => <ToggleCell … />}
 * />
 * ```
 */
export function HuemulMatrix<TRow, TCol>({
  columns,
  rows,
  cornerLabel,
  renderCorner,
  renderGroupHeader,
  hasColumnHeader,
  renderColumnHeader,
  getGroupHeaderClassName,
  groupHeaderHeight = DEFAULT_GROUP_HEADER_HEIGHT,
  renderRowHeader,
  renderCell,
  getRowHeaderClassName,
  getCellClassName,
  trailingColumn,
  isLoading = false,
  emptyState,
  firstColumnWidth = "232px",
  columnWidth = "minmax(112px, 1fr)",
  className,
}: HuemulMatrixProps<TRow, TCol>) {
  // Grupos de columnas del encabezado: `columns` ya viene ordenado por el
  // consumidor, así que basta agrupar las contiguas. `startIndex` es el offset
  // dentro de `columns` — se usa para posicionar las celdas en el grid.
  const groups = React.useMemo(() => {
    const out: HuemulMatrixColumnGroup<TCol>[] = []
    columns.forEach((column, index) => {
      const last = out[out.length - 1]
      if (last && last.groupKey === column.groupKey) last.columns.push(column)
      else out.push({ groupKey: column.groupKey, columns: [column], startIndex: index })
    })
    return out
  }, [columns])

  const gridTemplateColumns = `${firstColumnWidth} repeat(${Math.max(columns.length, 1)}, ${columnWidth})${
    trailingColumn ? ` ${trailingColumn.width}` : ""
  }`

  return (
    <div className={cn("overflow-auto rounded-[10px] border border-[#e5eaf0] bg-white", className)}>
      {isLoading ? (
        <div className="flex flex-col gap-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : emptyState ? (
        emptyState
      ) : (
        <div className="grid" style={{ gridTemplateColumns }}>
          {/*
            Header de dos niveles. Las celdas se posicionan explícitamente
            (`gridColumn` + `gridRow`) porque los grupos sin subdivisión
            abarcan ambas filas y el auto-placement dejaría de ser predecible.
            La primera columna es la 1, así que la columna de datos en índice
            `i` cae en la columna de grid `i + 2`. Las dos primeras filas
            quedan cubiertas por completo, de modo que las filas de datos
            siguen desde la 3.
          */}
          <div
            className="sticky top-0 left-0 z-30 flex items-center border-b border-[#e5eaf0] bg-[#f7f9fb] px-3 py-2.5"
            style={{ gridColumn: 1, gridRow: "1 / span 2" }}
          >
            {renderCorner ? (
              renderCorner()
            ) : (
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                {cornerLabel}
              </span>
            )}
          </div>

          {groups.map((group) => {
            const isSubdivided = hasColumnHeader ? hasColumnHeader(group) : group.columns.length > 1
            const groupClassName = getGroupHeaderClassName?.(group)
            return (
              <React.Fragment key={`header-${group.groupKey}-${group.startIndex}`}>
                {/* Nivel 1: el grupo, una sola vez por más columnas que tenga */}
                <div
                  className={cn(
                    "sticky top-0 z-20 flex items-center gap-1 border-l px-3",
                    isSubdivided
                      ? "border-b border-b-[#eef2f7] border-l-[#e5eaf0]"
                      : "border-b border-[#e5eaf0]",
                    groupClassName ?? "bg-[#f7f9fb]",
                  )}
                  style={{
                    gridColumn: `${group.startIndex + 2} / span ${group.columns.length}`,
                    gridRow: isSubdivided ? "1" : "1 / span 2",
                    ...(isSubdivided ? { height: groupHeaderHeight } : {}),
                  }}
                >
                  {renderGroupHeader(group)}
                </div>

                {/* Nivel 2: una columna por celda — solo en grupos subdivididos */}
                {isSubdivided &&
                  group.columns.map((column, index) => (
                    <div
                      key={`header-column-${column.key}`}
                      className={cn(
                        "sticky z-20 flex items-center border-b border-l border-[#e5eaf0] px-3 py-1.5",
                        groupClassName ?? "bg-[#f7f9fb]",
                      )}
                      style={{
                        gridColumn: group.startIndex + 2 + index,
                        gridRow: "2",
                        top: groupHeaderHeight,
                      }}
                    >
                      {renderColumnHeader?.(column, group)}
                    </div>
                  ))}
              </React.Fragment>
            )
          })}

          {trailingColumn && (
            <div
              className={cn(
                "sticky top-0 z-20 flex items-center border-b border-l border-[#e5eaf0] bg-[#f7f9fb] px-3 py-2.5",
                trailingColumn.headerClassName,
              )}
              style={{ gridColumn: columns.length + 2, gridRow: "1 / span 2" }}
            >
              {trailingColumn.renderHeader()}
            </div>
          )}

          {/* Filas */}
          {rows.map((row, rowIndex) => {
            const isLast = rowIndex === rows.length - 1

            if (row.kind === "band") {
              return (
                <div
                  key={row.key}
                  className={cn("contents", row.hoverable && "group/band")}
                >
                  <div
                    className={cn(
                      "sticky left-0 z-10 flex min-w-0 items-center",
                      row.className,
                      row.contentClassName,
                    )}
                  >
                    {row.content}
                  </div>
                  <div
                    className={row.className}
                    style={{ gridColumn: "2 / -1" }}
                    onClick={row.onClick}
                  />
                </div>
              )
            }

            return (
              <div key={row.key} className="group contents">
                <div
                  className={cn(
                    "sticky left-0 z-10 flex min-w-0 items-center px-3 py-2.5 transition-colors",
                    getRowHeaderClassName?.(row.data) ?? "bg-white group-hover:bg-[#fafbfd]",
                    !isLast && "border-b border-[#eef1f5]",
                  )}
                >
                  {renderRowHeader(row.data)}
                </div>
                {columns.map((column) => (
                  <div
                    key={`${row.key}-${column.key}`}
                    className={cn(
                      "flex items-center justify-center border-l border-[#eef1f5] px-3 py-2.5 transition-colors",
                      getCellClassName?.(row.data, column.data) ?? "group-hover:bg-[#fafbfd]",
                      !isLast && "border-b border-b-[#eef1f5]",
                    )}
                  >
                    {renderCell(row.data, column.data)}
                  </div>
                ))}
                {trailingColumn && (
                  <div
                    className={cn(
                      "border-l border-[#eef1f5]",
                      trailingColumn.cellClassName,
                      !isLast && "border-b border-b-[#eef1f5]",
                    )}
                  >
                    {trailingColumn.renderCell?.(row.data)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
