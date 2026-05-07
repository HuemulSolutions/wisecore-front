import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Download, Loader2, Upload, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { WordDocxIcon } from "@/components/icons/word-docx-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { uploadDocxTemplate } from "@/services/docx_template";
import { exportExecutionCustomWord, getAvailableDocxTemplatesForExecution } from "@/services/executions";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/organization-context";
import { useTranslation } from "react-i18next";

interface CustomWordExportSheetProps {
  selectedFile: {
    id: string;
    name: string;
    type: "folder" | "document";
  } | null;
  selectedExecutionId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomWordExportDialog({
  selectedFile,
  selectedExecutionId,
  isOpen,
  onOpenChange,
}: CustomWordExportSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile_, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const { selectedOrganizationId } = useOrganization();
  const { t } = useTranslation('assets');
  const queryClient = useQueryClient();

  const availableTemplatesKey = ['available-docx-templates-execution', selectedExecutionId, selectedOrganizationId];

  const { data: availableTemplates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: availableTemplatesKey,
    queryFn: () => getAvailableDocxTemplatesForExecution(selectedExecutionId!, selectedOrganizationId!),
    enabled: isOpen && !!selectedExecutionId && !!selectedOrganizationId,
  });

  // Mutation for uploading template
  const uploadTemplateMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedFile?.id || !selectedOrganizationId) {
        throw new Error('Document ID or organization ID not available');
      }
      setIsUploading(true);
      return uploadDocxTemplate(selectedFile.id, file, selectedOrganizationId);
    },
    meta: { successMessage: t('exportCustomWord.templateUploaded') },
    onSuccess: (uploadedTemplate) => {
      queryClient.invalidateQueries({ queryKey: availableTemplatesKey });
      setSelectedTemplateId(uploadedTemplate.id);
      return uploadedTemplate;
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  // Mutation for exporting with custom template
  const exportMutation = useMutation({
    mutationFn: async (docxTemplateId?: string) => {
      if (!selectedExecutionId || !selectedOrganizationId) {
        throw new Error('Execution ID or organization ID not available');
      }
      return exportExecutionCustomWord(selectedExecutionId, selectedOrganizationId, { docxTemplateId });
    },
    meta: { successMessage: t('exportCustomWord.documentExported') },
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast.error(t('exportCustomWord.selectDocxFile'));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadAndExport = async () => {
    if (!selectedFile_) {
      toast.error(t('exportCustomWord.selectTemplateFile'));
      return;
    }

    try {
      const uploaded = await uploadTemplateMutation.mutateAsync(selectedFile_);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await exportMutation.mutateAsync(uploaded.id);
    } catch (error) {
      console.error('Error in upload and export:', error);
    }
  };

  const handleExportWithTemplate = async (docxTemplateId: string) => {
    try {
      await exportMutation.mutateAsync(docxTemplateId);
    } catch (error) {
      console.error('Error exporting with existing template:', error);
    }
  };

  const isProcessing = uploadTemplateMutation.isPending || exportMutation.isPending || isUploading;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[90vw] lg:max-w-[600px] max-h-[80vh] overflow-hidden">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <FileUp className="h-4 w-4" />
                  {t('exportCustomWord.title')}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  {t('exportCustomWord.description')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t('exportCustomWord.uploadNewTemplate')}
                </h3>
                <div className="border border-dashed border-gray-300 rounded-lg p-3 hover:border-[#4464f7] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 shrink-0 bg-[#4464f7]/10 rounded-full flex items-center justify-center">
                      <FileUp className="h-4 w-4 text-[#4464f7]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          onClick={handleFileSelect}
                          variant="outline"
                          size="sm"
                          disabled={isProcessing}
                          className="hover:cursor-pointer hover:border-[#4464f7] hover:text-[#4464f7]"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {t('exportCustomWord.selectDocxTemplate')}
                        </Button>
                        <p className="text-xs text-gray-500">{t('exportCustomWord.onlyDocxSupported')}</p>
                      </div>
                      {selectedFile_ && (
                        <p className="text-xs font-medium text-green-700 mt-1 truncate">
                          {t('exportCustomWord.selected', { name: selectedFile_.name })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedFile_ && (
                  <Button
                    onClick={handleUploadAndExport}
                    disabled={isProcessing}
                    className="w-full bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {uploadTemplateMutation.isPending ? t('exportCustomWord.uploadingTemplate') : t('exportCustomWord.exporting')}
                      </>
                    ) : (
                      <>
                        <FileUp className="h-4 w-4 mr-2" />
                        {t('exportCustomWord.uploadAndExport')}
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500 font-medium">{t('exportCustomWord.or')}</span>
                </div>
              </div>

              {/* Use Existing Template Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t('exportCustomWord.availableTemplates')}
                </h3>
                <HuemulField
                  type="combobox"
                  label=""
                  name="docx-template"
                  value={selectedTemplateId ?? ""}
                  onChange={(v) => setSelectedTemplateId(String(v) || null)}
                  options={(availableTemplates ?? []).map((tpl) => ({
                    label: tpl.name,
                    value: tpl.id,
                    description: tpl.source_type === 'document'
                      ? t('exportCustomWord.sourceDocument')
                      : t('exportCustomWord.sourceTemplate'),
                    icon: WordDocxIcon as unknown as LucideIcon,
                  }))}
                  placeholder={
                    isLoadingTemplates
                      ? t('exportCustomWord.loadingTemplates')
                      : !availableTemplates?.length
                      ? t('exportCustomWord.noTemplatesAvailable')
                      : t('exportCustomWord.selectDocxTemplate')
                  }
                  disabled={isProcessing || isLoadingTemplates || !availableTemplates?.length}
                />

                <Button
                  onClick={() => selectedTemplateId && handleExportWithTemplate(selectedTemplateId)}
                  disabled={isProcessing || !selectedTemplateId}
                  variant="outline"
                  className="w-full hover:cursor-pointer hover:border-[#4464f7] hover:text-[#4464f7]"
                >
                  {exportMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('exportCustomWord.exporting')}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      {t('exportCustomWord.export')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}