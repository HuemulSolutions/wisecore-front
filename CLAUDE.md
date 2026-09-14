# Wisecore Front — Claude Instructions

## Idioma

Responder siempre en español (nunca portugués ni inglés), incluyendo explicaciones, comentarios de commit y cualquier texto generado. Si se detecta una respuesta parcialmente en portugués, autocorregir inmediatamente.

## Carpeta de contexto IA

Existe una carpeta `ia context/` en la raíz del proyecto con guías de arquitectura y convenciones. **Antes de implementar cualquier cambio, leer el archivo correspondiente a la tarea.**

### Mapa de guías → cuándo leerlas

| Tarea solicitada | Archivo a leer |
|---|---|
| Crear un módulo nuevo | `ia context/new-module-guide.md` |
| Refactorizar un módulo existente | `ia context/refactor-module-guide.md` |
| Agregar o modificar endpoints de API | `ia context/new-endpoints-guide.md` |
| Modificar layouts de página | `ia context/huemul-page-layout-guide.md` |
| Implementar un diseño/rediseño de Figma/mockup, o crear pantallas nuevas | `ia context/diseno-rediseno-pantallas-guide.md` |
| Crear una pantalla de listado con panel de detalle maestro-detalle (tabla + panel por URL) | `ia context/list-detail-panel-guide.md` |
| Mostrar una misma pieza de detalle como página con URL propia y/o como sheet ancho (tabs, volver, guardado) | `ia context/detail-surface-guide.md` |
| Agregar filtros a una página (botón + panel lateral + chips) | `ia context/filter-panel-guide.md` |
| Crear/definir una pantalla o panel que consuma datos del backend (botón de refresh) | `ia context/refresh-button-guide.md` |
| Integrar permisos / RBAC | `ia context/rbac-permissions-guide.md` |
| Auditar/validar los permisos RBAC de una página existente | `ia context/rbac-audit-guide.md` |
| Mover o agregar traducciones (i18n) | `ia context/i18n-common-refactor-guide.md` |
| Extraer componentes, hooks o utilidades | `ia context/refactor-file-guide.md` |
| Extraer tipos TypeScript a `src/types/` | `ia context/refactor-types-guide.md` |
| Consolidar múltiples archivos de tipos en subdirectorio | `ia context/consolidate-types-subdirectory-guide.md` |
| Fijar una fila recién creada al tope de una tabla paginada | `ia context/pin-newly-created-row-guide.md` |
| Trabajar con dependencias condicionales de campos de formulario (`depends_on`) | `ia context/dependencias-condicionales-formularios-guide.md` |
| Trabajar con permisos de sección por ciclo de vida (`view`/`can_edit` por sección × step, distinto del permiso del documento completo) | `ia context/permisos-seccion-lifecycle-guide.md` |
| Renderizar/editar un input para un `question_type` (responder formulario o asignar valor de custom field) | `ia context/question-type-input-guide.md` |
| Combinar edición + eliminación de una entidad en un mismo sheet (zona de peligro) | `ia context/danger-zone-sheet-guide.md` |
| Generar un link para compartir con un usuario de la org que abre una vista a pantalla completa (sin header/nav) | `ia context/fullscreen-share-route-guide.md` |
| Acumular cambios de un contenido editable y guardarlos desde el footer de un sheet | `ia context/sheet-footer-batch-save-guide.md` |
| Agregar una opción al menú del header (dropdown de settings / menú de usuario) | `ia context/header-menu-guide.md` |
| Mostrar una entidad plana agrupada en carpetas (1 nivel) dentro de una tabla, con asignación por drag & drop | `ia context/tabla-agrupada-drag-and-drop-guide.md` |
| Escribir un `z-index`, agregar un header/banner sticky o un toolbar flotante del editor Plate | `ia context/z-index-layering-guide.md` |
| Agregar un nodo custom al editor Plate (no de la librería) — plugin, render, serialización a Markdown, y opcionalmente datos frescos del backend | `ia context/plate-custom-node-guide.md` |
| Persistir estado de UI del usuario entre recargas (localStorage/sessionStorage): carpetas expandidas, modo de vista, anchos de columna, scroll | `ia context/persistencia-estado-ui-guide.md` |
| Mostrar el árbol de la biblioteca de activos en una superficie nueva (sidebar, picker, selector de carpeta) | `ia context/arbol-biblioteca-activos-guide.md` |
| Crear una entidad relacionada (ej. usuario) desde un sheet de asignación, sin salir de él | `ia context/inline-create-entity-in-sheet-guide.md` |
| Redactar un pedido de cambio o reporte de bug para el equipo de backend | `ia context/backend-change-request-guide.md` |
| Configurar, disparar o auditar la elaboración externa del ciclo de vida (step `edit` procesado por un sistema externo) | `ia context/elaboracion-externa-guide.md` |

Cuando una tarea involucra varias guías, leerlas todas antes de empezar.

---

## Regla para tareas recurrentes

Si durante el trabajo se identifica un patrón que el usuario repite (o que claramente se repetirá), **crear un nuevo archivo `ia context/<nombre-descriptivo>-guide.md`** con la guía correspondiente y agregar su entrada al mapa de arriba en este CLAUDE.md.

El nuevo archivo debe seguir la misma estructura que los existentes:
- Árbol de decisión o checklist de cuándo aplica
- Reglas y convenciones específicas
- Ejemplos de código del propio proyecto
- Lista de errores comunes
- Checklist de verificación final

---

## Reglas generales del proyecto

- Todo texto visible en UI debe venir de traducciones (`src/i18n/locales/`), nunca hardcodeado.
- Usar siempre `httpClient` con header `X-Org-Id` para llamadas al backend.
- Los permisos se manejan con `useUserPermissions` / `ProtectedComponent`, nunca lógica propia.
- Los layouts de página usan `HuemulPageLayout`; no crear estructuras de layout ad-hoc.
- Toda superficie que muestre datos provenientes del backend debe ofrecer un botón de refresh para recargarlos (`PageHeader` en páginas, toolbar strip en tabs/paneles). Exentos: comboboxes/selects/catálogos de formularios. Ver `ia context/refresh-button-guide.md`.
- Los tipos compartidos van en `src/types/`; los tipos locales de un solo componente se pueden mantener en el archivo.
- Al terminar una tarea que modificó archivos, proponer un mensaje de commit (español, corto, estilo del historial reciente vía `git log`). No ejecutar el commit salvo pedido explícito.
