import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

interface OtpCodeInputProps {
  id: string
  value: string
  onChange: (value: string) => void
}

const GROUP_CLASS =
  "gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl"
const SLOT_CLASS = "h-14 w-12 text-xl font-semibold"

/**
 * Input de código de verificación de 6 dígitos (3 + 3). Lo comparten el login
 * (`OTPForm`) y el modo administrador (`RootElevationDialog`).
 */
export function OtpCodeInput({ id, value, onChange }: OtpCodeInputProps) {
  return (
    <div className="flex justify-center">
      <InputOTP
        maxLength={6}
        id={id}
        value={value}
        onChange={onChange}
        required
        containerClassName="gap-3"
      >
        <InputOTPGroup className={GROUP_CLASS}>
          <InputOTPSlot index={0} className={SLOT_CLASS} />
          <InputOTPSlot index={1} className={SLOT_CLASS} />
          <InputOTPSlot index={2} className={SLOT_CLASS} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup className={GROUP_CLASS}>
          <InputOTPSlot index={3} className={SLOT_CLASS} />
          <InputOTPSlot index={4} className={SLOT_CLASS} />
          <InputOTPSlot index={5} className={SLOT_CLASS} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}
