import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAccessLevels } from '@/services/access-levels'
import { usePageAccess } from '@/hooks/usePageAccess'
import type { FrontendPermissions, LifecyclePermissions, LifecycleStatus } from '@/types/assets'

/**
 * Hook para obtener los niveles de acceso disponibles
 */
export function useAccessLevels() {
  return useQuery({
    queryKey: ['access-levels'],
    queryFn: getAccessLevels,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  })
}

/**
 * Hook utilitario para validar access levels de un documento
 */
export function useDocumentAccess(documentAccessLevels?: string[]) {
  const result = {
    canRead: documentAccessLevels?.includes('read') ?? false,
    canEdit: documentAccessLevels?.includes('edit') ?? false,
    canCreate: documentAccessLevels?.includes('create') ?? false,
    canDelete: documentAccessLevels?.includes('delete') ?? false,
    canApprove: documentAccessLevels?.includes('approve') ?? false,
    
    // Función para validar un access level específico
    hasAccess: (accessLevel: string) => documentAccessLevels?.includes(accessLevel) ?? false,
    
    // Función para validar múltiples access levels (debe tener al menos uno)
    hasAnyAccess: (accessLevels: string[]) => 
      accessLevels.some(level => documentAccessLevels?.includes(level)) ?? false,
    
    // Función para validar múltiples access levels (debe tener todos)
    hasAllAccess: (accessLevels: string[]) => 
      accessLevels.every(level => documentAccessLevels?.includes(level)) ?? false,
    
    // Función para verificar si el usuario puede leer el documento
    // Retorna true si tiene al menos uno de: read, edit, create, approve
    canReadDocument: () => 
      documentAccessLevels?.some(level => 
        ['read', 'edit', 'create', 'approve'].includes(level)
      ) ?? false
  }
  
  return result
}

/**
 * Función helper para verificar si un array de access levels permite lectura
 * Útil para usar fuera del contexto de un hook de React
 */
export function canReadDocument(accessLevels?: string[]): boolean {
  return accessLevels?.some(level => 
    ['read', 'edit', 'create', 'approve'].includes(level)
  ) ?? false
}

/** Maps a document access level string to its lifecycle permission key */
function toLifecycleKey(access: string): keyof LifecyclePermissions | null {
  switch (access) {
    case 'create':  return 'create'
    case 'edit':    return 'edit'
    case 'read':    return 'view'
    case 'view':    return 'view'
    case 'approve': return 'approve'
    case 'review':  return 'review'
    case 'publish': return 'publish'
    case 'archive': return 'archive'
    default:        return null // e.g. "delete" has no lifecycle equivalent → no restriction
  }
}

/**
 * Returns true if the lifecycle permissions allow the given access level.
 * If there is no lifecycle equivalent for the access level (e.g. "delete"), it returns true.
 *
 * CONTRATO (no cambiar a fail-closed): `permissions === undefined` significa
 * "el lifecycle no impone restricción", NO "está permitido". Un asset cuyo
 * asset type no tiene lifecycle configurado vuelve legítimamente sin
 * `lifecycle_permissions`; con fail-closed todo editor con permisos correctos
 * perdería los botones en silencio. El piso de seguridad lo pone RBAC: el
 * cruce lifecycle × RBAC vive en `computeFrontendPermissions`, así que sin
 * lifecycle la affordance degrada a "solo RBAC decide" en vez de "permitir
 * todo". Ver ia context/rbac-audit-guide.md (pasada de /asset).
 */
export function lifecycleAllows(
  permissions: LifecyclePermissions | undefined,
  access: string
): boolean {
  if (!permissions) return true
  const key = toLifecycleKey(access)
  if (!key) return true
  return permissions[key] === true
}

