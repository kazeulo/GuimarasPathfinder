export type Snap = 'peek' | 'half' | 'full'

export interface SheetHeights {
  peek: number
  half: number
  full: number
}

// Heights (px) of the phone bottom sheet. `shell` is the height of the area it sits in.
export const PEEK_PX = 106
export const sheetHeights = (shell: number): SheetHeights => ({
  peek: PEEK_PX,
  half: Math.max(PEEK_PX + 80, Math.round(shell * 0.5)),
  full: Math.max(PEEK_PX + 160, Math.round(shell * 0.88)),
})

// Which resting height is closest, counting where a flick would have carried it.
// `velocity` is px per ms, positive when moving up.
export function nearestSnap(height: number, heights: SheetHeights, velocity = 0): Snap {
  const projected = height + velocity * 180
  let best: Snap = 'peek'
  for (const s of ['peek', 'half', 'full'] as const)
    if (Math.abs(heights[s] - projected) < Math.abs(heights[best] - projected)) best = s
  return best
}

// A tap or key press on the handle: open it a step, or close it when it's already fully open.
export const nextSnap = (s: Snap): Snap => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek')
export const prevSnap = (s: Snap): Snap => (s === 'full' ? 'half' : 'peek')

export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n))
