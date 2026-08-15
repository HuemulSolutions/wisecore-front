'use client';

import * as React from 'react';

import type { PlateEditor, PlateElementProps } from 'platejs/react';

import {
  CalendarIcon,
  ChevronRightIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ImagesIcon,
  ListIcon,
  ListOrdered,
  PilcrowIcon,
  Quote,
  Square,
  Table,
  TableOfContentsIcon,
  Workflow,
} from 'lucide-react';
import { type TComboboxInputElement, KEYS } from 'platejs';
import { PlateElement } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import {
  insertBlock,
  insertInlineElement,
} from '@/components/plate-editor/components/transforms';

import { useMediaReference } from '@/contexts/media-reference-context';
import { MERMAID_KEY } from '@/lib/plate-mermaid-utils';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

type Group = {
  group: string;
  items: {
    icon: React.ReactNode;
    value: string;
    onSelect: (editor: PlateEditor, value: string) => void;
    className?: string;
    focusEditor?: boolean;
    keywords?: string[];
    label?: string;
  }[];
};

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;
  const { openPicker } = useMediaReference();
  const { t } = useTranslation('editor');

  const groups: Group[] = React.useMemo(() => [
    {
      group: t('slash.groups.basicBlocks'),
      items: [
        {
          icon: <PilcrowIcon />,
          keywords: ['paragraph', 'text', 'texto'],
          label: t('slash.items.text'),
          value: KEYS.p,
        },
        {
          icon: <Heading1Icon />,
          keywords: ['title', 'h1', 'encabezado'],
          label: t('slash.items.heading1'),
          value: KEYS.h1,
        },
        {
          icon: <Heading2Icon />,
          keywords: ['subtitle', 'h2', 'encabezado'],
          label: t('slash.items.heading2'),
          value: KEYS.h2,
        },
        {
          icon: <Heading3Icon />,
          keywords: ['subtitle', 'h3', 'encabezado'],
          label: t('slash.items.heading3'),
          value: KEYS.h3,
        },
        {
          icon: <ListIcon />,
          keywords: ['unordered', 'ul', '-', 'lista', 'viñetas'],
          label: t('slash.items.bulletedList'),
          value: KEYS.ul,
        },
        {
          icon: <ListOrdered />,
          keywords: ['ordered', 'ol', '1', 'lista', 'numerada'],
          label: t('slash.items.numberedList'),
          value: KEYS.ol,
        },
        {
          icon: <Square />,
          keywords: ['checklist', 'task', 'checkbox', '[]', 'tareas'],
          label: t('slash.items.todoList'),
          value: KEYS.listTodo,
        },
        {
          icon: <ChevronRightIcon />,
          keywords: ['collapsible', 'expandable', 'desplegable'],
          label: t('slash.items.toggle'),
          value: KEYS.toggle,
        },
        {
          icon: <Table />,
          keywords: ['tabla'],
          label: t('slash.items.table'),
          value: KEYS.table,
        },
        {
          icon: <Quote />,
          keywords: ['citation', 'blockquote', 'quote', '>', 'cita'],
          label: t('slash.items.blockquote'),
          value: KEYS.blockquote,
        },
        {
          icon: <ImageIcon />,
          keywords: ['image', 'img', 'photo', 'imagen', 'foto'],
          label: t('slash.items.image'),
          value: KEYS.img,
        },
        {
          icon: <Workflow />,
          keywords: ['mermaid', 'diagram', 'diagrama', 'flowchart', 'flujo'],
          label: t('slash.items.mermaid'),
          value: MERMAID_KEY,
        },
      ].map((item) => ({
        ...item,
        onSelect: (editor: PlateEditor, value: string) => {
          insertBlock(editor, value, { upsert: true });
        },
      })),
    },
    {
      group: t('slash.groups.advancedBlocks'),
      items: [
        {
          icon: <TableOfContentsIcon />,
          keywords: ['toc', 'table of contents', 'tabla de contenidos', 'indice', 'índice'],
          label: t('slash.items.tableOfContents'),
          value: KEYS.toc,
        },
      ].map((item) => ({
        ...item,
        onSelect: (editor: PlateEditor, value: string) => {
          insertBlock(editor, value, { upsert: true });
        },
      })),
    },
    {
      group: t('slash.groups.inline'),
      items: [
        {
          focusEditor: true,
          icon: <CalendarIcon />,
          keywords: ['time', 'today', 'fecha', 'hoy'],
          label: t('slash.items.date'),
          value: KEYS.date,
        },
      ].map((item) => ({
        ...item,
        onSelect: (editor: PlateEditor, value: string) => {
          insertInlineElement(editor, value);
        },
      })),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);

  const allGroups = React.useMemo(() => {
    if (!openPicker) return groups;
    return [
      ...groups,
      {
        group: t('slash.groups.media'),
        items: [
          {
            icon: <ImagesIcon />,
            keywords: ['media', 'image', 'reference', 'file', 'asset', 'imagen', 'referencia', 'archivo'],
            label: t('slash.items.mediaReference'),
            value: 'media-reference',
            focusEditor: false,
            onSelect: (editor: PlateEditor) => {
              openPicker(editor);
            },
          },
        ],
      },
    ];
  }, [openPicker, groups, t]);

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>{t('slash.noResults')}</InlineComboboxEmpty>

          {allGroups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(
                ({ focusEditor, icon, keywords, label, value, onSelect }) => (
                  <InlineComboboxItem
                    key={value}
                    value={value}
                    onClick={() => onSelect(editor, value)}
                    label={label}
                    focusEditor={focusEditor}
                    group={group}
                    keywords={keywords}
                  >
                    <div className="mr-2 text-muted-foreground">{icon}</div>
                    {label ?? value}
                  </InlineComboboxItem>
                )
              )}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
