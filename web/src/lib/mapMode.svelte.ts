export type MapMode = 'map' | 'diagram'

const KEY = 'mapMode'

function read(): MapMode {
  try {
    return localStorage.getItem(KEY) === 'diagram' ? 'diagram' : 'map'
  } catch {
    return 'map' // storage blocked: just use the default
  }
}

// Shared by every page, so switching between the real map and the diagram sticks as you move around.
export const mapMode = $state<{ value: MapMode }>({ value: typeof localStorage === 'undefined' ? 'map' : read() })

export function setMapMode(value: MapMode): void {
  mapMode.value = value
  try {
    localStorage.setItem(KEY, value)
  } catch {
    /* the choice just won't be remembered */
  }
}
