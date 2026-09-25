'use client';

import * as React from 'react';

import {
  useToggleToolbarButton,
  useToggleToolbarButtonState,
} from '@platejs/toggle/react';
import { ListCollapseIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ToolbarButton } from './toolbar';

export function ToggleToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const state = useToggleToolbarButtonState();
  const { props: buttonProps } = useToggleToolbarButton(state);
  const { t } = useTranslation('editor');

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={t('toolbar.toggle')}>
      <ListCollapseIcon />
    </ToolbarButton>
  );
}
