import * as React from 'react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/organization-context';
import { uploadMedia, getMediaDownloadUrl } from '@/services/media';

export interface EditorUploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
  mediaId: string;
}

/**
 * Hook for uploading files from the Plate rich-text editor.
 * Uploads to the backend media service using the current organization context
 * and returns a compatible interface with the rest of the editor upload flow.
 */
export function useEditorUploadFile() {
  const { selectedOrganizationId } = useOrganization();

  const [uploadedFile, setUploadedFile] = React.useState<EditorUploadedFile>();
  const [uploadingFile, setUploadingFile] = React.useState<File>();
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);

  const progressIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressInterval = () => {
    if (progressIntervalRef.current !== null) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  async function uploadFile(file: File) {
    if (!selectedOrganizationId) {
      toast.error('No organization selected. Cannot upload file.');
      return;
    }

    setIsUploading(true);
    setUploadingFile(file);
    setProgress(0);

    // Simulate incremental progress since fetch doesn't expose upload progress
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => (prev < 85 ? prev + 5 : prev));
    }, 150);

    try {
      const media = await uploadMedia(selectedOrganizationId, {
        file,
        level: 'organization',
        name: file.name,
      });

      clearProgressInterval();
      setProgress(95);

      const downloadUrl = await getMediaDownloadUrl(selectedOrganizationId, media.id);

      setProgress(100);

      const result: EditorUploadedFile = {
        url: downloadUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        mediaId: media.id,
      };

      setUploadedFile(result);
      return result;
    } catch {
      clearProgressInterval();
      toast.error('Failed to upload file. Please try again.');
    } finally {
      clearProgressInterval();
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile,
    uploadingFile,
  };
}
