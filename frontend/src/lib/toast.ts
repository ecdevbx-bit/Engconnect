import { toast } from 'sonner';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export type ToastDetail = {
  title: string;
  body: string;
  /** Visual variant. Defaults to "error" if omitted. */
  type?: ToastType;
};

/**
 * Fire a Sonner toast. Works from any client component.
 * Renders through the <Toaster> already mounted in layout.tsx.
 */
export function emitToast({ title, body, type = 'error' }: ToastDetail) {
  if (typeof window === 'undefined') return;

  const fn = toast[type] ?? toast.error;
  fn(title, { description: body });
}

