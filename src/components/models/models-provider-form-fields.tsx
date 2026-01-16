import { Input } from '@/components/ui/input';

interface ProviderFormFieldsProps {
  requiredFields: {
    api_key: boolean;
    endpoint: boolean;
    deployment: boolean;
  };
  defaultValues?: {
    key?: string;
    endpoint?: string;
    deployment?: string;
  };
  disabled?: boolean;
}

export default function ProviderFormFields({
  requiredFields,
  defaultValues = {},
  disabled = false,
}: ProviderFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Show API Key field only if required by provider */}
      {requiredFields.api_key && (
        <div>
          <label className="text-sm font-medium text-gray-900 block mb-2">
            API Key *
          </label>
          <Input
            id="edit-key"
            name="key"
            type="password"
            defaultValue={defaultValues.key}
            placeholder="Enter your API key..."
            className="w-full"
            required
            disabled={disabled}
          />
        </div>
      )}

      {/* Show Endpoint field only if required by provider */}
      {requiredFields.endpoint && (
        <div>
          <label className="text-sm font-medium text-gray-900 block mb-2">
            Endpoint *
          </label>
          <Input
            id="edit-endpoint"
            name="endpoint"
            type="password"
            defaultValue={defaultValues.endpoint}
            placeholder="https://api.example.com/v1"
            className="w-full"
            required
            disabled={disabled}
          />
        </div>
      )}

      {/* Show Deployment field only if required by provider */}
      {requiredFields.deployment && (
        <div>
          <label className="text-sm font-medium text-gray-900 block mb-2">
            Deployment *
          </label>
          <Input
            id="edit-deployment"
            name="deployment"
            type="password"
            defaultValue={defaultValues.deployment}
            placeholder="Enter deployment name..."
            className="w-full"
            required
            disabled={disabled}
          />
        </div>
      )}

      {/* Hidden fields for non-required fields to ensure form data consistency */}
      {!requiredFields.api_key && (
        <input type="hidden" name="key" value="" />
      )}
      {!requiredFields.endpoint && (
        <input type="hidden" name="endpoint" value="" />
      )}
      {!requiredFields.deployment && (
        <input type="hidden" name="deployment" value="" />
      )}
    </div>
  );
}
