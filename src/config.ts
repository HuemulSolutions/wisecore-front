export const backendUrl = import.meta.env.VITE_API_URL;

// Opcionales: si no están definidas, la pantalla de login muestra el texto
// legal sin enlace en vez de un href="#" muerto (ver rbac-audit-guide.md).
export const termsUrl = import.meta.env.VITE_TERMS_URL as string | undefined;
export const privacyUrl = import.meta.env.VITE_PRIVACY_URL as string | undefined;