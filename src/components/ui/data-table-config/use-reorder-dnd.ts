import * as React from 'react';

/** Reordenar por drag & drop nativo — lo comparten la lista del paso 2 y la vista previa
 * (encabezados / filas), que editan el mismo array de columnas. */
export function useReorderDnd(onReorder: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);

  const reset = React.useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const getItemProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
      setDragIndex(index);
    },
    onDragOver: (e: React.DragEvent) => {
      if (dragIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (overIndex !== index) setOverIndex(index);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== index) onReorder(dragIndex, index);
      reset();
    },
    onDragEnd: reset,
  });

  return {
    getItemProps,
    isDragging: (index: number) => dragIndex === index,
    isDropTarget: (index: number) => dragIndex !== null && overIndex === index && dragIndex !== index,
  };
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
