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
import { getErrorMessage } from "@/lib/error-utils"
import packageJson from "../../../package.json"

interface LoginFormProps extends React.ComponentProps<"div"> {
  onSwitchToSignup?: () => void
  onCodeRequested?: (email: string) => void
}

export function LoginForm({
  className,
  onSwitchToSignup, // eslint-disable-line @typescript-eslint/no-unused-vars -- Kept for easy reactivation of signup feature
  onCodeRequested,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState("")

  const requestCodeMutation = useMutation({
    mutationFn: (email: string) =>
      authService.requestCode({ email, purpose: "login" }),
    onSuccess: () => {
      onCodeRequested?.(email)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      requestCodeMutation.mutate(email)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-4 text-center">
            <WisecoreLogo size="lg" className="text-[#4464f7]" />
            {/* <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1> */}
            {/* Signup link hidden - kept in code for easy reactivation */}
            {/* <FieldDescription className="text-gray-600">
              Don&apos;t have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onSwitchToSignup?.()
                }}
                className="hover:cursor-pointer text-[#4464f7] hover:text-[#3451e6] font-medium transition-colors"
              >
                Sign up
              </a>
            </FieldDescription> */}
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
              {requestCodeMutation.isPending ? "Sending code..." : "Continue with Email"}
            </Button>
          </Field>
          {requestCodeMutation.error && (
            <FieldDescription className="text-red-600 text-center">
              {getErrorMessage(requestCodeMutation.error)}
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
      <div className="text-center text-xs text-gray-400">
        Version {packageJson.version}
      </div>
    </div>
  )
}
