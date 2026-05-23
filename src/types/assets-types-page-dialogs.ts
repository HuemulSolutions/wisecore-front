import type { AssetTypePageState } from './assets-types'
import type { useAssetTypeMutations } from '@/hooks/useAssetTypes'

export interface AssetTypePageDialogsProps {
  state: AssetTypePageState
  onCloseDialog: (dialog: keyof AssetTypePageState) => void
  onUpdateState: (updates: Partial<AssetTypePageState>) => void
  assetTypeMutations: ReturnType<typeof useAssetTypeMutations>
}
