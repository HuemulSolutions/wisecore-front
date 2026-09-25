const translations = {
  login: {
    emailPlaceholder: { en: "email@example.com", es: "correo@dominio.com" },
    sendingCode: { en: "Sending code...", es: "Enviando código..." },
    continueWithEmail: { en: "Continue with Email", es: "Continuar con Correo" },
    termsText: { en: "By clicking continue, you agree to our", es: "Al hacer clic en continuar, se aceptan nuestros" },
    termsOfService: { en: "Terms of Service", es: "Términos de Servicio" },
    and: { en: "and", es: "y" },
    privacyPolicy: { en: "Privacy Policy", es: "Política de Privacidad" },
    version: { en: "Version", es: "Versión" },
  },
  otp: {
    back: { en: "Back", es: "Volver" },
    title: { en: "Enter verification code", es: "Ingresar el código de verificación" },
    description: { en: "We sent a 6-digit code to", es: "Enviamos un código de 6 dígitos a" },
    verificationCode: { en: "Verification code", es: "Código de verificación" },
    didntReceiveCode: { en: "Didn't receive the code?", es: "¿No llegó el código?" },
    resend: { en: "Resend", es: "Reenviar" },
    sending: { en: "Sending...", es: "Enviando..." },
    verifying: { en: "Verifying...", es: "Verificando..." },
    verifyCode: { en: "Verify Code", es: "Verificar Código" },
    codeSentSuccess: { en: "Code sent successfully!", es: "¡Código enviado exitosamente!" },
    resendIn: { en: "Resend in {{seconds}}s", es: "Reenviar en {{seconds}}s" },
  },
  errors: {
    tooManyRequests: { en: "Too many attempts. Please wait a moment before trying again.", es: "Demasiados intentos. Esperar un momento antes de reintentar." },
    requestCodeFailed: { en: "We couldn't send the code. Please try again.", es: "No se pudo enviar el código. Reintentar." },
    invalidCode: { en: "Incorrect or expired code. Please try again.", es: "Código incorrecto o expirado. Reintentar." },
    resendFailed: { en: "We couldn't resend the code. Please try again.", es: "No se pudo reenviar el código. Reintentar." },
  },
}

export default translations
