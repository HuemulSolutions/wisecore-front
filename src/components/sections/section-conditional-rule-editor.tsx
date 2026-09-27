import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { HuemulQuestionInput, type HuemulQuestionInputValue } from "@/huemul/components/huemul-question-input";
import type { CustomFieldDataType } from "@/types/custom-fields/core";
import type { ConditionalBranch, ConditionalRuleNode, SectionFormField } from "@/types/sections/core";
import { FormFieldConditionsEditor } from "./form-field-conditions-editor";
import { validateFieldDependencyConditions } from "./validate-form-field-dependencies";
import { MAX_CALCULATION_DEPTH, type CalculationConfigError } from "./validate-calculation-config";

interface SectionConditionalRuleEditorProps {
  rule: ConditionalRuleNode;
  dataType: CustomFieldDataType;
  ownFieldId: string;
  availableFields: SectionFormField[];
  errors?: CalculationConfigError[];
  onChange: (rule: ConditionalRuleNode) => void;
  disabled?: boolean;
  depth?: number;   // raíz = 1
  path?: string;    // raíz = "root", localiza este nodo en los errores de validateCalculationConfig
}

const literalValueFor = (dataType: CustomFieldDataType): unknown => {
  if (dataType === "bool") return false;
  if (dataType === "int" || dataType === "decimal") return null;
  return "";
};

const emptyRuleNode = (): ConditionalRuleNode => ({
  if: [],
  then: { type: "value", value: null },
  else: { type: "value", value: null },
});

function toInputValue(value: unknown): HuemulQuestionInputValue {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") return value;
  return String(value);
}

// Editor recursivo de campo_calculado_condicional, hasta MAX_CALCULATION_DEPTH niveles (ver
// ia context/campos-calculados-en-formularios-guide.md). El `if` reusa exactamente el mismo
// bloque de condiciones que depends_on (FormFieldConditionsEditor) — mismos operadores,
// mismo picker de campo — con duplicados permitidos (ej. "gt 10 AND lt 20" sobre un campo).
export function SectionConditionalRuleEditor({
  rule,
  dataType,
  ownFieldId,
  availableFields,
  errors,
  onChange,
  disabled,
  depth = 1,
  path = "root",
}: SectionConditionalRuleEditorProps) {
  const { t } = useTranslation("sections");
  const conditions = rule.if ?? [];
  const conditionErrors = validateFieldDependencyConditions(ownFieldId, conditions, availableFields, { allowDuplicates: true });
  const nestingError = errors?.some((e) => e.path === path && e.code === "nestingTooDeep");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">{t("form.formFields.calculated.conditional.ifLabel")}</span>
        <Badge variant="secondary" className="font-normal text-[10px]">
          {t("form.formFields.calculated.conditional.levelBadge", { n: depth, max: MAX_CALCULATION_DEPTH })}
        </Badge>
      </div>

      <FormFieldConditionsEditor
        conditions={conditions}
        availableFields={availableFields}
        onChange={(next) => onChange({ ...rule, if: next })}
        disabled={disabled}
        errors={conditionErrors}
        dense
      />
      {conditions.length === 0 && (
        <p className="text-xs text-amber-600">{t("form.formFields.calculated.conditional.emptyConditions")}</p>
      )}
      {nestingError && (
        <p className="text-xs text-red-500">{t("form.formFields.calculated.errors.nestingTooDeep")}</p>
      )}

      <ConditionalBranchEditor
        label={t("form.formFields.calculated.conditional.thenLabel")}
        branch={rule.then}
        dataType={dataType}
        ownFieldId={ownFieldId}
        availableFields={availableFields}
        errors={errors}
        depth={depth}
        path={`${path}.then`}
        onChange={(next) => onChange({ ...rule, then: next })}
        disabled={disabled}
      />
      <ConditionalBranchEditor
        label={t("form.formFields.calculated.conditional.elseLabel")}
        branch={rule.else}
        dataType={dataType}
        ownFieldId={ownFieldId}
        availableFields={availableFields}
        errors={errors}
        depth={depth}
        path={`${path}.else`}
        onChange={(next) => onChange({ ...rule, else: next })}
        disabled={disabled}
      />
    </div>
  );
}

interface ConditionalBranchEditorProps {
  label: string;
  branch: ConditionalBranch;
  dataType: CustomFieldDataType;
  ownFieldId: string;
  availableFields: SectionFormField[];
  errors?: CalculationConfigError[];
  depth: number;
  path: string;
  onChange: (branch: ConditionalBranch) => void;
  disabled?: boolean;
}

// Rama then/else: valor literal (HuemulQuestionInput por data_type) o regla anidada
// (recursión). El toggle a "Regla anidada" se deshabilita al llegar al tope de anidamiento.
function ConditionalBranchEditor({
  label,
  branch,
  dataType,
  ownFieldId,
  availableFields,
  errors,
  depth,
  path,
  onChange,
  disabled,
}: ConditionalBranchEditorProps) {
  const { t } = useTranslation("sections");
  const atMaxDepth = depth >= MAX_CALCULATION_DEPTH;
  const valueMissing =
    branch.type === "value" && errors?.some((e) => e.path === path && e.code === "branchValueRequired");

  return (
    <div className="space-y-2 border-l-2 border-gray-200 pl-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <div className="flex rounded-md border border-gray-200 bg-white text-xs">
          <button
            type="button"
            onClick={() => {
              if (branch.type === "rule") onChange({ type: "value", value: literalValueFor(dataType) });
            }}
            disabled={disabled}
            className={`px-2 py-1 rounded-l-md transition-colors ${
              branch.type === "value" ? "bg-[#4464f7] text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t("form.formFields.calculated.conditional.branchTypeValue")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (branch.type === "value" && !atMaxDepth) onChange({ type: "rule", ...emptyRuleNode() });
            }}
            disabled={disabled || atMaxDepth}
            title={atMaxDepth ? t("form.formFields.calculated.conditional.maxDepthReached") : undefined}
            className={`px-2 py-1 rounded-r-md border-l border-gray-200 transition-colors ${
              branch.type === "rule" ? "bg-[#4464f7] text-white" : "text-gray-600 hover:bg-gray-50"
            } ${atMaxDepth ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {t("form.formFields.calculated.conditional.branchTypeRule")}
          </button>
        </div>
      </div>

      {branch.type === "rule" ? (
        <SectionConditionalRuleEditor
          rule={branch}
          dataType={dataType}
          ownFieldId={ownFieldId}
          availableFields={availableFields}
          errors={errors}
          onChange={(next) => onChange({ type: "rule", ...next })}
          disabled={disabled}
          depth={depth + 1}
          path={path}
        />
      ) : (
        <div className="space-y-1">
          <HuemulQuestionInput
            questionType={undefined}
            dataType={dataType}
            value={toInputValue(branch.value)}
            onChange={(v) => onChange({ type: "value", value: v })}
            label={t("form.formFields.calculated.conditional.resultValue")}
            disabled={disabled}
          />
          {valueMissing && (
            <p className="text-xs text-red-500">{t("form.formFields.calculated.errors.branchValueRequired")}</p>
          )}
        </div>
      )}
    </div>
  );
}
