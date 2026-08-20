'use client';

import type { TElement } from 'platejs';

import { MentionInputPlugin, MentionPlugin } from '@platejs/mention/react';
import { KEYS } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

import { MentionElement } from '@/components/ui/mention-node';
import { ReferenceComboboxInput } from '@/components/ui/reference-combobox-input';

/**
 * `MentionPlugin`/`MentionInputPlugin` (de `@platejs/mention`) siguen dando la
 * mecánica de trigger/input de "@" — infraestructura de terceros, no el nodo
 * insertado. `MentionElement` queda como render LEGACY: solo lee menciones
 * `mention` ya guardadas (nunca más se inserta, ver reference-kit.tsx para los
 * dos tipos nuevos). `ReferenceComboboxInput` es el combobox que reemplaza al
 * viejo picker de dos modales.
 */
const CODE_TYPES = new Set<string>([KEYS.codeBlock, KEYS.codeLine]);

/**
 * Reabre el selector al clickear sobre un `@algo` que quedó como texto plano.
 * Pasa cuando `useComboboxInput({ cancelInputOnBlur: true })` cancela el
 * `mention_input` al perder foco (ver inline-combobox.tsx) y lo reinserta como
 * texto suelto: ese `@` ya no dispara nada — el trigger de `withTriggerCombobox`
 * (`@platejs/combobox`) solo corre al TIPEAR el carácter `@`, nunca al
 * posicionar el caret sobre uno ya existente. Este plugin lo detecta y lo
 * vuelve a convertir en `mention_input`, con lo ya tipeado precargado como
 * búsqueda en vez de perderlo.
 */
const MentionReopenPlugin = createPlatePlugin({
  key: 'mention-reopen',
  handlers: {
    onClick: ({ editor, event }) => {
      if (event.button !== 0) return false;

      const range = editor.api.findEventRange(event);
      if (!range) return false;

      const point = range.anchor;
      const entry = editor.api.node(point.path);
      if (!entry) return false;
      const [node] = entry;
      if (typeof (node as { text?: unknown }).text !== 'string') return false;
      const text = (node as { text: string }).text;

      // Aísla el token que contiene el caret retrocediendo/avanzando hasta el
      // próximo espacio — mismo criterio que separa palabras en el documento.
      let start = point.offset;
      while (start > 0 && !/\s/.test(text[start - 1])) start--;
      let end = point.offset;
      while (end < text.length && !/\s/.test(text[end])) end++;

      if (text[start] !== '@') return false;

      // Mismo patrón que `triggerPreviousCharPattern` — deja afuera un `@` de
      // mail (`juan@empresa.com`, donde el token no arranca en `@`) y confirma
      // que el `@` está en posición válida de trigger.
      const beforeChar = start > 0 ? text[start - 1] : '';
      if (!/^$|^[\s"']$/.test(beforeChar)) return false;

      // Un `@` dentro de un bloque de código no debe abrir el selector.
      if (editor.api.above({ at: point, match: (n) => CODE_TYPES.has((n as TElement).type) })) {
        return false;
      }

      const value = text.slice(start + 1, end);
      const tokenRange = {
        anchor: { path: point.path, offset: start },
        focus: { path: point.path, offset: end },
      };

      event.preventDefault();

      editor.tf.insertNodes(
        {
          type: MentionInputPlugin.key,
          trigger: '@',
          value,
          children: [{ text: '' }],
          ...(editor.meta.userId ? { userId: editor.meta.userId } : {}),
        },
        { at: tokenRange }
      );

      return true;
    },
  },
});

export const MentionKit = [
  MentionPlugin.configure({
    options: {
      triggerPreviousCharPattern: /^$|^[\s"']$/,
    },
  }).withComponent(MentionElement),
  MentionInputPlugin.withComponent(ReferenceComboboxInput),
  MentionReopenPlugin,
];
