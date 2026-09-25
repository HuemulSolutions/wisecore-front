'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import type { TElement } from 'platejs';

import { DropdownMenuItemIndicator } from '@radix-ui/react-dropdown-menu';
import {
  CheckIcon,
  ChevronRightIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getBlockType,
  setBlockType,
} from '@/components/plate-editor/components/transforms';

import { ToolbarButton, ToolbarMenuGroup } from './toolbar';

function useTurnIntoItems() {
  const { t } = useTranslation('editor');
  return React.useMemo(() => [
    {
      icon: <PilcrowIcon />,
      keywords: ['paragraph'],
      label: t('turnInto.text'),
      value: KEYS.p,
    },
    {
      icon: <Heading1Icon />,
      keywords: ['title', 'h1'],
      label: t('turnInto.heading1'),
      value: 'h1',
    },
    {
      icon: <Heading2Icon />,
      keywords: ['subtitle', 'h2'],
      label: t('turnInto.heading2'),
      value: 'h2',
    },
    {
      icon: <Heading3Icon />,
      keywords: ['subtitle', 'h3'],
      label: t('turnInto.heading3'),
      value: 'h3',
    },
    {
      icon: <Heading4Icon />,
      keywords: ['subtitle', 'h4'],
      label: t('turnInto.heading4'),
      value: 'h4',
    },
    {
      icon: <Heading5Icon />,
      keywords: ['subtitle', 'h5'],
      label: t('turnInto.heading5'),
      value: 'h5',
    },
    {
      icon: <Heading6Icon />,
      keywords: ['subtitle', 'h6'],
      label: t('turnInto.heading6'),
      value: 'h6',
    },
    {
      icon: <ListIcon />,
      keywords: ['unordered', 'ul', '-'],
      label: t('turnInto.bulletedList'),
      value: KEYS.ul,
    },
    {
      icon: <ListOrderedIcon />,
      keywords: ['ordered', 'ol', '1'],
      label: t('turnInto.numberedList'),
      value: KEYS.ol,
    },
    {
      icon: <SquareIcon />,
      keywords: ['checklist', 'task', 'checkbox', '[]'],
      label: t('turnInto.todoList'),
      value: KEYS.listTodo,
    },
    {
      icon: <ChevronRightIcon />,
      keywords: ['collapsible', 'expandable'],
      label: t('turnInto.toggleList'),
      value: KEYS.toggle,
    },
    {
      icon: <QuoteIcon />,
      keywords: ['citation', 'blockquote', '>'],
      label: t('turnInto.quote'),
      value: KEYS.blockquote,
    },
  ], [t]);
}

export function TurnIntoToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation('editor');
  const turnIntoItems = useTurnIntoItems();

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  });
  const selectedItem = React.useMemo(
    () =>
      turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ??
      turnIntoItems[0],
    [value]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          className="min-w-[125px]"
          pressed={open}
          tooltip={t('turnInto.label')}
          isDropdown
        >
          {selectedItem.label}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar min-w-0"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align="start"
      >
        <ToolbarMenuGroup
          value={value}
          onValueChange={(type) => {
            setBlockType(editor, type);
          }}
          label={t('turnInto.label')}
        >
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="min-w-[180px] pl-2 *:first:[span]:hidden"
              value={itemValue}
            >
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <CheckIcon />
                </DropdownMenuItemIndicator>
              </span>
              {icon}
              {label}
            </DropdownMenuRadioItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
