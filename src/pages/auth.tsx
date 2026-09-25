import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LoginForm } from "@/components/auth/auth-login-form"
import { OTPForm } from "@/components/auth/auth-otp-form"
import { AuthOrganizationPicker } from "@/components/auth/auth-organization-picker"
import { AuthSsoRedirect } from "@/components/auth/auth-sso-redirect"
import { useAuth } from "@/contexts/auth-context"
import { useLoginFlow } from "@/hooks/useLoginFlow"
import { logger } from "@/lib/logger"
import { consumeReturnUrl } from "@/lib/return-url"

/**
 * Página de login (docs/sso-frontend.md §2). Los pasos los decide `useLoginFlow`
 * a partir de lo que responde el backend: código de acceso (caso B), código de
 * verificación + selector de organización (caso C) o redirección al proveedor
 * de identidad (SSO). El usuario nunca elige el método de acceso.
 */
export function AuthPage({ initialEmail = '' }: { initialEmail?: string } = {}) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const flow = useLoginFlow({
    initialEmail,
    onCompleted: (result) => logger.log('Authentication successful', result),
  })

  // Redirect if already authenticated.
  // If the user was redirected here due to a permission/session failure,
  // sessionStorage may hold the page they were on — send them back there.
  useEffect(() => {
    if (isAuthenticated) {
      const returnUrl = consumeReturnUrl();
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
      }
      // Don't navigate to '/' — ProtectedRoute renders the routes at the
      // current URL, preserving deep links automatically.
    }
  }, [isAuthenticated, navigate])

  const { step } = flow

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        {step.kind === 'email' && (
          <LoginForm initialEmail={flow.email} onCodeRequested={flow.onCodeRequested} />
        )}
        {step.kind === 'otp' && (
          <OTPForm
            key={`${step.variant}:${step.email}`}
            email={step.email}
            variant={step.variant}
            onBack={flow.back}
            onVerified={flow.onVerified}
            onResend={step.resend}
          />
        )}
        {step.kind === 'choose-organization' && (
          <AuthOrganizationPicker
            preauthToken={step.preauthToken}
            organizations={step.organizations}
            onBack={flow.back}
            onSelected={(result, organization) =>
              flow.onOrganizationSelected(result, organization, step.preauthToken, step.email)
            }
          />
        )}
        {step.kind === 'sso-redirect' && (
          <AuthSsoRedirect sso={step.sso} onContinue={flow.retryIdpRedirect} onBack={flow.back} />
        )}
      </div>
    </div>
  )
}
