import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { ChevronUp, ChevronDown, Check, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getExecutionVersionSuggestion } from "@/services/executions"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { cn } from "@/lib/utils"

function isVersionNewer(a: [number, number, number], b: [number, number, number]) {
  if (a[0] !== b[0]) return a[0] > b[0]
  if (a[1] !== b[1]) return a[1] > b[1]
  return a[2] > b[2]
}

export interface HuemulVersionPickerValue {
  major: number
  minor: number
  patch: number
  versionString: string
  isValid: boolean
  isFetchingSuggestion: boolean
}

interface HuemulVersionPickerProps {
  /** Igual semántica que `open` en un dialog/sheet: sembrar/resetear los inputs cuando pasa a `true`. */
  open: boolean
  executionId: string | null | undefined
  organizationId: string | null | undefined
  existingVersions?: string[]
  disabled?: boolean
  /** `compact` = inputs en línea + chips sugeridos (sheet de aprobación); `default` = steppers con checklist (dialog standalone). */
  variant?: "default" | "compact"
  /**
   * Se dispara con el estado calculado cada vez que cambia (inputs, o llega
   * la sugerencia). No memoizar el callback en el caller no rompe nada: la
   * emisión depende solo de los valores primitivos, no de la identidad de
   * `onChange` (evita el loop de re-render si el caller hace `setState` ahí).
   */
  onChange: (value: HuemulVersionPickerValue) => void
}

/**
 * Selector de versión semántica (Mayor.Menor.Parche) con sugerencia basada en
 * la versión anterior, checklist de validación (más nueva, única) y hints.
 * Extraído de `assets-assign-version-dialog.tsx` para reusarse embebido en el
 * sheet de aprobación (versión inline) además del dialog standalone.
 */
