import { useTranslation } from "react-i18next";
import { HuemulField } from "@/huemul/components/huemul-field";
import { HuemulQuestionInput, type HuemulQuestionInputValue } from "@/huemul/components/huemul-question-input";
import { getQuestionTypePlaceholder, NUMERIC_DATA_TYPES, QUESTION_TYPE, questionTypeLabel } from "./question-type-meta";
import { SectionFieldSeparator } from "./section-field-separator";

// Caja gris de vista previa (mismo estilo compartido entre sections y custom fields).
export function PreviewBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md bg-gray-50 p-3">{children}</div>;
}

interface QuestionTypePreviewOption {
  id: string;
  label: string;
}

interface QuestionTypePreviewProps {
  questionType: string;
  dataType?: string | null;
  options?: QuestionTypePreviewOption[];
  minValue?: number | null;
  maxValue?: number | null;
  minLabel?: string;
  maxLabel?: string;
  fieldName?: string;
  required?: boolean;
}

// Resuelve un valor "vacío" acorde al tipo de widget que renderizará HuemulQuestionInput,
// para que el preview se vea sin responder (sin selección, sin texto) en vez de con un
// valor por default engañoso.
function emptyValueFor(questionType: string, dataType?: string | null): HuemulQuestionInputValue {
  if (questionType === QUESTION_TYPE.dropdownMultiple) return [];
  if (
    questionType === QUESTION_TYPE.number ||
    questionType === QUESTION_TYPE.decimal ||
    questionType === QUESTION_TYPE.linearScale ||
    questionType === QUESTION_TYPE.rating ||
    questionType === QUESTION_TYPE.yesNo
  ) {
    return null;
  }
  if (!questionType && NUMERIC_DATA_TYPES.includes(dataType ?? "")) return null;
  return "";
}

// Vista previa visual por question type, compartida entre el builder de secciones (form
// fields), la vista de solo lectura de una sección tipo form y el preview de custom fields,
// para que las tres se vean exactamente igual al control real que se usa al completar el
// formulario (HuemulQuestionInput, ver ia context/question-type-input-guide.md). Los
// controles se envuelven en un <div inert> — bloquea click/foco/teclado sin aplicar el
// opacity-50 que traería pasar `disabled`, así el preview no se ve "apagado".
export function QuestionTypePreview({
  questionType,
  dataType,
  options = [],
  minValue,
  maxValue,
  minLabel,
  maxLabel,
  fieldName,
  required,
}: QuestionTypePreviewProps) {
  const { t } = useTranslation("sections");

  if (questionType === QUESTION_TYPE.customField) return null;

  if (questionType === QUESTION_TYPE.label) {
    return <SectionFieldSeparator name={fieldName || t("form.formFields.fieldName")} />;
  }

  // carga_de_archivos y el fallback data_type "image" no tienen widget propio en
  // HuemulQuestionInput (cada consumidor real tiene su propio flujo de upload) — acá se
  // muestra el mismo botón real que usa el formulario (FileInputField vía HuemulField).
  const isFileLike = questionType === QUESTION_TYPE.fileUpload || dataType === "image";

  const control = isFileLike ? (
    <PreviewBox>
      <div inert>
        <HuemulField type="file" label="" />
      </div>
    </PreviewBox>
  ) : (
    <PreviewBox>
      <div inert>
        <HuemulQuestionInput
          questionType={questionType}
          dataType={dataType}
          value={emptyValueFor(questionType, dataType)}
          onChange={() => {}}
          options={options}
          min={typeof minValue === "number" ? minValue : undefined}
          max={typeof maxValue === "number" ? maxValue : undefined}
          minLabel={minLabel}
          maxLabel={maxLabel}
          placeholder={getQuestionTypePlaceholder(questionType, t)}
        />
      </div>
    </PreviewBox>
  );

  if (!fieldName) return control;

  const typeHint = questionTypeLabel(questionType, t);

  return (
    <div className="space-y-1.5">
      <span className="flex items-baseline gap-1.5 text-sm font-semibold text-gray-900">
        <span>
          {fieldName}
          {required && <span className="text-red-500"> *</span>}
        </span>
        {typeHint && <span className="text-xs font-normal text-gray-400">· {typeHint}</span>}
      </span>
      {control}
    </div>
  );
}
