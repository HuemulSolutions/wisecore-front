import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulCheckboxGroup } from "@/huemul/components/huemul-checkbox-group"
import { QUESTION_TYPE } from "@/components/sections/question-type-meta"

export interface HuemulQuestionInputOption {
  id: string
  label: string
}

export type HuemulQuestionInputValue = string | number | boolean | string[] | null

export interface HuemulQuestionInputProps {
  questionType?: string | null
  dataType?: string | null
  label?: string
  placeholder?: string
  value: HuemulQuestionInputValue
  onChange: (value: HuemulQuestionInputValue) => void
  options?: HuemulQuestionInputOption[]
  min?: number | null
  max?: number | null
  minLabel?: string
  maxLabel?: string
  error?: string
  disabled?: boolean
}

// Única fuente de verdad para el mapeo question_type (y, en su defecto, data_type)
// → widget de HuemulField/HuemulCheckboxGroup. Usado tanto por el runtime de
// respuesta de formulario (asset-form-section.tsx) como por la entrada de valor
// de custom fields (custom-field-value-field.tsx) para que ambos rendericen el
// mismo control por tipo de pregunta y no vuelvan a divergir.
//
// No maneja carga de archivos ni imágenes: cada consumidor tiene su propio flujo
// de upload (tokens {{MEDIA:id}} en formulario vs blobs en custom fields) y debe
// resolver esos tipos antes de delegar aquí.
export function HuemulQuestionInput({
  questionType,
  dataType,
  label = "",
  placeholder,
  value,
  onChange,
  options = [],
  min,
  max,
  minLabel,
  maxLabel,
  error,
  disabled,
}: HuemulQuestionInputProps) {
  const stringValue = typeof value === "string" ? value : ""
  const numberValue = value === null || value === undefined ? "" : (value as number)
  const boolValue = typeof value === "boolean" ? value : false
  const arrayValue = Array.isArray(value) ? value : []
  const mappedOptions = Array.isArray(options)
    ? options.map((o) => ({ value: o.id, label: o.label }))
    : []

  switch (questionType) {
    case QUESTION_TYPE.shortAnswer:
      return (
        <HuemulField
          type="text"
          label={label}
          placeholder={placeholder}
          value={stringValue}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    case QUESTION_TYPE.paragraph:
      return (
        <HuemulField
          type="textarea"
          label={label}
          rows={3}
          placeholder={placeholder}
          value={stringValue}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    case QUESTION_TYPE.email:
      return (
        <HuemulField
          type="email"
          label={label}
          placeholder={placeholder}
          value={stringValue}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    case QUESTION_TYPE.number:
    case QUESTION_TYPE.decimal: {
      const isDecimal = questionType === QUESTION_TYPE.decimal || dataType === "decimal"
      return (
        <HuemulField
          type="number"
          label={label}
          placeholder={placeholder}
          step={isDecimal ? undefined : 1}
          min={typeof min === "number" ? min : undefined}
          max={typeof max === "number" ? max : undefined}
          value={numberValue}
          onChange={(v) => onChange(v === "" ? null : Number(v))}
          disabled={disabled}
          error={error}
        />
      )
    }

    case QUESTION_TYPE.yesNo:
      return (
        <HuemulField
          type="yes-no"
          label={label}
          value={boolValue}
          onChange={(v) => onChange(Boolean(v))}
          disabled={disabled}
          error={error}
        />
      )

    case QUESTION_TYPE.multipleChoice:
      return (
        <HuemulField
          type="radio"
          label={label}
          value={stringValue}
          options={mappedOptions}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    case QUESTION_TYPE.dropdown:
      return (
        <HuemulField
          type="select"
          label={label}
          placeholder={placeholder}
          value={stringValue}
          options={mappedOptions}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    case QUESTION_TYPE.dropdownMultiple:
      return (
        <HuemulCheckboxGroup
          label={label}
          value={arrayValue as string[]}
          options={mappedOptions}
          onChange={(next) => onChange(next)}
          disabled={disabled}
          error={error}
        />
      )

    case QUESTION_TYPE.linearScale:
      return (
        <HuemulField
          type="linear-scale"
          label={label}
          min={typeof min === "number" ? min : 1}
          max={typeof max === "number" ? max : 5}
          minLabel={minLabel}
          maxLabel={maxLabel}
          value={numberValue}
          onChange={(v) => onChange(v === "" ? null : Number(v))}
          disabled={disabled}
          error={error}
        />
      )

    case QUESTION_TYPE.rating:
      return (
        <HuemulField
          type="rating"
          label={label}
          max={typeof max === "number" ? max : 5}
          value={numberValue}
          onChange={(v) => onChange(v === "" ? null : Number(v))}
          disabled={disabled}
          error={error}
        />
      )

    case QUESTION_TYPE.date:
      return (
        <HuemulField
          type="date"
          label={label}
          value={stringValue}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    case QUESTION_TYPE.time:
      return (
        <HuemulField
          type="time"
          label={label}
          placeholder={placeholder}
          value={stringValue}
          withSeconds={false}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    default:
      break
  }

  // Fallback por data_type: question_type desconocido/null (legacy) o tipos sin
  // widget propio (date/time/url/datetime/list ya cubiertos aquí por si llegan
  // sin question_type asociado).
  switch (dataType) {
    case "bool":
      return (
        <HuemulField
          type="switch"
          label={label}
          value={boolValue}
          onChange={(v) => onChange(Boolean(v))}
          disabled={disabled}
          error={error}
        />
      )

    case "int":
      return (
        <HuemulField
          type="number"
          label={label}
          placeholder={placeholder}
          step={1}
          min={typeof min === "number" ? min : undefined}
          max={typeof max === "number" ? max : undefined}
          value={numberValue}
          onChange={(v) => onChange(v === "" ? null : Number(v))}
          disabled={disabled}
          error={error}
        />
      )

    case "decimal":
      return (
        <HuemulField
          type="number"
          label={label}
          placeholder={placeholder}
          min={typeof min === "number" ? min : undefined}
          max={typeof max === "number" ? max : undefined}
          value={numberValue}
          onChange={(v) => onChange(v === "" ? null : Number(v))}
          disabled={disabled}
          error={error}
        />
      )

    case "date":
      return (
        <HuemulField
          type="date"
          label={label}
          value={stringValue}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    case "time":
      return (
        <HuemulField
          type="time"
          label={label}
          placeholder={placeholder}
          value={stringValue}
          withSeconds={false}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    case "datetime":
      return (
        <HuemulField
          type="datetime"
          label={label}
          placeholder={placeholder}
          value={stringValue}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    case "url":
      return (
        <HuemulField
          type="url"
          label={label}
          placeholder={placeholder}
          value={stringValue}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    case "list":
      return (
        <HuemulField
          type="select"
          label={label}
          placeholder={placeholder}
          value={stringValue}
          options={mappedOptions}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )

    default:
      return (
        <HuemulField
          type="text"
          label={label}
          placeholder={placeholder}
          value={stringValue}
          onChange={(v) => onChange(String(v))}
          disabled={disabled}
          error={error}
        />
      )
  }
}
