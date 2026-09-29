import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"

/**
 * Cooldown de reenvío de un código de verificación (60 s). El primer código se
 * acaba de enviar cuando el formulario aparece, así que el cooldown arranca al montar:
 * un reenvío inmediato solo produciría el mismo código o un rate-limit del backend.
 *
 * Lo comparten el login (`OTPForm`) y el modo administrador (`RootElevationDialog`).
 */
export const RESEND_COOLDOWN_SECONDS = 60

export function useOtpResend<T>(onResend: () => Promise<T>) {
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  const resendMutation = useMutation({
    mutationFn: () => onResend(),
    onSuccess: () => {
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    },
  })

  // Cuenta atrás de 1s; al llegar a 0 también limpia el mensaje de éxito del
  // reenvío anterior (si no, "¡Código enviado!" queda visible indefinidamente).
  useEffect(() => {
    if (resendCooldown <= 0) return
    const interval = setInterval(() => {
      setResendCooldown((seconds) => {
        if (seconds <= 1) {
          resendMutation.reset()
          return 0
        }
        return seconds - 1
      })
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resendMutation es estable entre renders (react-query)
  }, [resendCooldown])

  const resend = () => {
    if (resendCooldown > 0 || resendMutation.isPending) return
    resendMutation.mutate()
  }

  return { resendCooldown, resendMutation, resend }
}
