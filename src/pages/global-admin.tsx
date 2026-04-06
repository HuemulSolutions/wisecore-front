"use client"

import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { GlobalAdminOrganizationsSection, GlobalAdminUsersSection } from "@/components/global-admin"

export default function GlobalAdminPage() {
  const { t } = useTranslation('global-admin')

  return (
    <div className="h-full flex flex-col bg-background p-6 md:p-8 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 gap-6">
        <div className="shrink-0">
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
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
      </div>
    </div>
  )
}
