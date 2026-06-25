import type { ReactNode, KeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Value } from 'platejs'

export type HuemulFieldType =
  | "text" | "email" | "password" | "number" | "tel" | "url" | "time"
  | "datetime" | "textarea" | "select" | "checkbox" | "switch" | "file"
  | "combobox" | "color" | "date" | "date-range" | "radio" | "richtext"
  | "async-combobox" | "json"
  | "yes-no" | "linear-scale" | "rating";

export interface HuemulFieldOption {
  label: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  color?: string;
}

export interface HuemulFieldOptionGroup {
  groupLabel: string;
  groupValue?: string;
  options: HuemulFieldOption[];
}

export interface AsyncSelectOption {
  value: string;
  label: string;
  color?: string;
  description?: string;
}

export interface FetchOptionsParams {
  search: string;
  page: number;
  pageSize: number;
}

export interface FetchOptionsResult {
  options: AsyncSelectOption[];
  hasMore: boolean;
  totalCount?: number;
}

export interface HuemulFieldLabelAction {
  icon: LucideIcon;
  onClick: () => void;
  tooltip?: string;
}

export interface HuemulFieldProps {
  type?: HuemulFieldType;
  label?: string;
  name?: string;
  id?: string;
  required?: boolean;
  helpText?: string;
  labelAction?: HuemulFieldLabelAction;
  value?: string | number | boolean;
  onChange?: (value: string | number | boolean) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  options?: HuemulFieldOption[];
  groupedOptions?: HuemulFieldOptionGroup[];
  accept?: string;
  multiple?: boolean;
  onFileChange?: (files: FileList | null) => void;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  checkLabel?: string;
  richTextValue?: Value;
  onRichTextChange?: (value: Value) => void;
  richTextMinHeight?: string;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  onDateRangeChange?: (from: string, to: string) => void;
  dateValue?: string;
  onDateChange?: (value: string) => void;
  inline?: boolean;
  labelFirst?: boolean;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  fetchOptions?: (params: FetchOptionsParams) => Promise<FetchOptionsResult>;
  pageSize?: number;
  debounceMs?: number;
  selectedLabel?: string;
  selectedColor?: string;
  /** Fires (alongside `onChange`) with the resolved option label when an
   *  async-combobox value is picked or cleared. Lets callers cache display names. */
  onSelectedLabelChange?: (label?: string) => void;
  asyncStaticOptions?: AsyncSelectOption[];
  asyncStaticOptionsLabel?: string;
  asyncResultsLabel?: string;
  selectSize?: "sm" | "default" | "xs";
  controlClassName?: string;
  children?: ReactNode;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  searchOnEnter?: boolean;
}

export interface HuemulFieldGroupProps {
  title?: string;
  description?: string;
  gap?: string;
  className?: string;
  children: ReactNode;
}
