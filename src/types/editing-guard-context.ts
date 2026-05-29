export interface EditingGuardContextValue {
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
