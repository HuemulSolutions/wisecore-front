interface WisecoreLogoProps extends React.ComponentProps<"img"> {
  size?: "sm" | "md" | "lg"
}

export function WisecoreLogo({ size = "md", className, ...props }: WisecoreLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto", 
    lg: "h-12 w-auto"
  }

  return (
    <img
      src="/assets/wisecore-logo.png"
      alt="Wisecore"
      className={`${sizeClasses[size]} ${className || ""}`}
      {...props}
    />
  )
}