import { useState } from "react"
import { ArrowLeft } from "lucide-react"
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { authService } from "@/services/auth"
import { useAuth } from "@/contexts/auth-context"
import packageJson from "../../../package.json"

interface OTPFormProps extends React.ComponentProps<"div"> {
  email: string
  name?: string
  lastName?: string
  purpose: "login" | "signup"
  onBack?: () => void
  onSuccess?: () => void
}

export function OTPForm({
  className,
  email,
  name,
  lastName,
  purpose,
  onBack,
  onSuccess,
  ...props
}: OTPFormProps) {
  const [code, setCode] = useState("")
  const { login } = useAuth()

  const verifyMutation = useMutation({
    mutationFn: async (otpCode: string) => {
      if (purpose === "login") {
        return authService.verifyCode({ email, code: otpCode })
      } else {
        if (!name || !lastName) throw new Error("Name and last name are required for signup")
        return authService.createUser({ email, name, last_name: lastName, code: otpCode })
      }
    },
    onSuccess: (data) => {
      login(data.token, data.user)
      onSuccess?.()
    },
    onError: (error) => {
      console.error("Verification error:", error)
      setCode("") // Clear the code on error
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => authService.requestCode({ email, purpose }),
    onError: (error) => {
      console.error("Resend error:", error)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code && code.length === 6) {
      verifyMutation.mutate(code)
    }
  }

  const handleResend = () => {
    resendMutation.mutate()
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          {onBack && (
            <div className="w-full flex justify-start mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                type="button"
                className="hover:cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
          )}
          <div className="flex flex-col items-center gap-4 text-center">
            <WisecoreLogo size="lg" className="text-[#4464f7]" />
            <h1 className="text-2xl font-bold text-gray-900">Enter verification code</h1>
            <FieldDescription className="text-gray-600">
              We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="otp" className="sr-only">
              Verification code
            </FieldLabel>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                id="otp"
                value={code}
                onChange={(value) => setCode(value)}
                required
                containerClassName="gap-3"
              >
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={0} className="h-14 w-12 text-xl font-semibold" />
                  <InputOTPSlot index={1} className="h-14 w-12 text-xl font-semibold" />
                  <InputOTPSlot index={2} className="h-14 w-12 text-xl font-semibold" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={3} className="h-14 w-12 text-xl font-semibold" />
                  <InputOTPSlot index={4} className="h-14 w-12 text-xl font-semibold" />
                  <InputOTPSlot index={5} className="h-14 w-12 text-xl font-semibold" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <FieldDescription className="text-center text-gray-600">
              Didn&apos;t receive the code?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handleResend()
                }}
                className="hover:cursor-pointer text-[#4464f7] hover:text-[#3451e6] font-medium transition-colors"
              >
                {resendMutation.isPending ? "Sending..." : "Resend"}
              </a>
            </FieldDescription>
          </Field>
          <Field>
            <Button
              type="submit"
              disabled={verifyMutation.isPending || code.length !== 6}
              className="w-full bg-[#4464f7] hover:bg-[#3451e6] text-white hover:cursor-pointer font-medium py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify Code"}
            </Button>
          </Field>
          {verifyMutation.error && (
            <FieldDescription className="text-red-600 text-center">
              {verifyMutation.error.message}
            </FieldDescription>
          )}
          {resendMutation.isSuccess && (
            <FieldDescription className="text-green-600 text-center">
              Code sent successfully!
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
