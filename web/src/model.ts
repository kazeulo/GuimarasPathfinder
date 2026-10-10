import type { FwResult } from './algo/types'
import type { Entry, EntryKey } from './data'

// Everything the tabs need that depends on the chosen entry point.
export interface Model {
  entryKey: EntryKey
  entry: Entry
  fw: FwResult
}
