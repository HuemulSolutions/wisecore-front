import { useState } from "react"
import { useMutation } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { WisecoreLogo } from "@/components/ui/wisecore-logo"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authService } from "@/services/auth"
import { useAuth } from "@/contexts/auth-context"
import packageJson from "../../../package.json"

interface SignupFormProps extends React.ComponentProps<"div"> {
  onSwitchToLogin?: () => void
  onSuccess?: () => void
}

export function SignupForm({
  className,
  onSwitchToLogin,
  onSuccess,
  ...props
}: SignupFormProps) {
  const [step, setStep] = useState<'email' | 'details'>('email')
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [code, setCode] = useState("")
  const { login } = useAuth()

  const requestCodeMutation = useMutation({
    mutationFn: (email: string) =>
      authService.requestCode({ email, purpose: "signup" }),
    onSuccess: () => {
      setStep('details')
    },
    onError: (error) => {
      console.error("Request code error:", error)
    },
  })

  const createUserMutation = useMutation({
    mutationFn: () =>
      authService.createUser({ email, name, last_name: lastName, code }),
    onSuccess: (data) => {
      login(data.token, data.user)
      onSuccess?.()
    },
    onError: (error) => {
      console.error("Create user error:", error)
    },
  })

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      requestCodeMutation.mutate(email)
    }
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && lastName && code) {
      createUserMutation.mutate()
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {step === 'email' ? (
        <form onSubmit={handleEmailSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-4 text-center">
              <WisecoreLogo size="lg" className="text-[#4464f7]" />
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <FieldDescription className="text-gray-600">
                Already have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onSwitchToLogin?.()
                  }}
                  className="hover:cursor-pointer text-[#4464f7] hover:text-[#3451e6] font-medium transition-colors"
                >
                  Sign in
                </a>
              </FieldDescription>
            </div>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field>
              <Button
                type="submit"
                disabled={requestCodeMutation.isPending}
                className="w-full bg-[#4464f7] hover:bg-[#3451e6] text-white hover:cursor-pointer font-medium py-2.5 transition-colors"
              >
                {requestCodeMutation.isPending ? "Sending code..." : "Send Verification Code"}
              </Button>
            </Field>
            {requestCodeMutation.error && (
              <FieldDescription className="text-red-600 text-center">
                {requestCodeMutation.error.message}
              </FieldDescription>
            )}
          </FieldGroup>
        </form>
      ) : (
        <form onSubmit={handleDetailsSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-4 text-center">
              <WisecoreLogo size="lg" className="text-[#4464f7]" />
              <h1 className="text-2xl font-bold text-gray-900">Complete your registration</h1>
              <FieldDescription className="text-gray-600">
                We've sent a verification code to <strong>{email}</strong>
              </FieldDescription>
            </div>
            <Field>
              <FieldLabel htmlFor="name">First Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="code">Verification Code</FieldLabel>
              <Input
                id="code"
                type="text"
                placeholder="Enter the code from your email"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </Field>
            <Field>
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
                className="w-full bg-[#4464f7] hover:bg-[#3451e6] text-white hover:cursor-pointer font-medium py-2.5 transition-colors"
              >
                {createUserMutation.isPending ? "Creating account..." : "Create Account"}
              </Button>
            </Field>
            <Field>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('email')}
                className="w-full hover:cursor-pointer"
              >
                Back to email
              </Button>
            </Field>
            {createUserMutation.error && (
              <FieldDescription className="text-red-600 text-center">
                {createUserMutation.error.message}
              </FieldDescription>
            )}
          </FieldGroup>
        </form>
      )}
      <FieldDescription className="px-6 text-center text-sm text-gray-500">
        By clicking continue, you agree to our{" "}
        <a href="#" className="text-[#4464f7] hover:text-[#3451e6] hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-[#4464f7] hover:text-[#3451e6] hover:underline">
          Privacy Policy
        </a>.
      </FieldDescription>
      <div className="text-center text-xs text-gray-400">
        Version {packageJson.version}
      </div>
    </div>
  )
}