/**
 * ¿La etapa actual del documento admite responder formularios / editar contenido?
 * Solo `edit`: `lifecycle_permissions.edit` es un permiso de ROL, no de etapa —
 * el actor de un grupo de elaboración que además es revisor o aprobador lo sigue
 * recibiendo en `true` durante `in_review` / `in_approval`, y sin este chequeo
 * los campos quedaban editables ahí aunque el PATCH no fuera a persistir.
 *
 * `status === undefined` ⇒ `true`, mismo contrato fail-open que `lifecycleAllows`:
 * un asset type sin lifecycle configurado vuelve legítimamente sin
 * `lifecycle_status` y no debe perder la edición en silencio. El piso lo pone RBAC.
 */
export function lifecycleStageAllowsEditing(status: LifecycleStatus | undefined): boolean {
  if (!status) return true
  return status.stage === 'edit'
}

/**
 * Hook utilitario para validar lifecycle permissions de un documento.
 */
export function useLifecyclePermissions(permissions?: LifecyclePermissions) {
  return {
    canView:    permissions?.view    ?? false,
    canCreate:  permissions?.create  ?? false,
    canEdit:    permissions?.edit    ?? false,
    canReview:  permissions?.review  ?? false,
    canApprove: permissions?.approve ?? false,
    canPublish: permissions?.publish ?? false,
    canArchive: permissions?.archive ?? false,

    /** True if the lifecycle allows the given access (e.g. "edit", "create", "approve") */
    hasLifecycleAccess: (access: string) => lifecycleAllows(permissions, access),

    /** True if the lifecycle allows ANY of the given access levels */
    hasAnyLifecycleAccess: (accesses: string[]) =>
      accesses.some(a => lifecycleAllows(permissions, a)),

    /** True if the lifecycle allows ALL of the given access levels */
    hasAllLifecycleAccess: (accesses: string[]) =>
      accesses.every(a => lifecycleAllows(permissions, a)),
  }
}

/**
 * Capacidades RBAC globales que se cruzan con el lifecycle del documento.
 *
 * Granularidad GRUESA a propósito: el eje RBAC es `asset:*` y no
 * `section_execution:*` / `version:*` / `custom_fields:*`. Cierra el hueco real
 * (mutar contenido sin ningún permiso de escritura, apoyándose solo en un grant
 * de lifecycle) sin depender de que los roles ya existentes tuvieran modelados
 * los sub-recursos. La tabla fina queda documentada como paso 2 en
 * ia context/rbac-audit-guide.md.
 */
export interface AssetRbacCaps {
  /** asset:r | asset:l */
  readAsset: boolean
  /** asset:u — editar secciones, formularios, autosave, IA, review status */
  updateAssetContent: boolean
  /** asset:c — crear ejecución, clonar versión / a nuevo documento */
  createVersion: boolean
  /** asset:d — borrar versión y borrar documento */
  deleteVersion: boolean
  /** asset:r — exportar (markdown / word / excel / json) */
  exportVersion: boolean
}

/**
 * Computes high-level frontend permissions by crossing lifecycle_permissions
 * with the user's global RBAC capabilities.
 *
 * Regla: `affordanceVisible = lifecycleAllows && rbacAllows` (AND). Son dos ejes
 * ortogonales — el lifecycle contesta "¿sos el editor/revisor DE ESTE
 * documento?" y RBAC contesta "¿tu rol en esta organización te permite esta
 * acción EN ABSOLUTO?". Ninguno implica al otro.
 *
 * `rbac` es un parámetro OBLIGATORIO a propósito: así cualquier call-site futuro
 * que se olvide de cruzar RBAC rompe el build en vez de reabrir el hueco en
 * silencio (mismo criterio que el punto 9 del checklist de la guía de auditoría:
 * un default permisivo es indistinguible de "todavía no lo gatearon").
 */
