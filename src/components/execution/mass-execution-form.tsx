import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Bot, Pencil, PenLine, Play, FastForward, Eye, Save, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrganization } from "@/contexts/organization-context"
import { getAllTemplates } from "@/services/templates"
import { getTemplateById } from "@/services/templates"
import { getLLMs, getDefaultLLM } from "@/services/llms"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { HuemulFieldOption } from "@/huemul/components/huemul-field"
import type { LLM } from "@/types/llm"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type EditType = "execute-ai" | "edit-ai" | "manual"
type ExecutionMode = "single" | "from" | "review" | "save"

interface TemplateSection {
  id: string
  name: string
  order: number
}

export interface MassExecutionConfig {
  templateId: string
  sectionId: string
  editType: EditType
  llmId: string
  instructions: string
  executionMode: ExecutionMode
}

interface StepHeaderProps {
  step: number
  label: string
}

function StepHeader({ step, label }: StepHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
        {step}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  )
}

interface SelectionCardProps {
  selected: boolean
  onClick: () => void
  icon: React.ElementType
  title: string
  description: string
}

function SelectionCard({ selected, onClick, icon: Icon, title, description }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors hover:cursor-pointer",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-foreground" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  )
}

export function MassExecutionForm({ onTemplateChange, onConfigChange }: { onTemplateChange?: (templateId: string) => void; onConfigChange?: (config: MassExecutionConfig) => void }) {
  const { t } = useTranslation("advanced")
  const { selectedOrganizationId } = useOrganization()

  // Form state
  const [templateId, setTemplateId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [editType, setEditType] = useState<EditType>("edit-ai")
  const [llmId, setLlmId] = useState("")
  const [instructions, setInstructions] = useState("")
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("single")

  // Data state
  const [templateOptions, setTemplateOptions] = useState<HuemulFieldOption[]>([])
  const [sectionOptions, setSectionOptions] = useState<HuemulFieldOption[]>([])
  const [availableLLMs, setAvailableLLMs] = useState<LLM[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isLoadingSections, setIsLoadingSections] = useState(false)
  const [isLoadingLLMs, setIsLoadingLLMs] = useState(false)

  // Emit config changes
  useEffect(() => {
    onConfigChange?.({
      templateId,
      sectionId,
      editType,
      llmId,
      instructions,
      executionMode,
    })
  }, [templateId, sectionId, editType, llmId, instructions, executionMode, onConfigChange])

  // Load templates
  useEffect(() => {
    if (!selectedOrganizationId) return
    setIsLoadingTemplates(true)
    getAllTemplates(selectedOrganizationId)
      .then((res) => {
        setTemplateOptions(
          res.data.map((t) => ({ label: t.name, value: t.id }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoadingTemplates(false))
  }, [selectedOrganizationId])

  // Load sections when template changes
  useEffect(() => {
    if (!templateId || !selectedOrganizationId) {
      setSectionOptions([])
      setSectionId("")
      return
    }
    setIsLoadingSections(true)
    setSectionId("")
    getTemplateById(templateId, selectedOrganizationId)
      .then((template) => {
        const sections = (template.sections || []) as TemplateSection[]
        const sorted = [...sections].sort((a, b) => a.order - b.order)
        setSectionOptions(
          sorted.map((s, i) => ({
            label: `${i + 1} · ${s.name}`,
            value: s.id,
          }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoadingSections(false))
  }, [templateId, selectedOrganizationId])

  // Load LLMs
  const loadLLMs = useCallback(async () => {
    setIsLoadingLLMs(true)
    try {
      const llms = await getLLMs()
      setAvailableLLMs(llms)
      if (llms.length > 0) {
        try {
          const defaultLLM = await getDefaultLLM()
          setLlmId(defaultLLM.id)
        } catch {
          setLlmId(llms[0].id)
        }
      }
    } catch (err) {
      console.error("Failed to load LLMs:", err)
    } finally {
      setIsLoadingLLMs(false)
    }
  }, [])

  useEffect(() => {
    loadLLMs()
  }, [loadLLMs])

  const showLlmModel = editType === "execute-ai"
  const showAiOptions = editType === "execute-ai" || editType === "edit-ai"

  const llmOptions: HuemulFieldOption[] = availableLLMs.map((llm) => ({
    label: llm.is_default ? `${llm.name} (${t("massExecution.default")})` : llm.name,
    value: llm.id,
  }))

  const editTypeOptions: {
    key: EditType
    icon: React.ElementType
    title: string
    description: string
  }[] = [
    {
      key: "execute-ai",
      icon: Bot,
      title: t("massExecution.editTypes.executeAi.title"),
      description: t("massExecution.editTypes.executeAi.description"),
    },
    {
      key: "edit-ai",
      icon: PenLine,
      title: t("massExecution.editTypes.editAi.title"),
      description: t("massExecution.editTypes.editAi.description"),
    },
    // Manual edit hidden for now
    // {
    //   key: "manual",
    //   icon: Pencil,
    //   title: t("massExecution.editTypes.manual.title"),
    //   description: t("massExecution.editTypes.manual.description"),
    // },
  ]

  const executionModeOptions: {
    key: ExecutionMode
    icon: React.ElementType
    title: string
    description: string
  }[] = [
    {
      key: "single",
      icon: Play,
      title: t("massExecution.executionModes.single.title"),
      description: t("massExecution.executionModes.single.description"),
    },
    {
      key: "from",
      icon: FastForward,
      title: t("massExecution.executionModes.from.title"),
      description: t("massExecution.executionModes.from.description"),
    },
  ]

  const editAiModeOptions: {
    key: ExecutionMode
    icon: React.ElementType
    title: string
    description: string
  }[] = [
    {
      key: "review",
      icon: Eye,
      title: t("massExecution.executionModes.review.title"),
      description: t("massExecution.executionModes.review.description"),
    },
    {
      key: "save",
      icon: Save,
      title: t("massExecution.executionModes.save.title"),
      description: t("massExecution.executionModes.save.description"),
    },
  ]

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Step 1: Template */}
      <div>
        <StepHeader step={1} label={t("massExecution.steps.template")} />
        <HuemulField
          type="combobox"
          label=""
          name="template"
          value={templateId}
          onChange={(v) => {
            const val = String(v)
            setTemplateId(val)
            onTemplateChange?.(val)
          }}
          options={templateOptions}
          placeholder={
            isLoadingTemplates
              ? t("massExecution.loadingTemplates")
              : t("massExecution.selectTemplate")
          }
          disabled={isLoadingTemplates}
        />
      </div>

      {/* Step 2: Section */}
      <div>
        <StepHeader step={2} label={t("massExecution.steps.section")} />
        <HuemulField
          type="combobox"
          label=""
          name="section"
          value={sectionId}
          onChange={(v) => setSectionId(String(v))}
          options={sectionOptions}
          placeholder={
            isLoadingSections
              ? t("massExecution.loadingSections")
              : t("massExecution.selectSection")
          }
          disabled={!templateId || isLoadingSections}
        />
      </div>

      {/* Step 3: Edit type */}
      <div>
        <StepHeader step={3} label={t("massExecution.steps.editType")} />
        <div className="flex flex-col gap-2">
          {editTypeOptions.map((opt) => (
            <SelectionCard
              key={opt.key}
              selected={editType === opt.key}
              onClick={() => {
                setEditType(opt.key)
                setExecutionMode(opt.key === "execute-ai" ? "single" : "review")
              }}
              icon={opt.icon}
              title={opt.title}
              description={opt.description}
            />
          ))}
        </div>
      </div>

      {/* LLM Model (only for execute-ai) */}
      {showLlmModel && (
        <div className="flex flex-col gap-4">
          <HuemulField
            type="select"
            label={t("massExecution.llmModel")}
            name="llm-model"
            required
            value={llmId}
            onChange={(v) => setLlmId(String(v))}
            options={llmOptions}
            placeholder={
              isLoadingLLMs
                ? t("massExecution.loadingModels")
                : t("massExecution.selectModel")
            }
            disabled={isLoadingLLMs || availableLLMs.length === 0}
          />
          {isLoadingLLMs && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("massExecution.loadingModels")}
            </div>
          )}
        </div>
      )}

      {/* Instructions (for both AI types) */}
      {showAiOptions && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mass-exec-instructions" className="text-sm font-medium">
            {t("massExecution.instructions")}
          </Label>
          <Textarea
            id="mass-exec-instructions"
            placeholder={t("massExecution.instructionsPlaceholder")}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
      )}

      {/* Step 4: Execution mode */}
      {showAiOptions && (
        <div>
          <StepHeader step={4} label={t("massExecution.steps.executionMode")} />
          <div className="flex flex-col gap-2">
            {(editType === "execute-ai" ? executionModeOptions : editAiModeOptions).map((opt) => (
              <SelectionCard
                key={opt.key}
                selected={executionMode === opt.key}
                onClick={() => setExecutionMode(opt.key)}
                icon={opt.icon}
                title={opt.title}
                description={opt.description}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
