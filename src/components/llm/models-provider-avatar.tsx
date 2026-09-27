import { cn } from "@/lib/utils"
import { providerInitials, providerTint } from "@/lib/llm-provider-ui"

interface ModelsProviderAvatarProps {
  /** Tipo del proveedor (`openai`, `azure_openai`…): de ahí salen iniciales y color. */
  type: string
  size?: "sm" | "md"
  className?: string
}

export function ModelsProviderAvatar({ type, size = "md", className }: ModelsProviderAvatarProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        size === "md" ? "size-8 text-[11px]" : "size-5.5 text-[9px]",
        providerTint(type),
        className,
      )}
    >
      {providerInitials(type)}
    </span>
  )
}
