import { useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

import { errorMessage } from "./format";
import { secondaryButton, strongDangerButton } from "./styles";

// Confirm step for destructive actions (delete a chat, clear memory). Radix
// Dialog gives the focus trap, Escape-to-close and focus return; on open we
// focus Cancel so a stray Enter never destroys anything. While the request is
// in flight the dialog can't be dismissed, and a failure is shown in place.

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  busyLabel,
  onConfirm,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  busyLabel: string;
  /** Resolves → the dialog closes; throws → it stays open with the error shown. */
  onConfirm: () => Promise<void>;
  /** Where focus goes after closing (default: back to the trigger). */
  onCloseAutoFocus?: (e: Event) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <ConfirmBody
          title={title}
          description={description}
          confirmLabel={confirmLabel}
          busyLabel={busyLabel}
          onConfirm={onConfirm}
          close={() => onOpenChange(false)}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
    </Dialog>
  );
}

// Mounted only while open, so busy/error state starts fresh every time.
function ConfirmBody({
  title,
  description,
  confirmLabel,
  busyLabel,
  onConfirm,
  close,
  onCloseAutoFocus,
}: {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  busyLabel: string;
  onConfirm: () => Promise<void>;
  close: () => void;
  onCloseAutoFocus?: (e: Event) => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
      return;
    }
    close();
  };

  return (
    <DialogContent
      showCloseButton={false}
      aria-busy={busy}
      className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-md"
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        cancelRef.current?.focus();
      }}
      onCloseAutoFocus={onCloseAutoFocus}
      onEscapeKeyDown={(e) => {
        if (busy) e.preventDefault();
      }}
      onInteractOutside={(e) => {
        if (busy) e.preventDefault();
      }}
    >
      <div className="space-y-2">
        <DialogTitle className="text-lg font-bold leading-snug text-heading">{title}</DialogTitle>
        <DialogDescription className="text-sm leading-6 text-muted-foreground">{description}</DialogDescription>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button ref={cancelRef} type="button" onClick={close} disabled={busy} className={secondaryButton}>
          Cancel
        </button>
        <button type="button" onClick={confirm} disabled={busy} className={strongDangerButton}>
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </DialogContent>
  );
}
