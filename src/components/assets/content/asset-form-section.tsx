import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulFilePreview } from "@/huemul/components/huemul-file-preview";
import { HuemulQuestionInput } from "@/huemul/components/huemul-question-input";
import type { HuemulQuestionInputValue } from "@/huemul/components/huemul-question-input";
import { handleApiError } from "@/lib/error-utils";
import { isSectionPermissionDeniedError } from "@/lib/section-permission-errors";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { updateReviewStatus, updateSectionFormValues } from "@/services/section_execution";
import { uploadMedia } from "@/services/media";
import type { FormFieldValue, FormValuesSectionPayload } from "@/types/sections/core";
import type { ReviewStatus } from "@/types/section-execution";
import type { ContentSection } from "@/types/assets";
import { computeSectionStats } from "@/components/workflow/workflow-section-stats";
import { isMediaToken } from "@/lib/plate-media-utils";
import { AlertTriangle, Check, FileX, Info, Loader2, X } from "lucide-react";
import {
  CUSTOM_FIELD_QUESTION_TYPE,
  MULTI_SELECT_QUESTION_TYPES,
  QUESTION_TYPE,
  SINGLE_SELECT_QUESTION_TYPES,
  getQuestionTypePlaceholder,
  hasAnswer,
  isFieldAnswerable,
  isFieldVisible,
  isFreeTextField,
  normalizeSelectionValue,
  questionTypeLabel,
  readFieldConfig,
  readFieldOptions,
} from "@/components/sections/question-type-meta";
import { SectionFieldSeparator } from "@/components/sections/section-field-separator";
import { FormFieldAnswerValue } from "@/components/sections/form-field-answer-value";
import { validateFormFieldValue } from "@/components/sections/validate-form-field-value";

interface AssetFormSectionProps {
  /** id del section_execution → se usa en el PATCH /form_values */
  sectionExecutionId: string;
  formFields: FormFieldValue[];
  status?: string;
  organizationId?: string;
  /** document_id del asset → se pasa como parent_id al subir archivos a /media/ */
  documentId?: string;
  /** Si el usuario puede responder/editar el formulario (modo editor + permiso). Si es false, solo lectura. */
  canInteract: boolean;
  /** Modo edición, controlado por el padre (mismo botón de lápiz que las demás secciones). */
  isEditing: boolean;
  /** El padre sale del modo edición (tras el flush final de "Dejar de editar"). */
  onExitEditing: () => void;
  /** Estado actual de revisión — evita repetir el PATCH si ya está en 'finished'. */
  reviewStatus?: ReviewStatus | null;
  /**
   * Flags de SECCIÓN (no de campo) del último /content conocido — can_edit (permiso por
   * sección), is_visible/can_answer (depends_on propio de la sección). `flushDirtyFields`
   * los necesita para replicar el corte de `computeSectionStats` (workflow-section-stats.ts)
   * al decidir 'finished' vs 'editing': sin ellos, una sección inactiva/sin permiso podría
   * marcarse 'finished' solo porque sus preguntas (todas inactivas) no suman a
   * `missingRequired`. Si el padre no los tiene a mano, se omiten y el corte no aplica acá
   * — la reconciliación contra `advance_blockers` (useReconcileFormReviewStatus) sigue
   * siendo la red de seguridad.
   */
  sectionFlags?: Pick<ContentSection, "can_edit" | "is_visible" | "can_answer">;
  /** Notifica al padre que review_status pasó a 'finished' tras el flush final. */
  onReviewStatusChange?: (status: ReviewStatus) => void;
  /**
   * Refresca el contenido del asset tras guardar. Cuando el autoguardado o el flush
   * final trae la respuesta del PATCH /form_values, se pasa el payload (agrupado por
   * section_execution_id) para que el padre parchee el caché sin refetch completo.
   */
  onUpdate?: (payload?: FormValuesSectionPayload[]) => void;
  /** Notifica al padre el estado de isSaving (para deshabilitar/mostrar loading en sus propios botones) */
  onSavingChange?: (isSaving: boolean) => void;
}

/** Acción que el padre (assets-section.tsx) dispara desde su propia barra de edición. */
export interface AssetFormSectionHandle {
  exit: () => void;
}

type AnswerMap = Record<string, unknown>;

// Compara dos valores de respuesta (soporta arrays, usado tanto en el diff del
// autosave como en el flush final al salir de edición).
function valuesEqual(a: unknown, b: unknown): boolean {
  return Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
    : Object.is(a, b);
}

