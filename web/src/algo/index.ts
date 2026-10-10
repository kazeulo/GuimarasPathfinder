import { tsEngine } from './ts-engine'
import type { Engine } from './types'

// Swap this for a WASM-backed engine later.
export const engine: Engine = tsEngine
