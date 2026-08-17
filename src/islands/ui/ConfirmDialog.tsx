import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'

interface Props {
  open: boolean
  title: string
  description: string
  cancelLabel: string
  confirmLabel: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** shadcn-style confirmation dialog backed by Radix AlertDialog. */
export function ConfirmDialog({ open, title, description, cancelLabel, confirmLabel, onOpenChange, onConfirm }: Props) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="aa-alert-dialog-overlay" />
        <AlertDialogPrimitive.Content className="aa-alert-dialog-content">
          <AlertDialogPrimitive.Title className="aa-alert-dialog-title">{title}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="aa-alert-dialog-description">{description}</AlertDialogPrimitive.Description>
          <div className="aa-alert-dialog-actions">
            <AlertDialogPrimitive.Cancel asChild>
              <button className="aa-btn" type="button">
                {cancelLabel}
              </button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <button className="aa-btn aa-alert-dialog-action" type="button" onClick={onConfirm}>
                {confirmLabel}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
