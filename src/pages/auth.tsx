import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"
import { OTPForm } from "@/components/auth/otp-form"
import { useAuth } from "@/contexts/auth-context"

type AuthStep = 'login' | 'signup' | 'otp'

export function AuthPage() {
  const [step, setStep] = useState<AuthStep>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [purpose, setPurpose] = useState<'login' | 'signup'>('login')
  
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleCodeRequested = (userEmail: string, userUsername?: string) => {
    setEmail(userEmail)
    if (userUsername) {
      setUsername(userUsername)
    }
    setStep('otp')
  }

  const handleSwitchToSignup = () => {
    setPurpose('signup')
    setStep('signup')
  }

  const handleSwitchToLogin = () => {
    setPurpose('login')
    setStep('login')
  }

  const handleBackToForm = () => {
    setStep(purpose)
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
            onSwitchToSignup={handleSwitchToSignup}
            onCodeRequested={(email) => {
              setPurpose('login')
              handleCodeRequested(email)
            }}
          />
        )}
        {step === 'signup' && (
          <SignupForm
            onSwitchToLogin={handleSwitchToLogin}
            onCodeRequested={(email, username) => {
              setPurpose('signup')
              handleCodeRequested(email, username)
            }}
          />
        )}
        {step === 'otp' && (
          <OTPForm
            email={email}
            username={username}
            purpose={purpose}
            onBack={handleBackToForm}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </div>
  )
}