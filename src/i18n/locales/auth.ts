const translations = {
  login: {
    emailPlaceholder: { en: "email@example.com", es: "correo@dominio.com" },
    sendingCode: { en: "Sending code...", es: "Enviando código..." },
    continueWithEmail: { en: "Continue with Email", es: "Continuar con Correo" },
    termsText: { en: "By clicking continue, you agree to our", es: "Al hacer clic en continuar, aceptas nuestros" },
    termsOfService: { en: "Terms of Service", es: "Términos de Servicio" },
    and: { en: "and", es: "y" },
    privacyPolicy: { en: "Privacy Policy", es: "Política de Privacidad" },
    version: { en: "Version", es: "Versión" },
  },
  otp: {
    back: { en: "Back", es: "Volver" },
    title: { en: "Enter verification code", es: "Ingresa el código de verificación" },
    description: { en: "We sent a 6-digit code to", es: "Enviamos un código de 6 dígitos a" },
    verificationCode: { en: "Verification code", es: "Código de verificación" },
    didntReceiveCode: { en: "Didn't receive the code?", es: "¿No recibiste el código?" },
    resend: { en: "Resend", es: "Reenviar" },
    sending: { en: "Sending...", es: "Enviando..." },
    verifying: { en: "Verifying...", es: "Verificando..." },
    verifyCode: { en: "Verify Code", es: "Verificar Código" },
    codeSentSuccess: { en: "Code sent successfully!", es: "¡Código enviado exitosamente!" },
    resendIn: { en: "Resend in {{seconds}}s", es: "Reenviar en {{seconds}}s" },
  },
  errors: {
    tooManyRequests: { en: "Too many attempts. Please wait a moment before trying again.", es: "Demasiados intentos. Esperá un momento antes de volver a intentar." },
    requestCodeFailed: { en: "We couldn't send the code. Please try again.", es: "No pudimos enviar el código. Intentá de nuevo." },
    invalidCode: { en: "Incorrect or expired code. Please try again.", es: "Código incorrecto o vencido. Intentá de nuevo." },
    resendFailed: { en: "We couldn't resend the code. Please try again.", es: "No pudimos reenviar el código. Intentá de nuevo." },
  },
}

export default translations