// Inicializa el mapa de respuestas desde los valores actuales del snapshot.
// Si value es config (array de opciones u objeto de configuración), no es una respuesta → null.
// Para campos de selección, normaliza primero: el backend inicializa value = default_value
// (las opciones de config) en campos sin responder, y algunos guardados legacy quedaron con
// esas opciones mezcladas junto a los ids reales — normalizeSelectionValue descarta el ruido
// de config y deja solo los ids realmente seleccionados.
function buildInitialAnswers(fields: FormFieldValue[]): AnswerMap {
  const map: AnswerMap = {};
  for (const f of fields) {
    const isMulti = MULTI_SELECT_QUESTION_TYPES.includes(f.question_type ?? "");
    const isSingle = SINGLE_SELECT_QUESTION_TYPES.includes(f.question_type ?? "");
    const value = isMulti || isSingle ? normalizeSelectionValue(f.value, isMulti) : f.value;
    map[f.id] = hasAnswer(value) ? value : null;
  }
  return map;
}

export const AssetFormSection = forwardRef<AssetFormSectionHandle, AssetFormSectionProps>(function AssetFormSection({
  sectionExecutionId,
  formFields,
  organizationId,
  documentId,
  canInteract,
  isEditing,
  onExitEditing,
  reviewStatus,
  sectionFlags,
  onReviewStatusChange,
  onUpdate,
  onSavingChange,
}, ref) {
  const { t } = useTranslation(["sections", "common"]);
  const queryClient = useQueryClient();

  // Autocorrige la UI cuando el backend rechaza una escritura por permiso de
  // sección (403 SECTION_LIFECYCLE_PERMISSION_DENIED / LIFECYCLE_PERMISSION_DENIED):
  // refresca el contenido para que la sección se re-renderice como solo lectura
  // en vez de quedar mostrando controles que van a seguir fallando. Cubre tanto
  // /asset (assets-content.tsx) como el wizard de workflow (workflow-detail-panel.tsx):
  // la key de ambos empieza con ['document-content', documentId].
  const invalidateContentOnPermissionDenied = useCallback(
    (error: unknown) => {
      if (isSectionPermissionDeniedError(error) && documentId) {
        queryClient.invalidateQueries({ queryKey: ['document-content', documentId] });
      }
    },
    [queryClient, documentId],
  );

  const sortedFields = useMemo(
    () => [...formFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [formFields],
  );

  // ¿Hay al menos un campo editable? Los custom_field son solo lectura y las preguntas
  // condicionales inactivas (can_answer === false) tampoco se pueden responder, así que
  // un formulario compuesto solo por esos no permite editar respuestas.
  const hasEditableFields = sortedFields.some(isFieldAnswerable);

  const [answers, setAnswers] = useState<AnswerMap>(() => buildInitialAnswers(sortedFields));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
  // Metadatos de archivos recién subidos en esta sesión (para previsualizar; el
  // placeholder {{MEDIA:id}} guardado como respuesta no es una URL). name/contentType
  // vienen del archivo real elegido por el usuario, no de field.data_type — ese último
  // siempre es "image" para carga_de_archivos en el catálogo de question_types.
  const [filePreviews, setFilePreviews] = useState<Record<string, { url: string; name: string; contentType: string }>>({});
  // ids de campos con un auto-guardado en curso — pinta el loader junto al campo respectivo
  // (en vez de un spinner global en una barra) mientras se espera la respuesta del PATCH.
  const [savingFieldIds, setSavingFieldIds] = useState<Set<string>>(new Set());
  // ids con "Guardado" transitorio recién confirmado — se limpian solos a los 1.5s.
  const [savedFieldIds, setSavedFieldIds] = useState<Set<string>>(new Set());
  const savedTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Nodos de cada campo, poblados por el ref callback del loop de render — usado solo para
  // hacer scroll al primer campo con error al intentar avanzar (handleDoneEditing).
  const fieldNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const timeouts = savedTimeoutsRef.current;
    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  // field_id de esta sección referenciados por algún depends_on: son los únicos "disparadores"
  // cuyo cambio puede afectar la visibilidad/respondibilidad de otro campo. Al cambiar uno,
  // se auto-guarda para que el backend recalcule is_visible/can_answer (única autoridad).
  const triggerFieldIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of sortedFields) {
      for (const cond of f.depends_on ?? []) ids.add(cond.field_id);
    }
    return ids;
  }, [sortedFields]);

  // Presencia local: cuando un campo pasa de visible a oculto (is_visible recalculado por el
  // backend), se lo mantiene brevemente renderizado con fade-out en vez de desaparecer de golpe.
  // No decide la visibilidad — solo retrasa el desmontaje de lo que el backend ya ocultó.
  const [exitingFieldIds, setExitingFieldIds] = useState<Set<string>>(new Set());
  const prevVisibleIdsRef = useRef<Set<string>>(new Set(sortedFields.filter(isFieldVisible).map((f) => f.id)));
  useEffect(() => {
    const currentVisibleIds = new Set(sortedFields.filter(isFieldVisible).map((f) => f.id));
    const newlyHidden = [...prevVisibleIdsRef.current].filter((id) => !currentVisibleIds.has(id));
    prevVisibleIdsRef.current = currentVisibleIds;
    if (newlyHidden.length === 0) return;

    setExitingFieldIds((prev) => new Set([...prev, ...newlyHidden]));
    const timeout = setTimeout(() => {
      setExitingFieldIds((prev) => {
        const next = new Set(prev);
        newlyHidden.forEach((id) => next.delete(id));
        return next;
      });
    }, 220);
    return () => clearTimeout(timeout);
  }, [sortedFields]);

  // Campos a renderizar: visibles según el backend, más los que están saliendo con fade-out.
  const displayedFields = useMemo(
    () => sortedFields.filter((f) => isFieldVisible(f) || exitingFieldIds.has(f.id)),
    [sortedFields, exitingFieldIds],
  );

  // Último valor guardado en el backend por snapshot id — evita reenviar un PATCH si el
  // valor del campo no cambió desde el último auto-guardado (o desde la carga inicial).
  const lastSavedAnswersRef = useRef<AnswerMap>(buildInitialAnswers(sortedFields));

  const editing = isEditing && canInteract && hasEditableFields;

  // Aviso de autoguardado descartable — solo por la sesión de edición actual, sin persistencia.
  const [autoSaveHintDismissed, setAutoSaveHintDismissed] = useState(false);
  useEffect(() => {
    if (!editing) setAutoSaveHintDismissed(false);
  }, [editing]);

  // Notifica al padre el isSaving del guardado final (botón Enviar), para que pueda
  // deshabilitar/mostrar loading en su propia barra de acciones.
  useEffect(() => {
    onSavingChange?.(isSaving);
  }, [isSaving, onSavingChange]);

  // Refs de lectura fresca para los disparadores del autoguardado (timers/eventos DOM, no
  // renders) — evitan cerrar sobre estado desactualizado sin tener que recrear los timers
  // en cada cambio de estado.
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const isSavingRef = useRef(isSaving);
  isSavingRef.current = isSaving;
  const uploadingCountRef = useRef(uploadingFields.size);
  uploadingCountRef.current = uploadingFields.size;

  // Último review_status conocido (confirmado por el backend o por la prop del padre) —
  // evita reenviar un PATCH /review_status redundante. La prop `reviewStatus` llega
  // desfasada respecto al PATCH optimista (el padre la propaga un render después), así
  // que se sincroniza acá solo cuando cambia de verdad; `syncReviewStatus` (más abajo)
  // actualiza este ref de inmediato tras un PATCH exitoso, sin esperar el siguiente render.
  const reviewStatusRef = useRef<ReviewStatus | null>(reviewStatus ?? null);
  useEffect(() => {
    reviewStatusRef.current = reviewStatus ?? null;
  }, [reviewStatus]);
  const reviewStatusInFlightRef = useRef(false);
  // Último target que ESTE componente confirmó con éxito — a diferencia de
  // reviewStatusRef (que la prop puede resetear con un valor stale si un /content en
  // vuelo se resuelve antes que nuestro propio PATCH, ver bug de PATCHes duplicados),
  // esto no se pisa desde afuera. Es la deduplicación real.
  const lastSentTargetRef = useRef<ReviewStatus | null>(null);
  // Si llega un target distinto mientras hay un PATCH en vuelo, se guarda acá y se
  // reintenta al terminar — en vez de descartarlo en silencio.
  const pendingTargetRef = useRef<ReviewStatus | null>(null);

  // ids con un PATCH ya en vuelo — evita reenviar el mismo campo si el blur y el timer de
  // commit (widgets atómicos) caen casi al mismo tiempo.
  const inFlightIdsRef = useRef<Set<string>>(new Set());
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleAutosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const COMMIT_DELAY_MS = 400;
  const IDLE_AUTOSAVE_MS = 10_000;

  // Alinea review_status con el resultado del autoguardado ('finished' sin obligatorios
  // pendientes, 'editing' si vuelve a faltar alguno) y con el guardado final del botón
  // (opts.notifyErrors). Deduplica contra lastSentTargetRef ANTES que contra
  // reviewStatusRef: la prop puede resetearse a un valor stale si un /content en vuelo
  // se resuelve antes que este propio PATCH (ver bug de 3 PATCH por sección), y
  // lastSentTargetRef no se pisa desde afuera. Si ya hay un PATCH en vuelo, el target
  // nuevo se guarda en pendingTargetRef y se reintenta al terminar, en vez de
  // descartarse — cubre completar y borrar el mismo campo muy rápido.
  const syncReviewStatus = useCallback(
    (target: ReviewStatus, opts?: { notifyErrors?: boolean }): Promise<void> => {
      const known = reviewStatusRef.current ?? "editing";
      if (target === known || target === lastSentTargetRef.current) return Promise.resolve();
      if (reviewStatusInFlightRef.current) {
        pendingTargetRef.current = target;
        return Promise.resolve();
      }
      reviewStatusInFlightRef.current = true;
      return updateReviewStatus(sectionExecutionId, target, organizationId)
        .then(() => {
          reviewStatusRef.current = target;
          lastSentTargetRef.current = target;
          onReviewStatusChange?.(target);
        })
        .catch((error) => {
          if (opts?.notifyErrors) {
            handleApiError(error, { fallbackMessage: t("form.fill.reviewStatusUpdateFailed") });
          } else {
            // Efecto secundario silencioso del autoguardado, no una acción explícita del
            // usuario: no tapa la pantalla con un toast. Se reintenta en el próximo
            // autoguardado o en la reconciliación contra advance_blockers.
            logger.warn("[AssetFormSection] No se pudo sincronizar review_status", error);
          }
          invalidateContentOnPermissionDenied(error);
        })
        .finally(() => {
          reviewStatusInFlightRef.current = false;
          const next = pendingTargetRef.current;
          if (next !== null) {
            pendingTargetRef.current = null;
            syncReviewStatus(next);
          }
        });
    },
    [sectionExecutionId, organizationId, onReviewStatusChange, invalidateContentOnPermissionDenied, t],
  );

  // Auto-guarda cualquier campo respondible que haya cambiado desde el último guardado — no
  // solo los "disparadores" de depends_on — para que el valor quede persistido sin depender
  // del botón Enviar. Cuando el campo es disparador, esto además hace que el backend recalcule
  // is_visible/can_answer y el usuario vea aparecer/ocultarse los campos dependientes. El
  // front NUNCA decide por su cuenta si un campo se muestra/habilita — solo refleja lo que el
  // backend recalcula tras esto.
  //
  // A diferencia del debounce anterior (un PATCH por tick de tipeo), esto se dispara solo en
  // eventos discretos: blur de un campo de texto libre, cambio de un widget atómico
  // (coalescido 400ms), inactividad de 10s sin salir del campo, abandono de la página, o el
  // flush final al salir de edición — ver ia context correspondiente.
  const flushDirtyFields = useCallback(() => {
    if (!editingRef.current || uploadingCountRef.current > 0 || isSavingRef.current) return;

    const currentAnswers = answersRef.current;
    const changed = sortedFields.filter(
      (f) =>
        isFieldAnswerable(f) &&
        !inFlightIdsRef.current.has(f.id) &&
        !valuesEqual(currentAnswers[f.id], lastSavedAnswersRef.current[f.id]),
    );
    if (changed.length === 0) return;

    // Valida formato/rango (min/max, entero, email) antes de autoguardar. Un campo inválido
    // no se envía — se marca su error inline y se reintenta solo cuando el usuario lo corrija
    // (queda "changed" en el próximo flush porque no se actualiza lastSavedAnswersRef). Los
    // demás campos cambiados del mismo lote sí se guardan. required no se valida acá (no
    // bloquea el autosave, solo bloquea salir de edición en handleDoneEditing).
    const invalidErrors: Record<string, string> = {};
    const valid = changed.filter((f) => {
      const err = validateFormFieldValue(f, currentAnswers[f.id]);
      if (!err) return true;
      invalidErrors[f.id] = t(`form.fill.${err.key}`, err.params);
      return false;
    });
    if (Object.keys(invalidErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...invalidErrors }));
    }
    if (valid.length === 0) return;

    const ids = valid.map((f) => f.id);
    ids.forEach((id) => inFlightIdsRef.current.add(id));
    setSavingFieldIds((prev) => new Set([...prev, ...ids]));
    // Sin toast de loading/success: el indicador inline por campo (spinner/check junto al
    // label, más abajo en el render) ya cubre ese feedback sin taparse con botones del wizard
    // (p.ej. "Siguiente", misma esquina bottom-right donde aparecen los toasts de sonner).
    const toastId = `form-autosave-${sectionExecutionId}`;
    const values = valid.map((f) => ({ id: f.id, value: currentAnswers[f.id] ?? null }));
    updateSectionFormValues(sectionExecutionId, values, organizationId)
      .then((payload) => {
        for (const f of valid) lastSavedAnswersRef.current[f.id] = currentAnswers[f.id];

        setSavedFieldIds((prev) => new Set([...prev, ...ids]));
        ids.forEach((id) => {
          clearTimeout(savedTimeoutsRef.current[id]);
          savedTimeoutsRef.current[id] = setTimeout(() => {
            setSavedFieldIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            delete savedTimeoutsRef.current[id];
          }, 1500);
        });

        // review_status sigue el estado real de los obligatorios de ESTA sección tras el
        // guardado. Se usa el payload (form_fields con is_visible/can_answer recalculados
        // por el backend), no sortedFields (snapshot previo a este PATCH) — único árbitro
        // de qué campos siguen vigentes tras dependencias condicionales. Si el backend no
        // trajo esta sección en la respuesta, no se toca acá (queda para la reconciliación
        // contra advance_blockers al próximo /content).
        //
        // onUpdate (dispara applyFormValuesPatch, que puede invalidar /content) se llama
        // DESPUÉS de que el PATCH /review_status resuelva: si el refetch de /content sale
        // antes de que este PATCH se persista, vuelve con el review_status viejo y pisa el
        // parche optimista — la raíz del bug de PATCHes duplicados/estado desalineado.
        const freshFields = payload?.find((s) => s.section_execution_id === sectionExecutionId)?.form_fields;
        if (freshFields) {
          // Se mezclan los flags de sección conocidos por el padre (can_edit/is_visible/
          // can_answer) — sin ellos, computeSectionStats no puede aplicar el corte de
          // "sección inactiva o sin permiso" y podría marcar 'finished' una sección cuyos
          // obligatorios están todos inactivos. Ver doc de `sectionFlags` arriba.
          const { missingRequired } = computeSectionStats({
            ...sectionFlags,
            form_fields: freshFields,
          } as ContentSection);
          syncReviewStatus(missingRequired === 0 ? "finished" : "editing").finally(() => onUpdate?.(payload));
        } else {
          onUpdate?.(payload);
        }
      })
      .catch((error) => {
        // Best-effort: si falla, se reintenta en el próximo flush o al guardar con el botón.
        toast.error(t("form.fill.autoSaveError"), { id: toastId });
        invalidateContentOnPermissionDenied(error);
      })
      .finally(() => {
        ids.forEach((id) => inFlightIdsRef.current.delete(id));
        setSavingFieldIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      });
  }, [onUpdate, organizationId, sectionExecutionId, sectionFlags, sortedFields, t, invalidateContentOnPermissionDenied, syncReviewStatus]);

  const clearAutosaveTimers = useCallback(() => {
    if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
    if (idleAutosaveTimeoutRef.current) clearTimeout(idleAutosaveTimeoutRef.current);
    commitTimeoutRef.current = null;
    idleAutosaveTimeoutRef.current = null;
  }, []);

  // Red de seguridad: si el usuario sigue escribiendo un campo de texto libre sin salir de
  // él por más de IDLE_AUTOSAVE_MS, igual se guarda — evita perder trabajo largo antes de un
  // blur o un cierre de página.
  useEffect(() => {
    if (!editing) return;
    const hasFreeTextDirty = sortedFields.some(
      (f) =>
        isFieldAnswerable(f) &&
        isFreeTextField(f) &&
        !valuesEqual(answers[f.id], lastSavedAnswersRef.current[f.id]),
    );
    if (!hasFreeTextDirty) return;

    if (idleAutosaveTimeoutRef.current) clearTimeout(idleAutosaveTimeoutRef.current);
    idleAutosaveTimeoutRef.current = setTimeout(() => {
      flushDirtyFields();
    }, IDLE_AUTOSAVE_MS);
    return () => {
      if (idleAutosaveTimeoutRef.current) clearTimeout(idleAutosaveTimeoutRef.current);
    };
  }, [answers, editing, flushDirtyFields, sortedFields]);

  // Flush best-effort al abandonar la pestaña/ventana con un campo aún enfocado (blur nunca
  // llega si el usuario cierra o cambia de app).
  useEffect(() => {
    if (!editing) return;
    const handlePageHide = () => flushDirtyFields();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushDirtyFields();
    };
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [editing, flushDirtyFields]);

  // flushDirtyFields se recrea si cambian sus deps (sortedFields, onUpdate, etc.) — el ref
  // asegura que el flush de desmontaje de abajo siempre llame a la versión más reciente y no
  // quede colgado de la del primer render.
  const flushDirtyFieldsRef = useRef(flushDirtyFields);
  flushDirtyFieldsRef.current = flushDirtyFields;

  // Cancela timers pendientes y hace un último flush al desmontar (p.ej. el panel de
  // workflow desmonta la sección con key={currentSection.id} al cambiar de paso).
  useEffect(() => {
    return () => {
      clearAutosaveTimers();
      flushDirtyFieldsRef.current();
    };
  }, [clearAutosaveTimers]);

  const handleFieldBlur = (field: FormFieldValue) => (e: React.FocusEvent<HTMLDivElement>) => {
    // React onBlur == focusout: burbujea. Si el foco sigue dentro del mismo contenedor
    // (input → botón interno del widget) no es una salida real del campo.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    if (!isFreeTextField(field)) return;
    flushDirtyFields();
  };

  const setAnswer = (fieldId: string, value: unknown, opts?: { commit?: boolean }) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setFieldErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });

    // Widgets atómicos: un cambio ya es un valor completo (no hay "a medio escribir"), así
    // que se guarda por cambio en vez de esperar un blur — coalescido para no disparar un
    // PATCH por cada click de una selección múltiple rápida.
    if (opts?.commit) {
      if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
      commitTimeoutRef.current = setTimeout(() => {
        flushDirtyFields();
      }, COMMIT_DELAY_MS);
    }
  };

  // Metadatos a mostrar para un campo de archivo: la subida nueva (filePreviews, con
  // nombre/mime reales) o solo la URL original del backend (recarga de página — el
  // backend únicamente resuelve el token a una URL firmada, sin metadatos del archivo).
  const fileDisplayMeta = (field: FormFieldValue): { url: string; name?: string; contentType?: string } | null => {
    const preview = filePreviews[field.id];
    if (preview) return preview;
    const v = answers[field.id];
    if (typeof v === "string" && v.startsWith("http")) return { url: v };
    return null;
  };

  // El backend deja el placeholder {{MEDIA:...}} sin resolver cuando el media fue borrado
  // o el usuario no tiene acceso (en vez de fallar todo /content). No confundir con una subida
  // recién hecha en este mismo render: esa siempre tiene un filePreview en paralelo.
  const isBrokenFileField = (field: FormFieldValue): boolean =>
    !filePreviews[field.id] && isMediaToken(answers[field.id]);

  // Sale del modo edición. La mayoría de los valores ya quedan persistidos por el
  // auto-guardado (al blur de un campo de texto, al cambiar un widget atómico, o por la red
  // de seguridad de inactividad); acá se cancelan esos timers y se hace un flush autoritativo
  // de lo que pudiera seguir pendiente (por ej. si el usuario sale justo después de tipear,
  // sin llegar a disparar un blur). Antes de salir, bloquea si queda algún obligatorio sin
  // responder o algún valor con error de formato/rango — al ser obligatorio debe
  // contestarse sí o sí. Si todo pasa, marca review_status='finished' (estado puramente
  // visual): el usuario terminó de responder, sea desde assets ("Dejar de editar") o desde
  // el wizard de workflow ("Siguiente"/"Finalizar"), ambos disparan este mismo handler.
  const finishAndExit = async () => {
    // syncReviewStatus dedupe: si el autoguardado ya dejó la sección en 'finished'
    // (lastSentTargetRef/reviewStatusRef), esto no repite el PATCH.
    await syncReviewStatus("finished", { notifyErrors: true });
    onExitEditing();
  };

  const handleDoneEditing = async () => {
    clearAutosaveTimers();

    if (uploadingFields.size > 0) {
      toast.error(t("form.fill.fileUploading_block"));
      return;
    }

    const missing = sortedFields.filter(
      (f) => isFieldAnswerable(f) && f.required && !hasAnswer(answers[f.id]),
    );
    const invalidErrors: Record<string, string> = {};
    for (const f of sortedFields) {
      if (!isFieldAnswerable(f)) continue;
      const err = validateFormFieldValue(f, answers[f.id]);
      if (err) invalidErrors[f.id] = t(`form.fill.${err.key}`, err.params);
    }
    if (missing.length > 0 || Object.keys(invalidErrors).length > 0) {
      setFieldErrors((prev) => ({
        ...prev,
        ...invalidErrors,
        ...Object.fromEntries(missing.map((f) => [f.id, t("form.fill.fieldRequired")])),
      }));
      toast.error(t("form.fill.requiredFieldsPending"));
      // Salta al primer campo con error (respeta el orden de sortedFields, no el de detección).
      const firstErrorId = sortedFields.find((f) => invalidErrors[f.id] || missing.some((m) => m.id === f.id))?.id;
      if (firstErrorId) {
        fieldNodesRef.current.get(firstErrorId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const changed = sortedFields.filter(
      (f) => isFieldAnswerable(f) && !valuesEqual(answers[f.id], lastSavedAnswersRef.current[f.id]),
    );
    if (changed.length === 0) {
      await finishAndExit();
      return;
    }

    setIsSaving(true);
    let payload: FormValuesSectionPayload[] | undefined;
    try {
      const values = changed.map((f) => ({ id: f.id, value: answers[f.id] ?? null }));
      payload = await updateSectionFormValues(sectionExecutionId, values, organizationId);
      for (const f of changed) lastSavedAnswersRef.current[f.id] = answers[f.id];
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("form.fill.saveError") });
      invalidateContentOnPermissionDenied(error);
      return;
    } finally {
      setIsSaving(false);
    }
    // Ya se validó arriba que no queda ningún obligatorio pendiente: el target siempre
    // es 'finished' acá. syncReviewStatus antes de onUpdate — mismo motivo que en
    // flushDirtyFields: onUpdate puede disparar un refetch de /content, y si sale antes
    // de que este PATCH se persista, vuelve con el review_status viejo y pisa el parche
    // optimista (raíz del bug de PATCHes duplicados/estado desalineado).
    await syncReviewStatus("finished", { notifyErrors: true });
    onUpdate?.(payload!);
    onExitEditing();
  };

  // El padre (barra de acciones de assets-section.tsx) dispara "Dejar de editar" a través de esta ref.
  useImperativeHandle(ref, () => ({ exit: handleDoneEditing }), [handleDoneEditing]);

  if (sortedFields.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
        {t("form.fill.emptyForm")}
      </div>
    );
  }

  // ── Render de un input editable según el tipo de pregunta ──────────────────
  // opts.disabled: campo activo (is_visible) pero no respondible (can_answer=false por
  // show_when_inactive) — se muestra el input real deshabilitado, no un texto de solo lectura.
  // El mapeo question_type/data_type → widget vive en HuemulQuestionInput (único, compartido
  // con la entrada de valor de custom fields) — acá solo se resuelven placeholders de i18n
  // y los dos casos que no delega: carga de archivos (upload propio) y custom_field (solo lectura).
  const renderInput = (field: FormFieldValue, opts?: { disabled?: boolean }) => {
    const cfg = readFieldConfig(field);
    const value = answers[field.id];
    const error = fieldErrors[field.id];
    const disabled = opts?.disabled;

    switch (field.question_type) {
      case QUESTION_TYPE.fileUpload: {
        const fileCfg = readFieldConfig(field);
        const accept = fileCfg.allowed_types?.map((ext) => `.${ext}`).join(", ");
        const isUploading = uploadingFields.has(field.id);

        const handleFileChange = async (files: FileList | null) => {
          if (!files || files.length === 0) return;
          const file = files[0];

          if (fileCfg.allowed_types?.length) {
            const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
            if (!fileCfg.allowed_types.includes(ext)) {
              setFieldErrors((prev) => ({
                ...prev,
                [field.id]: t("form.fill.fileTypeNotAllowed", { types: fileCfg.allowed_types!.join(", ") }),
              }));
              return;
            }
          }

          if (fileCfg.max_size_mb) {
            const sizeMb = file.size / (1024 * 1024);
            if (sizeMb > fileCfg.max_size_mb) {
              setFieldErrors((prev) => ({
                ...prev,
                [field.id]: t("form.fill.fileTooLarge", { max: fileCfg.max_size_mb }),
              }));
              return;
            }
          }

          setFieldErrors((prev) => { const next = { ...prev }; delete next[field.id]; return next; });
          setUploadingFields((prev) => new Set([...prev, field.id]));

          try {
            const media = await uploadMedia(organizationId!, {
              file,
              level: "document",
              parent_id: documentId,
            });
            setAnswer(field.id, `{{MEDIA:${media.id}}}`, { commit: true });
            setFilePreviews((prev) => ({
              ...prev,
              [field.id]: {
                url: media.current_version?.download_url ?? "",
                name: file.name,
                contentType: media.current_version?.content_type ?? file.type,
              },
            }));
          } catch {
            setFieldErrors((prev) => ({ ...prev, [field.id]: t("form.fill.fileUploadError") }));
          } finally {
            setUploadingFields((prev) => { const next = new Set(prev); next.delete(field.id); return next; });
          }
        };

        const currentMeta = fileDisplayMeta(field);
        const isBroken = isBrokenFileField(field);

        return (
          <div className="space-y-1.5">
            {isBroken ? (
              <p className="flex items-center gap-1.5 text-sm italic text-gray-400">
                <FileX className="h-3.5 w-3.5" />
                {t("form.fill.fileUnavailable")}
              </p>
            ) : currentMeta && (
              <HuemulFilePreview
                url={currentMeta.url}
                fileName={currentMeta.name}
                contentType={currentMeta.contentType}
                alt={field.field_name}
                downloadLabel={t("form.fill.fileDownload")}
              />
            )}
            <HuemulField
              type="file"
              label=""
              accept={accept}
              disabled={isUploading || disabled}
              onFileChange={handleFileChange}
              error={error}
            />
            {isUploading && (
              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("form.fill.fileUploading")}
              </p>
            )}
          </div>
        );
      }

      case CUSTOM_FIELD_QUESTION_TYPE:
        // Solo lectura: el valor se gestiona en los custom fields del documento
        return <FormFieldAnswerValue field={field} value={value} filePreview={filePreviews[field.id]} />;

      default:
        return (
          <HuemulQuestionInput
            questionType={field.question_type}
            dataType={field.data_type}
            placeholder={getQuestionTypePlaceholder(field.question_type, t)}
            value={value as HuemulQuestionInputValue}
            onChange={(v) => setAnswer(field.id, v, { commit: !isFreeTextField(field) })}
            options={readFieldOptions(field)}
            min={typeof field.min_value === "number" ? field.min_value : undefined}
            max={typeof field.max_value === "number" ? field.max_value : undefined}
            minLabel={cfg.min_label}
            maxLabel={cfg.max_label}
            error={error}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="w-full">
      {editing && !autoSaveHintDismissed && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{t("form.fill.autoSaveHint")}</span>
          <button
            type="button"
            onClick={() => setAutoSaveHintDismissed(true)}
            aria-label={t("common:close")}
            className="shrink-0 text-amber-700/70 hover:text-amber-900 hover:cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="space-y-5">
        {displayedFields.map((field, index) => {
          const isExiting = exitingFieldIds.has(field.id);

          // Etiqueta: separador visual de sub-sección, no es una pregunta — no lleva
          // label/badge/input, solo el título con línea divisoria.
          if (field.question_type === QUESTION_TYPE.label) {
            return (
              <div
                key={field.id || index}
                className={cn(
                  isExiting
                    ? "pointer-events-none animate-out fade-out slide-out-to-top-2 duration-200"
                    : "animate-in fade-in slide-in-from-top-2 duration-300",
                )}
              >
                <SectionFieldSeparator name={field.field_name} />
              </div>
            );
          }

          const typeHint = questionTypeLabel(field.question_type ?? "", t);
          // Campo cuya respuesta puede mostrar/ocultar otras preguntas (referenciado en algún depends_on).
          const isTriggerField =
            editing && !!field.field_id && triggerFieldIds.has(field.field_id) && isFieldAnswerable(field);
          const isEditableField = editing && isFieldAnswerable(field);
          return (
            <div
              key={field.id || index}
              ref={(node) => {
                if (node) fieldNodesRef.current.set(field.id, node);
                else fieldNodesRef.current.delete(field.id);
              }}
              className={cn(
                "space-y-2",
                isExiting
                  ? "pointer-events-none animate-out fade-out slide-out-to-top-2 duration-200"
                  : "animate-in fade-in slide-in-from-top-2 duration-300",
              )}
              onBlur={isEditableField ? handleFieldBlur(field) : undefined}
            >
              <label className="flex items-baseline gap-1.5 text-sm font-semibold text-gray-900">
                <span>
                  {field.field_name}
                  {field.required && <span className="text-red-500"> *</span>}
                </span>
                {typeHint && <span className="text-xs font-normal text-gray-400">· {typeHint}</span>}
                {savingFieldIds.has(field.id) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 animate-in fade-in duration-200">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t("common:saving")}
                  </span>
                )}
                {!savingFieldIds.has(field.id) && savedFieldIds.has(field.id) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 animate-in fade-in duration-200">
                    <Check className="h-3 w-3" />
                    {t("form.fill.savedField")}
                  </span>
                )}
              </label>
              {isEditableField
                ? renderInput(field)
                : editing && isFieldVisible(field) && field.question_type !== CUSTOM_FIELD_QUESTION_TYPE
                  ? renderInput(field, { disabled: true })
                  : <FormFieldAnswerValue field={field} value={answers[field.id]} filePreview={filePreviews[field.id]} />}
              {isTriggerField && (
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  <Info className="h-3 w-3 shrink-0" />
                  {t("form.fill.triggerHint")}
                </p>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
});

// Badge de estado (Pendiente / Respondido) usado en el header de la sección.
export function FormStatusBadge({ status }: { status?: string }) {
  const { t } = useTranslation("sections");
  const answered = !!status && status !== "pending";
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-normal",
        answered ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
      )}
    >
      {answered ? t("form.fill.statusResponded") : t("form.fill.statusPending")}
    </Badge>
  );
}
