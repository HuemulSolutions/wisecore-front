import * as React from "react";
import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Mismos tokens de superficie que el resto del panel.
const PANEL_SURFACE = "rounded-lg border border-border bg-card p-4 shadow-card";

export interface WorkflowExpressNameFormProps {
  namePlaceholder?: string;
  isCreating?: boolean;
  onSubmit: (name: string, description?: string) => void;
}

/** Paso previo del express que exige nombre al iniciar (`template.require_name_on_express`):
 *  pide nombre/descripción antes de crear el documento. Dueño de sus propios `nameValue`/
 *  `descriptionValue` — el panel ya no los mantiene. */
export function WorkflowExpressNameForm({ namePlaceholder, isCreating, onSubmit }: WorkflowExpressNameFormProps) {
  const { t } = useTranslation("workflow");
  const { t: tCommon } = useTranslation("common");
  const [nameValue, setNameValue] = React.useState("");
  const [descriptionValue, setDescriptionValue] = React.useState("");

  return (
    <div className={`${PANEL_SURFACE} flex flex-col gap-4`}>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{t("expressSheet.welcomeTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("expressSheet.welcomeDescription")}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workflow-express-name" className="text-xs text-muted-foreground font-normal">
          {t("expressSheet.name")}
          <span className="text-destructive"> *</span>
        </Label>
        <Input
          id="workflow-express-name"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          placeholder={namePlaceholder ?? t("expressSheet.namePlaceholder")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workflow-express-description" className="text-xs text-muted-foreground font-normal">
          {t("expressSheet.description")}
        </Label>
        <Textarea
          id="workflow-express-description"
          value={descriptionValue}
          onChange={(e) => setDescriptionValue(e.target.value)}
          placeholder={t("expressSheet.descriptionPlaceholder")}
          rows={4}
        />
      </div>
      <HuemulButton
        label={tCommon("next")}
        loading={isCreating}
        disabled={nameValue.trim().length === 0}
        onClick={() => onSubmit(nameValue.trim(), descriptionValue.trim() || undefined)}
        className="self-end"
      />
    </div>
  );
}
