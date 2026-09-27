'use client';

import * as React from 'react';

import { useIndentButton, useOutdentButton } from '@platejs/indent/react';
import { IndentIcon, OutdentIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ToolbarButton } from './toolbar';

export function IndentToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const { props: buttonProps } = useIndentButton();
  const { t } = useTranslation('editor');

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={t('toolbar.indent')}>
      <IndentIcon />
    </ToolbarButton>
  );
}

export function OutdentToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const { props: buttonProps } = useOutdentButton();
  const { t } = useTranslation('editor');

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={t('toolbar.outdent')}>
      <OutdentIcon />
    </ToolbarButton>
  );
}
