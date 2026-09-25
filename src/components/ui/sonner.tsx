import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          // Radix pone pointer-events: none en el body mientras hay un
          // dialog o sheet modal abierto. El toaster de sonner no portalea
          // ni declara pointer-events propio, así que el toast se ve pero
          // no se puede clickear. Redeclararlo acá lo hace hit-testable sin
          // tocar el resto de la pantalla.
          toast: "pointer-events-auto",
          // Acota altura del toast: el detalle completo del error vive en
          // el dialog, no acá (ver error-utils.ts).
          title: "line-clamp-2",
          description: "line-clamp-2",
          // El CSS de sonner pinta el botón de acción con --normal-bg/text,
          // que sobre un toast richColors da un bloque oscuro ilegible.
          // currentColor lo hace heredar el color de texto de la variante.
          actionButton:
            "!bg-transparent !text-current !border !border-current !h-7 !px-2.5 !font-medium hover:!opacity-70",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
