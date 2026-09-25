/**
 * Marco visual del login: fondo de montaña a pantalla completa, bloque de
 * presentación y tarjeta blanca donde vive cada paso del flujo (email, código,
 * organización, SSO y vuelta del IdP). El logo y el pie legal los pone este
 * marco, así los pasos solo pintan su contenido.
 *
 * Escritorio (lg): presentación a la izquierda y tarjeta a la derecha.
 * Móvil: presentación arriba y tarjeta abajo, con el fondo vertical.
 */
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { WisecoreLogo } from "@/components/ui/wisecore-logo"
import { AuthLegalFooter } from "@/components/auth/auth-legal-footer"

export interface AuthShellProps {
  children: React.ReactNode
  className?: string
}

export function AuthShell({ children, className }: AuthShellProps) {
  const { t } = useTranslation("auth")

  return (
    <div className="relative isolate min-h-svh overflow-hidden bg-slate-950">
      <picture>
        <source media="(min-width: 1024px)" srcSet="/assets/login/wisecore-web.png" />
        <img
          src="/assets/login/wisecore-mobile.png"
          alt=""
          aria-hidden
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center motion-safe:animate-[login-ken-burns_30s_ease-in-out_infinite_alternate]"
        />
      </picture>
      {/* Velo para que el texto blanco se lea sobre cualquier zona de la foto. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/75 via-slate-950/25 to-slate-950/85 lg:bg-gradient-to-r lg:from-slate-950/85 lg:via-slate-950/35 lg:to-slate-950/10"
      />

      <div className="mx-auto grid min-h-svh w-full max-w-7xl gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,28rem)] lg:items-center lg:gap-16 lg:px-12 lg:py-10">
        <section className="flex flex-col text-white motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:animation-duration-700 lg:min-h-[calc(100svh-5rem)] lg:justify-between">
          <WisecoreLogo variant="ai-light" size="lg" className="h-9 self-start sm:h-11 lg:h-12" />

          <div className="mt-8 max-w-xl lg:mt-0">
            <p className="text-4xl font-semibold leading-[1.1] tracking-tight drop-shadow-sm sm:text-5xl lg:text-6xl">
              {t("hero.titleLead")}{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                {t("hero.titleHighlight")}
              </span>
            </p>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/80 lg:text-lg">
              {t("hero.subtitle")}
            </p>
          </div>

          <p className="hidden items-center gap-2 text-sm text-white/70 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" aria-hidden />
            {t("hero.poweredBy")}
          </p>
        </section>

        <main className="flex items-start justify-center pb-4 lg:items-center lg:pb-0">
          <div
            className={cn(
              "w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl shadow-blue-950/50 ring-1 ring-white/20 sm:p-8",
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:animation-duration-700 motion-safe:delay-150 motion-safe:fill-mode-both",
              className,
            )}
          >
            <div className="mb-6 flex justify-center">
              <WisecoreLogo variant="ai" size="lg" className="h-10 sm:h-12" />
            </div>
            {children}
            <div className="mt-6 flex flex-col gap-2">
              <AuthLegalFooter />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
