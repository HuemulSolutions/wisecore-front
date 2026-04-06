import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"

interface EditingGuardContextValue {
  /** Whether a section is currently being edited */
  isSectionEditing: boolean
  /** Report editing state from a section */
  setIsSectionEditing: (editing: boolean) => void
  /**
   * Wrap an action so it's guarded by unsaved-changes check.
   * If editing, shows alert. If not, runs the action immediately.
   */
  guardedAction: (action: () => void) => void
}

const EditingGuardContext = createContext<EditingGuardContextValue | null>(null)

export function EditingGuardProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("assets")
  const [isSectionEditing, setIsSectionEditing] = useState(false)
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)

  const guardedAction = useCallback(
    (action: () => void) => {
      if (isSectionEditing) {
        pendingActionRef.current = action
        setShowUnsavedAlert(true)
      } else {
        action()
      }
    },
    [isSectionEditing]
  )

  // Block browser refresh / tab close when editing
  useEffect(() => {
    if (!isSectionEditing) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isSectionEditing])

  return (
    <EditingGuardContext.Provider value={{ isSectionEditing, setIsSectionEditing, guardedAction }}>
      {children}
      <HuemulAlertDialog
        open={showUnsavedAlert}
        onOpenChange={setShowUnsavedAlert}
        title={t("unsavedChanges.title")}
        description={t("unsavedChanges.description")}
        actionLabel={t("unsavedChanges.discard")}
        cancelLabel={t("unsavedChanges.keepEditing")}
        actionVariant="destructive"
        onAction={async () => {
          pendingActionRef.current?.()
          pendingActionRef.current = null
          setIsSectionEditing(false)
        }}
      />
    </EditingGuardContext.Provider>
  )
}

export function useEditingGuard() {
  const context = useContext(EditingGuardContext)
  if (!context) {
    throw new Error("useEditingGuard must be used within EditingGuardProvider")
  }
  return context
}

/**
 * Optional hook that returns a no-op guard when outside the provider.
 * Useful for components that may be rendered outside the guard boundary.
 */
export function useOptionalEditingGuard(): EditingGuardContextValue {
  const context = useContext(EditingGuardContext)
  return context ?? {
    isSectionEditing: false,
    setIsSectionEditing: () => {},
    guardedAction: (action) => action(),
  }
}
