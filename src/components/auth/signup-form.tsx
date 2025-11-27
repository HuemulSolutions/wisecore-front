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

interface SignupFormProps extends React.ComponentProps<"div"> {
  onSwitchToLogin?: () => void
  onCodeRequested?: (email: string, username: string) => void
}

export function SignupForm({
  className,
  onSwitchToLogin,
  onCodeRequested,
  ...props
}: SignupFormProps) {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")

  const requestCodeMutation = useMutation({
    mutationFn: (email: string) =>
      authService.requestCode({ email, purpose: "signup" }),
    onSuccess: () => {
      onCodeRequested?.(email, username)
    },
    onError: (error) => {
      console.error("Signup error:", error)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && username) {
      requestCodeMutation.mutate(email)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
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
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Field>
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
              {requestCodeMutation.isPending ? "Creating account..." : "Create Account"}
            </Button>
          </Field>
          {requestCodeMutation.error && (
            <FieldDescription className="text-red-600 text-center">
              {requestCodeMutation.error.message}
            </FieldDescription>
          )}
        </FieldGroup>
      </form>
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
    </div>
  )
}
