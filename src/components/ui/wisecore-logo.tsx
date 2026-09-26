interface WisecoreLogoProps extends React.ComponentProps<"img"> {
  size?: "sm" | "md" | "lg" | "xl"
  /**
   * `default`: logo histórico (index.html lo usa en preload y og:image).
   * `ai`: WISECORE.AI con letras oscuras, para fondos claros.
   * `ai-light`: WISECORE.AI con letras claras, para fondos oscuros.
   */
  variant?: "default" | "ai" | "ai-light"
}

const sizeClasses = {
  sm: "h-6 w-auto",
  md: "h-8 w-auto",
  lg: "h-12 w-auto",
  xl: "h-14 w-auto",
}

const variantSrc = {
  default: "/assets/wisecore-logo.png",
  ai: "/assets/login/wisecore-ai-logo.png",
  "ai-light": "/assets/login/wisecore-ai-logo-light.png",
}

export function WisecoreLogo({ size = "md", variant = "default", className, ...props }: WisecoreLogoProps) {
  return (
    <img
      src={variantSrc[variant]}
      alt="Wisecore"
      className={`${sizeClasses[size]} ${className || ""}`}
      {...props}
    />
  )
}
