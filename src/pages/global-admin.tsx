"use client"

import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { GlobalAdminOrganizationsSection, GlobalAdminUsersSection } from "@/components/global-admin"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"

export default function GlobalAdminPage() {
  const { t } = useTranslation('global-admin')

  return (
    <HuemulPageLayout
      header={
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
      }
      headerClassName="p-6 md:p-8 pb-0 md:pb-0"
      columns={[
        {
          content: (
            <Tabs defaultValue="organizations" className="w-full flex-1 min-h-0">
              <TabsList className="shrink-0">
                <TabsTrigger value="organizations">{t('tabs.organizations')}</TabsTrigger>
                <TabsTrigger value="users">{t('tabs.users')}</TabsTrigger>
              </TabsList>
              <TabsContent value="organizations" className="mt-4 min-h-0 flex flex-col">
                <GlobalAdminOrganizationsSection />
              </TabsContent>
              <TabsContent value="users" className="mt-4 min-h-0 flex flex-col">
                <GlobalAdminUsersSection />
              </TabsContent>
            </Tabs>
          ),
          className: "p-6 md:p-8 pt-0 md:pt-0",
        },
      ]}
    />
  )
}
