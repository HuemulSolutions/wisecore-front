import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { SECTION_TYPE_META, sectionTypeBadge } from "./section-type-meta";
import type { SectionContextOption, SectionContextPickerProps } from "@/types/sections/blocks";
export type { SectionContextPickerProps } from "@/types/sections/blocks";

/** Estilo fijo de los chips ya seleccionados — igual para todos, sin importar el tipo de sección (el tipo ya se ve en el badge de cada fila del popover). */
const SELECTED_CHIP_STYLE = { backgroundColor: SECTION_TYPE_META.ai.tint, color: SECTION_TYPE_META.ai.color };

/**
 * Combobox de las secciones que una sección IA puede usar como contexto: lo
 * ya seleccionado se ve como chips, y el popover ofrece buscador + el resto
 * de las opciones. Se arma con los primitivos base (no `HuemulCombobox`: ese
 * wrapper no permite un render custom por opción, y acá necesitamos posición
 * + nombre + badge de tipo + tag "posterior a esta" por fila). Solo ofrece
 * secciones anteriores a la actual; una dependencia ya guardada hacia una
 * sección posterior (configuración vieja) se sigue listando marcada, pero
 * solo puede desmarcarse — no puede crearse una nueva así.
 */
export function SectionContextPicker({
  options,
  selectedIds,
  onChange,
  disabled,
}: SectionContextPickerProps) {
  const { t } = useTranslation(["sections", "templates"]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const anchorRef = useComboboxAnchor();

  if (options.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#d7dde5] bg-white p-3">
        <p className="text-xs text-[#64748b]">{t("sections:form.aiContext.emptyFirstSection")}</p>
      </div>
    );
  }

  const optionById = new Map(options.map((option) => [option.id, option]));
  const selectedOptions = selectedIds
    .map((id) => optionById.get(id))
    .filter((option): option is SectionContextOption => !!option);

  const filteredOptions = search.trim()
    ? options.filter((option) => option.name.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  const handleValueChange = (next: SectionContextOption[]) => {
    onChange(next.map((option) => option.id));
    setSearch("");
  };

  return (
    <Combobox
      multiple
      value={selectedOptions}
      onValueChange={handleValueChange as never}
      filter={null}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
      inputValue={search}
      onInputValueChange={setSearch}
      isItemEqualToValue={(a: SectionContextOption, b: SectionContextOption) => a?.id === b?.id}
      itemToStringLabel={(o: SectionContextOption) => o?.name ?? ""}
      itemToStringValue={(o: SectionContextOption) => o?.id ?? ""}
    >
      <ComboboxChips ref={anchorRef} className="w-full hover:cursor-pointer">
        <ComboboxValue>
          {(value: SectionContextOption[]) => (
            <>
              {value.map((option) => (
                <ComboboxChip key={option.id} style={SELECTED_CHIP_STYLE}>
                  {option.position}. {option.name}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={t("sections:form.aiContext.searchPlaceholder")} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        <ComboboxList>
          {filteredOptions.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-[#64748b]">
              {t("sections:form.aiContext.noSearchResults")}
            </p>
          ) : (
            filteredOptions.map((option) => {
              const checked = selectedIds.includes(option.id);
              const badge = sectionTypeBadge(option.type, t);
              // Una fila posterior solo aparece si ya estaba seleccionada (compatibilidad) —
              // se puede desmarcar para limpiarla, pero no crear una nueva así.
              const rowDisabled = option.isLaterSection && !checked;
              return (
                <ComboboxItem key={option.id} value={option} disabled={rowDisabled}>
                  <span className="min-w-0 flex-1 truncate">
                    {option.position}. {option.name}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: badge.tint, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  {option.isLaterSection && (
                    <span className="shrink-0 text-[11px] text-[#94a3b8]">
                      {t("sections:form.aiContext.laterSectionTag")}
                    </span>
                  )}
                </ComboboxItem>
              );
            })
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
