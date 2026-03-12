import { useState, useEffect, useRef } from "react";
import { Pencil, FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HuemulDialog } from "@/huemul/components/huemul-dialog";

interface ContextItem {
  id: string;
  name: string;
  content: string;
  context_type?: string;
}

interface EditContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ContextItem | null;
  onConfirm: (id: string, name: string, content: string, file?: File) => void;
  isProcessing: boolean;
}

export function EditContextDialog({
  open,
  onOpenChange,
  context,
  onConfirm,
  isProcessing,
}: EditContextDialogProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFileContext = context?.context_type === "file";

  useEffect(() => {
    if (context && open) {
      setName(context.name);
      setContent(context.content);
      setUploadedFile(null);
    }
  }, [context, open]);

  const handleConfirm = () => {
    if (!context) return;

    if (isFileContext) {
      if (uploadedFile) {
        onConfirm(context.id, name.trim(), "", uploadedFile);
      } else {
        onConfirm(context.id, name.trim(), content);
      }
    } else {
      if (name.trim() && content.trim()) {
        onConfirm(context.id, name.trim(), content.trim());
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const isSaveDisabled = isFileContext
    ? !name.trim()
    : !name.trim() || !content.trim();

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Context"
      description={
        isFileContext
          ? "Update the name or replace the file for this context."
          : "Update the name and content of this context."
      }
      icon={Pencil}
      maxWidth="sm:max-w-lg"
      showFooter={true}
      showCancelButton={true}
      cancelLabel="Cancel"
      saveAction={{
        label: "Save Changes",
        onClick: handleConfirm,
        disabled: isSaveDisabled,
        loading: isProcessing,
        closeOnSuccess: false,
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="edit-name"
            className="text-xs font-medium text-gray-600 uppercase tracking-wide"
          >
            Context Name
          </Label>
          <Input
            id="edit-name"
            placeholder="Enter context name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        {isFileContext ? (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Replace File (optional)
            </Label>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              disabled={isProcessing}
              accept=".txt,.md,.pdf,.doc,.docx"
              className="hidden"
            />

            {!uploadedFile ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleFileInputClick}
                disabled={isProcessing}
                className="w-full h-10 justify-start text-left font-normal hover:cursor-pointer border-dashed border-2"
              >
                <Upload className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-500">Choose a new file to replace...</span>
              </Button>
            ) : (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-blue-900">
                      {uploadedFile.name}
                    </span>
                    <span className="text-xs text-blue-600">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleFileInputClick}
                    disabled={isProcessing}
                    className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 hover:cursor-pointer"
                    title="Change file"
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFile}
                    disabled={isProcessing}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:cursor-pointer"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500">
              If no new file is selected, the existing content will be kept.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label
              htmlFor="edit-content"
              className="text-xs font-medium text-gray-600 uppercase tracking-wide"
            >
              Context Content
            </Label>
            <Textarea
              id="edit-content"
              placeholder="Enter context content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        )}
      </div>
    </HuemulDialog>
  );
}
