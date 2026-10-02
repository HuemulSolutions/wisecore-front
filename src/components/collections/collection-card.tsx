"use client"

import { useTranslation } from "react-i18next"
import { Bot, BookOpen, Compass, Globe, Lock, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Collection } from "@/types/collections"

export interface CollectionCardProps {
  collection: Collection
  onOpen: (collection: Collection) => void
}

export function CollectionCard({ collection, onOpen }: CollectionCardProps) {
  const { t } = useTranslation("collections")
  const KindIcon = collection.agent_kind === "behavior" ? Compass : BookOpen

  return (
    <button
      type="button"
      onClick={() => onOpen(collection)}
      className={cn(
        "flex h-full flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
        "hover:cursor-pointer hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-base font-semibold">{collection.name}</h3>
        {collection.is_public ? (
          <Globe className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label={t("card.public")} />
        ) : (
          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label={t("card.private")} />
        )}
      </div>
      <p className={cn("line-clamp-3 flex-1 text-sm", collection.description ? "text-muted-foreground" : "italic text-muted-foreground/70")}>
        {collection.description || t("card.noDescription")}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {collection.for_agent ? (
          <>
            <Badge variant="secondary" className="gap-1">
              <Bot className="size-3" />
              {t("card.agent")}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <KindIcon className="size-3" />
              {collection.agent_kind === "behavior" ? t("card.behavior") : t("card.knowledge")}
            </Badge>
          </>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <Users className="size-3" />
            {t("card.human")}
          </Badge>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{t("card.items", { count: collection.item_count ?? 0 })}</span>
      </div>
    </button>
  )
}
