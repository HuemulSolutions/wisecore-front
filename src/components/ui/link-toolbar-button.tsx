'use client';

import * as React from 'react';

import {
  useLinkToolbarButton,
  useLinkToolbarButtonState,
} from '@platejs/link/react';
import { Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ToolbarButton } from './toolbar';

export function LinkToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const state = useLinkToolbarButtonState();
  const { props: buttonProps } = useLinkToolbarButton(state);
  const { t } = useTranslation('editor');

  return (
    <ToolbarButton {...props} {...buttonProps} data-plate-focus tooltip={t('toolbar.link')}>
      <Link />
    </ToolbarButton>
  );
}
