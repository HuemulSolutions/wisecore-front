import { Folder as FolderIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LoadingOverlayProps {
  message?: string;
  subtitle?: string;
}

/**
 * Loading overlay component that displays a centered loading animation
 * Covers the entire parent container with a semi-transparent backdrop
 */
export function LoadingOverlay({ 
  message, 
  subtitle 
}: LoadingOverlayProps) {
  const { t } = useTranslation('assets');
  const displayMessage = message ?? t('loadingOverlay.message');
  const displaySubtitle = subtitle ?? t('loadingOverlay.subtitle');
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <FolderIcon className="h-8 w-8 animate-pulse text-blue-500 mr-2" />
          <div className="flex space-x-1">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-700">{displayMessage}</p>
        <p className="text-xs text-gray-500 mt-1">{displaySubtitle}</p>
      </div>
    </div>
  );
}
