import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useGlobalPanel } from "@/contexts/global-panel-context"
import { useWisyAccess } from "@/hooks/useWisyAccess"
import { WisyPanel } from "@/components/chatbot/wisy-panel"

export function WisyToggle() {
  const { isOpen, togglePanel } = useGlobalPanel()
  const { canUseWisy } = useWisyAccess()

  const handleClick = () => {
    if (!canUseWisy) return
    togglePanel({ side: "right", content: <WisyPanel />, title: "Wisy", raw: true })
  }

  // Wisy lee assets y ejecuciones para armar el contexto de la conversación:
  // sin permiso de lectura sobre `asset` no se ofrece el punto de entrada.
  if (!canUseWisy) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 hover:cursor-pointer transition-colors ${
            isOpen ? "bg-accent text-primary" : ""
          }`}
          onClick={handleClick}
        >
          <Sparkles className="h-4 w-4" />
          <span className="sr-only">Wisy</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Wisy</p>
      </TooltipContent>
    </Tooltip>
  )
}
