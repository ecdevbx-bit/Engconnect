export type DragGhostDetail =
  | { type: 'show'; text: string; x: number; y: number }
  | { type: 'move'; x: number; y: number }
  | { type: 'hide' };

export function emitBurst(x: number, y: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('englishconnection:burst', { detail: { x, y } }));
}

export function emitConfetti() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('englishconnection:confetti'));
}

export function emitDragGhost(detail: DragGhostDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<DragGhostDetail>('englishconnection:drag-ghost', { detail }));
}
