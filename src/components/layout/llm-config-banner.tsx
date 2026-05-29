import { AlertTriangle, XCircle, X, Settings } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLlmConfigurationStatus } from '@/hooks/useLlmConfigurationStatus'
import { useOrgPath } from '@/hooks/useOrgRouter'
import { cn } from '@/lib/utils'

interface LlmConfigBannerProps {
  organizationId: string | null | undefined
}

interface BannerMessage {
  key: string
  severity: 'error' | 'warning'
  text: string
}

export function LlmConfigBanner({ organizationId }: LlmConfigBannerProps) {
  const { t } = useTranslation('layout')
  const { data } = useLlmConfigurationStatus(organizationId)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const buildPath = useOrgPath()

  if (!data) return null

  const messages: BannerMessage[] = []

  if (!data.default_llm.is_configured) {
    messages.push({
      key: 'llm-not-configured',
      severity: 'error',
      text: t('llmConfigBanner.llmNotConfigured'),
    })
  } else if (!data.default_llm.is_working) {
    messages.push({
      key: 'llm-not-working',
      severity: 'warning',
      text: t('llmConfigBanner.llmNotWorking'),
    })
  }

  if (!data.embedding.is_configured) {
    messages.push({
      key: 'embedding-not-configured',
      severity: 'error',
      text: t('llmConfigBanner.embeddingNotConfigured'),
    })
  } else if (!data.embedding.is_working) {
    messages.push({
      key: 'embedding-not-working',
      severity: 'warning',
      text: t('llmConfigBanner.embeddingNotWorking'),
    })
  }

  const visible = messages.filter((m) => !dismissed.has(m.key))

  if (visible.length === 0) return null

  return (
    <div className="flex flex-col">
      {visible.map((msg) => (
        <div
          key={msg.key}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm',
            msg.severity === 'error'
              ? 'bg-destructive/10 text-destructive border-b border-destructive/20'
              : 'bg-yellow-50 text-yellow-800 border-b border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30',
          )}
        >
          {msg.severity === 'error' ? (
            <XCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{msg.text}</span>
          <Link
            to={buildPath('/models')}
            className={cn(
              'hover:cursor-pointer shrink-0 flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border transition-colors',
              msg.severity === 'error'
                ? 'border-destructive/40 hover:bg-destructive/10'
                : 'border-yellow-400/60 hover:bg-yellow-100 dark:border-yellow-700 dark:hover:bg-yellow-900/40',
            )}
          >
            <Settings className="h-3 w-3" />
            {t('llmConfigBanner.configure')}
          </Link>
          <button
            onClick={() => setDismissed((prev) => new Set(prev).add(msg.key))}
            className="hover:cursor-pointer shrink-0 rounded p-0.5 hover:opacity-70 transition-opacity"
            aria-label={t('llmConfigBanner.dismiss')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
