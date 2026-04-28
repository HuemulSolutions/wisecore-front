"use client"

import { useTranslation } from "react-i18next"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import type {
  ExternalFunctionalityHttpMethod,
  ExternalFunctionalityExecutionType,
  ExternalFunctionalityClass,
  ExternalFunctionalityObjective,
} from "@/types/external-functionalities"

export interface ExternalFunctionalityFormData {
  name?: string
  description?: string
  usage_example?: string
  partial_url?: string
  storage_url?: string
  http_method?: ExternalFunctionalityHttpMethod
  objective?: ExternalFunctionalityObjective
  body?: string
  execution_type?: ExternalFunctionalityExecutionType
  functionality_class?: ExternalFunctionalityClass
}

interface ExternalFunctionalityFormProps {
  formData: ExternalFunctionalityFormData
  onChange: <K extends keyof ExternalFunctionalityFormData>(field: K, value: ExternalFunctionalityFormData[K]) => void
}

export function ExternalFunctionalityForm({ formData, onChange }: ExternalFunctionalityFormProps) {
  const { t } = useTranslation("external-functionalities")

  const httpMethodOptions = (["GET", "POST", "PATCH", "PUT", "DELETE"] as ExternalFunctionalityHttpMethod[]).map(
    (m) => ({ value: m, label: m }),
  )

  const objectiveOptions = (
    ["import_asset", "export_asset", "edit_section", "review_section", "publish_asset"] as ExternalFunctionalityObjective[]
  ).map((o) => ({ value: o, label: t(`objective.${o}`) }))

  const executionTypeOptions = (["sync", "async"] as ExternalFunctionalityExecutionType[]).map((e) => ({
    value: e,
    label: t(`executionType.${e}`),
  }))

  const classOptions = (["agent", "endpoint"] as ExternalFunctionalityClass[]).map((c) => ({
    value: c,
    label: t(`class.${c}`),
  }))

  return (
    <HuemulFieldGroup className="py-2">
      <HuemulField
        label={t("detail.name")}
        name="name"
        value={formData.name ?? ""}
        onChange={(v) => onChange("name", v as string)}
        placeholder={t("form.namePlaceholder")}
        required
      />
      <HuemulField
        label={t("detail.description")}
        name="description"
        type="textarea"
        rows={2}
        value={formData.description ?? ""}
        onChange={(v) => onChange("description", v as string)}
        placeholder={t("form.descriptionPlaceholder")}
      />
      <HuemulField
        label={t("detail.partialUrl")}
        name="partial_url"
        value={formData.partial_url ?? ""}
        onChange={(v) => onChange("partial_url", v as string)}
        placeholder={t("form.partialUrlPlaceholder")}
        required
      />
      <HuemulField
        label={t("detail.storageUrl")}
        name="storage_url"
        value={formData.storage_url ?? ""}
        onChange={(v) => onChange("storage_url", v as string)}
        placeholder={t("form.storageUrlPlaceholder")}
      />
      <div className="grid grid-cols-2 gap-3">
        <HuemulField
          type="select"
          label={t("detail.httpMethod")}
          name="http_method"
          value={formData.http_method ?? ""}
          options={httpMethodOptions}
          onChange={(v) => onChange("http_method", v as ExternalFunctionalityHttpMethod)}
          placeholder={t("form.httpMethodPlaceholder")}
          required
        />
        <HuemulField
          type="select"
          label={t("detail.executionType")}
          name="execution_type"
          value={formData.execution_type ?? ""}
          options={executionTypeOptions}
          onChange={(v) => onChange("execution_type", v as ExternalFunctionalityExecutionType)}
          placeholder={t("form.executionTypePlaceholder")}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <HuemulField
          type="select"
          label={t("detail.objective")}
          name="objective"
          value={formData.objective ?? ""}
          options={objectiveOptions}
          onChange={(v) => onChange("objective", v as ExternalFunctionalityObjective)}
          placeholder={t("form.objectivePlaceholder")}
          required
        />
        <HuemulField
          type="select"
          label={t("detail.functionalityClass")}
          name="functionality_class"
          value={formData.functionality_class ?? ""}
          options={classOptions}
          onChange={(v) => onChange("functionality_class", v as ExternalFunctionalityClass)}
          placeholder={t("form.functionalityClassPlaceholder")}
          required
        />
      </div>
      <HuemulField
        label={t("detail.usageExample")}
        name="usage_example"
        type="textarea"
        rows={2}
        value={formData.usage_example ?? ""}
        onChange={(v) => onChange("usage_example", v as string)}
        placeholder={t("form.usageExamplePlaceholder")}
      />
      <HuemulField
        label={t("detail.body")}
        name="body"
        type="json"
        rows={6}
        value={formData.body ?? ""}
        onChange={(v) => onChange("body", v as string)}
        placeholder={t("form.bodyPlaceholder")}
      />
    </HuemulFieldGroup>
  )
}
