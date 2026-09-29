import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AssetsTemplateInstructionsCardProps {
  instructions: string;
  templateName?: string | null;
}

/**
 * Card colapsable con las instrucciones de la plantilla, arriba del contenido
 * del documento y antes de la primera sección. Arranca colapsada.
 */
export function AssetsTemplateInstructionsCard({
  instructions,
  templateName,
}: AssetsTemplateInstructionsCardProps) {
  const { t } = useTranslation(["assets"]);
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  const paragraphs = instructions
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <div className="not-prose mb-[28px] flex flex-col rounded-[10px] bg-[#f5f8ff] shadow-[inset_0_0_0_1px_#e3ebfb]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-[10px] border-0 bg-transparent px-[14px] py-[11px] text-left"
      >
        <span
          aria-hidden="true"
          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] bg-[#eff5ff] text-[12px] font-bold text-[#1d4ed8]"
        >
          i
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-[#0f172a]">
          {t("content.templateInstructionsTitle")}
        </span>
        {templateName && (
          <span
            title={templateName}
            className="min-w-0 truncate text-[12.5px] font-normal text-[#64748b]"
          >
            {templateName}
          </span>
        )}
        <span className="flex-1" />
        <Chevron className="h-[15px] w-[15px] shrink-0 text-[#94a3b8]" strokeWidth={2} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={bodyId}
          className="flex flex-col gap-[6px] pb-[14px] pl-[46px] pr-[16px] pt-0 text-[13px] leading-[1.6] text-[#334155]"
        >
          {paragraphs.map((p, i) => (
            <p key={i} className="m-0">
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
