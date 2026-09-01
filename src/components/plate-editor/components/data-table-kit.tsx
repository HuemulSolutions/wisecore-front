'use client';

import { createPlatePlugin } from 'platejs/react';

import { DataTableElementNode } from '@/components/ui/data-table-node';
import { DATA_TABLE_KEY } from '@/lib/plate-data-table-utils';

const DataTablePlugin = createPlatePlugin({
  key: DATA_TABLE_KEY,
  node: { isElement: true, isVoid: true },
}).withComponent(DataTableElementNode);

export const DataTableKit = [DataTablePlugin];