export function computeFrontendPermissions(
  permissions: LifecyclePermissions | undefined,
  status: LifecycleStatus | undefined,
  rbac: AssetRbacCaps,
): FrontendPermissions {
  const hasCreate = permissions?.create === true
  const hasEdit = permissions?.edit === true
  const hasReview = permissions?.review === true
  const hasApprove = permissions?.approve === true
  const hasPublish = permissions?.publish === true
  const hasArchive = permissions?.archive === true
  const isEditStage = status?.stage === 'edit'

  return {
    canEditSections: (hasCreate || hasEdit) && isEditStage && rbac.updateAssetContent,
    canAccessSectionSheet:
      (hasCreate || hasEdit || hasReview || hasApprove || hasPublish) && rbac.updateAssetContent,
    canExecuteAI: (hasCreate || hasEdit) && rbac.updateAssetContent,
    canReviewContent: hasReview && rbac.updateAssetContent,
    canApproveContent: hasApprove && rbac.updateAssetContent,
    canPublishContent: hasPublish && rbac.updateAssetContent,
    canArchiveContent: hasArchive && rbac.updateAssetContent,
  }
}

/**
 * Única fuente de verdad de los permisos del panel derecho de /asset.
 *
 * Arma las capacidades RBAC desde la matriz declarativa (`RBAC_PAGES.asset`) y
 * las cruza con el lifecycle del documento. Absorbe además las tres
 * derivaciones que antes vivían sueltas en assets-content.tsx
 * (`canViewContent`, `isViewOnly`, `canSwitchToEditorMode`), que eran justo los
 * tres puntos donde cada una decidía su propia política de fail-open.
 */
export function useAssetContentPermissions(
  lifecyclePermissions?: LifecyclePermissions,
  lifecycleStatus?: LifecycleStatus,
) {
  const { can } = usePageAccess('asset')

  const rbac = useMemo<AssetRbacCaps>(
    () => ({
      readAsset: can('readAsset'),
      updateAssetContent: can('updateAssetContent'),
      createVersion: can('createVersion'),
      deleteVersion: can('deleteVersion'),
      exportVersion: can('exportVersion'),
    }),
    [can]
  )

  const frontendPermissions = useMemo<FrontendPermissions>(
    () => computeFrontendPermissions(lifecyclePermissions, lifecycleStatus, rbac),
    [lifecyclePermissions, lifecycleStatus, rbac]
  )

  /** Ver el contenido del asset: RBAC de lectura Y algún rol de lifecycle. */
  const canViewContent = useMemo(() => {
    if (!rbac.readAsset) return false
    if (!lifecyclePermissions) return true
    return (
      lifecyclePermissions.view ||
      lifecyclePermissions.create ||
      lifecyclePermissions.edit ||
      lifecyclePermissions.review ||
      lifecyclePermissions.approve ||
      lifecyclePermissions.publish ||
      lifecyclePermissions.archive
    )
  }, [lifecyclePermissions, rbac.readAsset])

  /**
   * Solo lectura si CUALQUIERA de los dos ejes lo dice (OR): sin capacidad de
   * escritura en RBAC, o sin ningún rol de escritura en el lifecycle.
   */
  const isViewOnly = useMemo(() => {
    const hasAnyRbacWrite =
      rbac.updateAssetContent || rbac.createVersion || rbac.deleteVersion
    if (!hasAnyRbacWrite) return true
    if (!lifecyclePermissions) return false
    return (
      !lifecyclePermissions.create &&
      !lifecyclePermissions.edit &&
      !lifecyclePermissions.review &&
      !lifecyclePermissions.approve &&
      !lifecyclePermissions.publish &&
      !lifecyclePermissions.archive
    )
  }, [lifecyclePermissions, rbac])

  /** Toggle lector/editor: solo en stage "edit" con create/edit y asset:u. */
  const canSwitchToEditorMode = useMemo(() => {
    const isEditStage = lifecycleStatus?.stage === 'edit'
    return (
      isEditStage &&
      rbac.updateAssetContent &&
      !!(lifecyclePermissions?.create || lifecyclePermissions?.edit)
    )
  }, [lifecyclePermissions, lifecycleStatus?.stage, rbac.updateAssetContent])

  return { frontendPermissions, rbac, canViewContent, isViewOnly, canSwitchToEditorMode }
}