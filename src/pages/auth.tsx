import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LoginForm } from "@/components/auth/auth-login-form"
import { OTPForm } from "@/components/auth/auth-otp-form"
import { useAuth } from "@/contexts/auth-context"

type AuthStep = 'login' | 'otp'

export function AuthPage() {
  const [step, setStep] = useState<AuthStep>('login')
  const [email, setEmail] = useState('')
  
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated.
  // If the user was redirected here due to a permission/session failure,
  // sessionStorage may hold the page they were on — send them back there.
  useEffect(() => {
    if (isAuthenticated) {
      const returnUrl = sessionStorage.getItem('returnUrl');
      if (returnUrl) {
        sessionStorage.removeItem('returnUrl');
        navigate(returnUrl, { replace: true });
      }
      // Don't navigate to '/' — ProtectedRoute renders the routes at the
      // current URL, preserving deep links automatically.
    }
  }, [isAuthenticated, navigate])

  const handleCodeRequested = (userEmail: string) => {
    setEmail(userEmail)
    setStep('otp')
  }

  const handleBackToForm = () => {
    setStep('login')
  }

  const handleAuthSuccess = () => {
    // The auth context will handle the redirect via the useEffect above
    console.log('Authentication successful')
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        {step === 'login' && (
          <LoginForm
            onCodeRequested={(email) => {
              handleCodeRequested(email)
            }}
          />
        )}
        {step === 'otp' && (
          <OTPForm
            email={email}
            purpose="login"
            onBack={handleBackToForm}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </div>
  )
}