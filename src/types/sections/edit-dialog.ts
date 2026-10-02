import type { Section } from './add'
import type { EditFormItem, EditFormItemForBackend } from './edit-form'

export type { EditFormItem as Item, EditFormItemForBackend as ItemForBackend } from './edit-form'

export interface EditSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: EditFormItem;
  /**
   * Si devuelve una promesa, el sheet muestra loader en Guardar, bloquea el cierre y solo se
   * cierra cuando resuelve; si rechaza, queda abierto con lo editado.
   */
  onSave: (updatedItem: EditFormItemForBackend) => Promise<unknown> | void;
  existingSections?: Section[];
  onGeneratingChange?: (isGenerating: boolean) => void;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
  documentId?: string;
  templateId?: string;
  executionId?: string;
  /** Nombre del contenedor (plantilla/activo) — arma el subtítulo dinámico del sheet. */
  containerName?: string;
  /** La definición aún se está cargando: el sheet abre ya, con skeleton en el cuerpo y guardar deshabilitado. */
  loading?: boolean;
}
