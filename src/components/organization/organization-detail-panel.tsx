"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Building2, Trash2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulPanelSaveBar } from "@/huemul/components/huemul-panel-save-bar"
import { formatDate } from "@/lib/utils"
import { OrganizationDetailDetailsTab } from "./organization-detail-details-tab"
import { OrganizationDetailUsersTab } from "./organization-detail-users-tab"
import type { Organization, OrganizationDetailTab, OrganizationDetailsFormApi } from "@/types/organizations"

/** Espejo de `RoleDetailPanelGuardApi` — ver ia context/sheet-footer-batch-save-guide.md. */
export interface OrganizationDetailPanelGuardApi {
  isDirty: boolean
  attemptNavigate: (proceed: () => void) => void
}

export interface OrganizationDetailPanelProps {
  /** `null` mientras no hay organización seleccionada o durante la animación de cierre del sheet. */
  organization: Organization | null
  open: boolean
  activeTab: OrganizationDetailTab
  onTabChange: (tab: OrganizationDetailTab) => void
  onClose: () => void
  onDeleteOrganization: () => void
  detailsForm: OrganizationDetailsFormApi
  canUpdate: boolean
  canDelete: boolean
  canListUsers: boolean
  canSetAdmin: boolean
  /** Root-admin-only: agrega/quita membership en el tab Usuarios (distinto de "Hacer admin"). */
  canManageMembers?: boolean
  /** Root-admin-only (`/global-admin`): límites de sistema en el tab Detalles. */
  canManageSystemLimits?: boolean
  onRegisterGuard?: (api: OrganizationDetailPanelGuardApi | null) => void
}

/** Panel de detalle de organización — espejo de `RoleDetailPanel` (Detalles · Usuarios). */
export function OrganizationDetailPanel({
  organization,
  open,
  activeTab,
  onTabChange,
  onClose,
  onDeleteOrganization,
  detailsForm,
  canUpdate,
  canDelete,
  canListUsers,
  canSetAdmin,
  canManageMembers = false,
  canManageSystemLimits = false,
  onRegisterGuard,
}: OrganizationDetailPanelProps) {
  const { t } = useTranslation(["organizations", "common"])

  const [discardGuardOpen, setDiscardGuardOpen] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)

  // El sheet se cierra vía animación (`open` pasa a `false`) mientras
  // `organization` ya puede ser `null` en el mismo render (ambos derivan de
  // la URL) — sin esto el contenido se vacía antes de que termine el slide-out.
  const [displayOrganization, setDisplayOrganization] = useState<Organization | null>(organization)
  useEffect(() => {
    if (organization) setDisplayOrganization(organization)
  }, [organization])

  const isDirty = detailsForm.isDirty

  const attemptNavigate = useCallback((proceed: () => void) => {
    if (!isDirty) {
      proceed()
      return
    }
    pendingActionRef.current = proceed
    setDiscardGuardOpen(true)
  }, [isDirty])

  useEffect(() => {
    onRegisterGuard?.({ isDirty, attemptNavigate })
    return () => onRegisterGuard?.(null)
  }, [isDirty, attemptNavigate, onRegisterGuard])

  const handleTabChange = (value: string) => {
    const tab = value as OrganizationDetailTab
    if (tab === activeTab) return
    attemptNavigate(() => onTabChange(tab))
  }

  const handleClose = () => attemptNavigate(onClose)

  if (!displayOrganization) return null

  const showDetailsSaveBar = activeTab === "details" && canUpdate && (detailsForm.isDirty || detailsForm.isSaving)

  const subtitle = [
    displayOrganization.description || null,
    displayOrganization.created_at ? t("detail.createdOn", { date: formatDate(new Date(displayOrganization.created_at)) }) : null,
  ].filter(Boolean).join(" · ")

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={(next) => { if (!next) handleClose() }}
        title={displayOrganization.name}
        size="lg"
        bodyClassName="flex flex-col overflow-hidden p-0"
        headerContent={
          <div className="flex shrink-0 items-center gap-3 border-b border-border p-4 pr-10">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <Building2 className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-foreground">{displayOrganization.name}</p>
              <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        }
        footerContent={
          <>
            {canDelete && !showDetailsSaveBar && (
              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border p-4">
                <HuemulButton
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  label={t("actions.deleteOrganization")}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onDeleteOrganization}
                />
              </div>
            )}

            {showDetailsSaveBar && (
              <div className="shrink-0 px-4 pb-4">
                <HuemulPanelSaveBar
                  isDirty={detailsForm.isDirty}
                  canSave={detailsForm.canSave}
                  isSaving={detailsForm.isSaving}
                  saveLabel={t("detail.saveChanges")}
                  discardLabel={t("detail.discardChanges")}
                  onSave={() => void detailsForm.save()}
                  onDiscard={() => detailsForm.discard()}
                />
              </div>
            )}
          </>
        }
      >
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="shrink-0 border-b border-border px-4 pt-2">
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {t("detail.tabDetails")}
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {t("detail.tabUsers")}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <TabsContent value="details" className="m-0 h-full">
              <OrganizationDetailDetailsTab
                organization={displayOrganization}
                form={detailsForm}
                canManageSystemLimits={canManageSystemLimits}
              />
            </TabsContent>
            <TabsContent value="users" className="m-0 h-full">
              <OrganizationDetailUsersTab
                organization={displayOrganization}
                canListUsers={canListUsers}
                canSetAdmin={canSetAdmin}
                canManageMembers={canManageMembers}
              />
            </TabsContent>
          </div>
        </Tabs>
      </HuemulSheet>

      <HuemulAlertDialog
        open={discardGuardOpen}
        onOpenChange={setDiscardGuardOpen}
        title={t("detail.discardTitle")}
        description={t("detail.discardDescription")}
        actionLabel={t("detail.discardChanges")}
        actionVariant="destructive"
        onAction={async () => {
          detailsForm.discard()
          pendingActionRef.current?.()
          pendingActionRef.current = null
        }}
      />
    </>
  )
}