export function HuemulVersionPicker({
  open,
  executionId,
  organizationId,
  existingVersions,
  disabled = false,
  variant = "default",
  onChange,
}: HuemulVersionPickerProps) {
  const { t } = useTranslation("assets")
  const { canRead } = useUserPermissions()
  const canReadVersion = canRead("version")
  const [major, setMajor] = useState("1")
  const [minor, setMinor] = useState("0")
  const [patch, setPatch] = useState("0")

  const { data: suggestion, isFetching: isFetchingSuggestionQuery, isError: isSuggestionError } = useQuery({
    queryKey: ["execution-version-suggestion", executionId],
    queryFn: () => getExecutionVersionSuggestion(executionId!, organizationId!),
    enabled: open && !!executionId && !!organizationId && canReadVersion,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })

  const isFetchingSuggestion = open && !!executionId && !!organizationId && canReadVersion && isFetchingSuggestionQuery

  // Seed inputs whenever the picker opens or a fresh suggestion arrives
  useEffect(() => {
    if (!open) return
    setMajor(suggestion ? String(suggestion.major) : "1")
    setMinor(suggestion ? String(suggestion.minor) : "0")
    setPatch(suggestion ? String(suggestion.patch) : "0")
  }, [open, suggestion])

  const majorNum = parseInt(major || "0", 10)
  const minorNum = parseInt(minor || "0", 10)
  const patchNum = parseInt(patch || "0", 10)

  const baseParsed = useMemo(() => {
    if (!suggestion?.based_on) return null
    const parts = suggestion.based_on.split(".").map((p) => parseInt(p, 10))
    if (parts.length !== 3 || parts.some((n) => isNaN(n))) return null
    return { major: parts[0], minor: parts[1], patch: parts[2] }
  }, [suggestion?.based_on])

  const isNewer =
    !baseParsed || isVersionNewer([majorNum, minorNum, patchNum], [baseParsed.major, baseParsed.minor, baseParsed.patch])

  const versionString = `${majorNum}.${minorNum}.${patchNum}`
  const isUnique = !existingVersions?.includes(versionString)

  const hintKey: "major" | "minor" | "patch" | null = !baseParsed
    ? null
    : majorNum > baseParsed.major
      ? "major"
      : minorNum > baseParsed.minor
        ? "minor"
        : patchNum > baseParsed.patch
          ? "patch"
          : null

  const isValid =
    major.length > 0 &&
    minor.length > 0 &&
    patch.length > 0 &&
    !isNaN(majorNum) &&
    !isNaN(minorNum) &&
    !isNaN(patchNum) &&
    isNewer &&
    isUnique

  // `onChange` deliberately excluded del array de deps: solo depende de los
  // valores primitivos calculados, no de la identidad del callback (evita un
  // loop si el caller lo redefine cada render).
  useEffect(() => {
    onChange({ major: majorNum, minor: minorNum, patch: patchNum, versionString, isValid, isFetchingSuggestion })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majorNum, minorNum, patchNum, versionString, isValid, isFetchingSuggestion])

  function sanitize(value: string) {
    return value.replace(/\D/g, "")
  }

  function increment(setter: (v: string) => void, current: string) {
    const num = parseInt(current || "0", 10)
    setter(String(num + 1))
  }

  function decrement(setter: (v: string) => void, current: string) {
    const num = parseInt(current || "0", 10)
    if (num > 0) setter(String(num - 1))
  }

  const stepperColumns: Array<{
    key: "major" | "minor" | "patch"
    label: string
    value: string
    setValue: (v: string) => void
    num: number
    base: number | null
  }> = [
    { key: "major", label: t("assignVersion.major"), value: major, setValue: setMajor, num: majorNum, base: baseParsed?.major ?? null },
    { key: "minor", label: t("assignVersion.minor"), value: minor, setValue: setMinor, num: minorNum, base: baseParsed?.minor ?? null },
    { key: "patch", label: t("assignVersion.patch"), value: patch, setValue: setPatch, num: patchNum, base: baseParsed?.patch ?? null },
  ]

  if (variant === "compact") {
    const inputsDisabled = disabled || isFetchingSuggestion
    const inputs = [
      { key: "major", value: major, setValue: setMajor, label: t("assignVersion.major") },
      { key: "minor", value: minor, setValue: setMinor, label: t("assignVersion.minor") },
      { key: "patch", value: patch, setValue: setPatch, label: t("assignVersion.patch") },
    ]
    const chips = baseParsed
      ? [
          { key: "minor", label: t("assignVersion.chips.minor"), values: [baseParsed.major, baseParsed.minor + 1, 0] },
          { key: "patch", label: t("assignVersion.chips.patch"), values: [baseParsed.major, baseParsed.minor, baseParsed.patch + 1] },
          { key: "major", label: t("assignVersion.chips.major"), values: [baseParsed.major + 1, 0, 0] },
        ]
      : []
    const isIncomplete = major.length === 0 || minor.length === 0 || patch.length === 0
    const errorMessage = isIncomplete
      ? t("assignVersion.validation.incomplete")
      : !isUnique
        ? t("assignVersion.validation.isUniqueFail")
        : !isNewer
          ? t("assignVersion.validation.isNewerFail", { version: suggestion?.based_on })
          : null

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label className="text-[13px] font-semibold whitespace-nowrap text-[#0f172a]">{t("assignVersion.versionLabel")}</Label>
          {suggestion?.based_on && (
            <span className="text-xs text-[#64748b]">{t("assignVersion.lastPublished", { version: suggestion.based_on })}</span>
          )}
        </div>
        <div className="flex items-end gap-2">
          {inputs.map((input, index) => (
            <div key={input.key} className="contents">
              {index > 0 && <span className="pb-2.5 text-xl font-semibold text-[#94a3b8]">.</span>}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Label htmlFor={`version-${input.key}`} className="text-[11px] font-medium text-[#64748b]">
                  {input.label}
                </Label>
                <Input
                  id={`version-${input.key}`}
                  type="text"
                  inputMode="numeric"
                  value={input.value}
                  onChange={(e) => input.setValue(sanitize(e.target.value))}
                  disabled={inputsDisabled}
                  className="h-12 w-full min-w-0 border-[#e2e8f0] px-0 text-center font-mono text-lg focus-visible:border-[#2563eb] focus-visible:ring-[3px] focus-visible:ring-[#dbeafe]"
                />
              </div>
            </div>
          ))}
        </div>
        {chips.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {chips.map((chip) => {
              const selected = chip.values[0] === majorNum && chip.values[1] === minorNum && chip.values[2] === patchNum
              return (
                <button
                  key={chip.key}
                  type="button"
                  disabled={inputsDisabled}
                  onClick={() => {
                    setMajor(String(chip.values[0]))
                    setMinor(String(chip.values[1]))
                    setPatch(String(chip.values[2]))
                  }}
                  className={cn(
                    "h-9 rounded-full border px-2.5 text-[13px] hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
                    selected ? "border-[#93c5fd] bg-[#eff5ff] text-[#1d4ed8]" : "border-[#e2e8f0] bg-white text-[#475569]",
                  )}
                >
                  <span className="font-mono">{chip.values.join(".")}</span> · {chip.label}
                </button>
              )
            })}
          </div>
        )}
        {errorMessage && <span className="text-xs text-[#b91c1c]">{errorMessage}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="flex items-start gap-2 w-full">
        {stepperColumns.map((column, index) => (
          <div key={column.key} className="contents">
            {index > 0 && <span className="text-2xl font-semibold text-gray-400 pt-7">.</span>}
            <div className="group flex flex-col gap-1 flex-1 items-center">
              <Label className="text-xs text-gray-500 font-medium text-center group-focus-within:text-blue-600 transition-colors">
                {column.label}
              </Label>
              <div className="flex flex-col items-center gap-0.5 w-full rounded-md border border-gray-200 bg-white px-1 py-1.5 transition-colors group-focus-within:border-blue-500 group-focus-within:bg-blue-50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:cursor-pointer"
                  disabled={disabled || isFetchingSuggestion}
                  onClick={() => increment(column.setValue, column.value)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={column.value}
                  onChange={(e) => column.setValue(sanitize(e.target.value))}
                  className="h-8 border-0 bg-transparent px-0 text-center font-mono text-base shadow-none focus-visible:ring-0"
                  disabled={disabled || isFetchingSuggestion}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:cursor-pointer"
                  disabled={disabled || isFetchingSuggestion || column.num <= 0}
                  onClick={() => decrement(column.setValue, column.value)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              {column.base !== null && (
                <span className="text-[11px] text-gray-400">{t("assignVersion.era", { value: column.base })}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Validation checklist */}
      <div className="flex flex-col gap-1.5 w-full">
        {baseParsed && (
          <div className={cn("flex items-center gap-1.5 text-xs", isNewer ? "text-green-600" : "text-amber-600")}>
            {isNewer ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
            <span>
              {isNewer
                ? t("assignVersion.validation.isNewer", { version: suggestion?.based_on })
                : t("assignVersion.validation.isNewerFail", { version: suggestion?.based_on })}
            </span>
          </div>
        )}
        <div className={cn("flex items-center gap-1.5 text-xs", isUnique ? "text-green-600" : "text-amber-600")}>
          {isUnique ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
          <span>{isUnique ? t("assignVersion.validation.isUnique") : t("assignVersion.validation.isUniqueFail")}</span>
        </div>
        {hintKey && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>{t(`assignVersion.hint.${hintKey}`)}</span>
          </div>
        )}
      </div>

      {/* Suggestion origin hint */}
      {isFetchingSuggestion ? (
        <span className="text-xs text-gray-400">{t("assignVersion.loadingSuggestion")}</span>
      ) : !isSuggestionError && suggestion ? (
        <span className="text-xs text-gray-400">
          {suggestion.based_on ? t("assignVersion.basedOn", { version: suggestion.based_on }) : t("assignVersion.basedOnNone")}
        </span>
      ) : null}
    </div>
  )
}
