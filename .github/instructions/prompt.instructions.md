---
applyTo: '**'
---
Coding standards, domain knowledge, and preferences that AI should follow.
App name: Wisecore
Use tanstack query and shadcn/ui for the frontend when applicable.
Always use hover:cursor-pointer for buttons and interactive elements.
Use lucide icons for icons in the frontend.
Use english as the primary language for the UI.

When working with Radix Dialogs/AlertDialogs, follow these guidelines:
- Make sure any Radix Dialog/AlertDialog uses its own lifecycle instead of toggling local state directly:
- Funnel all open/close paths through shared helpers (openDialog/closeDialog) that call Radix’s onOpenChange.
- When the trigger lives inside a dropdown, context menu, or tooltip, open the dialog via onSelect (or equivalent) with a setTimeout so the menu fully closes before the dialog appears.
- Ensure cancel buttons use DialogClose/AlertDialogCancel (or DialogClose asChild) rather than manually setting state.
- If the dialog closes because of a mutation or navigation, have me call the shared closeDialog() helper so Radix sees the close event and releases its focus trap.