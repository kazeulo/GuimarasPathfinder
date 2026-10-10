// Pure helpers shared by the UI. Kept in TypeScript regardless of which engine runs.

export function reconstructPath(prev: (number | null)[][], start: number, end: number): number[] {
  if (start === end) return [start]
  if (prev[start][end] === null) return []
  const path = [end]
  while (path[path.length - 1] !== start) path.push(prev[start][path[path.length - 1]] as number)
  return path.reverse()
}

export const toMinutes = (km: number, kmh: number): number => (km / kmh) * 60

// "2 h 58.28 min", the style the paper uses.
export function formatMinutes(m: number): string {
  const h = Math.floor(m / 60 + 1e-9)
  const rest = Math.round((m - h * 60) * 100) / 100
  return h > 0 ? `${h} h ${rest} min` : `${rest} min`
}

export const fmtNum = (x: number): string => (x === Infinity ? '∞' : String(Math.round(x * 100) / 100))
