"use client"

import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { ShieldCheck } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { GlobalAdminOrganizationsSection, GlobalAdminUsersSection } from "@/components/global-admin"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useUrlTab } from "@/hooks/useUrlTab"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { PageSkeleton } from "@/components/ui/page-skeleton"

const GLOBAL_ADMIN_SECTIONS = ['organizations', 'users'] as const

// Mismo subrayado que los paneles de detalle (`UserDetailPanel` /
// `OrganizationDetailPanel`): el trigger base de shadcn es una pastilla sobre
// fondo gris, así que se neutraliza y el activo se marca con `border-b-primary`.
const SECTION_TAB_CLASS =
  "rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"

export default function GlobalAdminPage() {
  const { t } = useTranslation('global-admin')

  // Ruta técnica root-admin-only (no org-scoped): un solo eje de acceso para
  // toda la pantalla — quien entra puede gestionar todo. Ver rbac-matrix.ts.
  const { canAccessPage, isLoading: isLoadingPermissions } = usePageAccess('global-admin')

  // Espejo de useUrlTab en /users y /roles: la sección activa vive en la URL.
  // `param: 'section'` (no el default "tab"): cada sub-sección ya usa `?tab=`
  // para el panel de detalle propio (?organization=<id>&tab=details /
  // ?user=<id>&tab=profile) — reusar "tab" acá pisaría ese estado.
  const { tab: section } = useUrlTab({
    tabs: GLOBAL_ADMIN_SECTIONS,
    fallback: 'organizations',
    param: 'section',
  })
  const [, setSearchParams] = useSearchParams()

  // Al cambiar de sección se limpia el panel de detalle de la sección que se
  // abandona (`organization`/`user` + `tab`, compartido entre ambas) — si no,
  // queda un id de organización/usuario stale que reabre el panel equivocado
  // al volver a esa sección.
  const handleSectionChange = (next: typeof section) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.delete('organization')
      params.delete('user')
      params.delete('tab')
      params.set('section', next)
      return params
    }, { replace: true })
  }

  if (isLoadingPermissions) return <PageSkeleton />

  if (!canAccessPage) {
    return (
      <HuemulAccessDenied
        variant="inline"
        icon={ShieldCheck}
        description={t('accessDenied.description')}
      />
    )
  }

  return (
    // El switch de sección vive en el header de página (ver más abajo), así
    // que `Tabs` envuelve todo el layout en vez de vivir dentro de la
    // columna: el contexto de Radix conecta el `TabsList` del header con los
    // `TabsContent` de la columna igual.
    <Tabs
      value={section}
      onValueChange={(v) => handleSectionChange(v as typeof section)}
      className="flex h-full min-h-0 flex-col gap-0"
    >
      <HuemulPageLayout
        className="min-h-0 flex-1"
        header={
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="pb-4">
              <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('description')}
              </p>
            </div>
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger value="organizations" className={SECTION_TAB_CLASS}>{t('tabs.organizations')}</TabsTrigger>
              <TabsTrigger value="users" className={SECTION_TAB_CLASS}>{t('tabs.users')}</TabsTrigger>
            </TabsList>
          </div>
        }
        headerClassName="p-6 md:p-8 pb-0 md:pb-0"
        columns={[
          {
            content: (
              <>
                <TabsContent value="organizations" className="min-h-0 flex flex-col">
                  <GlobalAdminOrganizationsSection canManage={canAccessPage} />
                </TabsContent>
                <TabsContent value="users" className="min-h-0 flex flex-col">
                  <GlobalAdminUsersSection canManage={canAccessPage} />
                </TabsContent>
              </>
            ),
            className: "p-6 md:p-8",
          },
        ]}
      />
    </Tabs>
  )
}
