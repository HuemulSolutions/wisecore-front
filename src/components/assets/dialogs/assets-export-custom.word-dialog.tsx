import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileUp, Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { uploadDocxTemplate } from "@/services/docx_template";
import { exportExecutionCustomWord } from "@/services/executions";
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
  const { selectedOrganizationId } = useOrganization();
  const { t } = useTranslation('assets');

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
    onSuccess: () => {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  // Mutation for exporting with custom template
  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExecutionId || !selectedOrganizationId) {
        throw new Error('Execution ID or organization ID not available');
      }
      return exportExecutionCustomWord(selectedExecutionId, selectedOrganizationId);
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

    console.log('Starting upload and export process...');
    console.log('Selected file:', selectedFile_.name, 'Size:', selectedFile_.size);
    console.log('Document ID:', selectedFile?.id);
    console.log('Organization ID:', selectedOrganizationId);

    try {
      // First upload the template
      console.log('Uploading template...');
      await uploadTemplateMutation.mutateAsync(selectedFile_);
      
      // Then export with the custom template
      console.log('Exporting with template...');
      await exportMutation.mutateAsync();
    } catch (error) {
      console.error('Error in upload and export:', error);
    }
  };

  const handleExportWithExistingTemplate = async () => {
    try {
      await exportMutation.mutateAsync();
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {t('exportCustomWord.uploadNewTemplate')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('exportCustomWord.selectDocxDescription')}
                  </p>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#4464f7] transition-colors">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-[#4464f7]/10 rounded-full flex items-center justify-center">
                      <FileUp className="h-6 w-6 text-[#4464f7]" />
                    </div>
                    <div className="space-y-3">
                      <Button
                        onClick={handleFileSelect}
                        variant="outline"
                        disabled={isProcessing}
                        className="hover:cursor-pointer hover:border-[#4464f7] hover:text-[#4464f7]"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t('exportCustomWord.selectDocxTemplate')}
                      </Button>
                      <p className="text-xs text-gray-500">
                        {t('exportCustomWord.onlyDocxSupported')}
                      </p>
                    </div>
                    {selectedFile_ && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          {t('exportCustomWord.selected', { name: selectedFile_.name })}
                        </p>
                      </div>
                    )}
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {t('exportCustomWord.useExistingTemplate')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('exportCustomWord.existingDescription')}
                  </p>
                </div>
                <Button
                  onClick={handleExportWithExistingTemplate}
                  disabled={isProcessing}
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
                      {t('exportCustomWord.exportWithExisting')}
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