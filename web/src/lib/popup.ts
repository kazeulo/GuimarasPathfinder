import { INFO, PLACES, kindOf, photoOf, placeName, type Entry } from '../data'

export interface PopupOptions {
  chosen: boolean // is the place already part of the trip?
  onToggle?: () => void // when given, the popup offers an add / remove button
}

// The card shown when a pin is clicked: photo, name, type and typical stay, and (on the Plan page) an add / remove button.
export function buildPopup(i: number, entry: Entry, { chosen, onToggle }: PopupOptions): HTMLElement {
  const root = document.createElement('div')

  const photo = photoOf(i)
  if (photo) {
    const img = document.createElement('img')
    img.className = 'pop-photo'
    img.src = photo
    img.alt = placeName(i, entry)
    root.append(img)
  }

  const body = document.createElement('div')
  body.className = 'pop-body'
  const name = document.createElement('p')
  name.className = 'pop-name'
  name.textContent = placeName(i, entry)
  body.append(name)

  if (i > 0) {
    const place = PLACES[i]
    const meta = document.createElement('p')
    meta.className = 'pop-meta'
    const hours = place.stay >= 60 ? `${place.stay / 60} h` : `${place.stay} min`
    meta.textContent = `${kindOf(place)} · about ${hours}`
    body.append(meta)

    const info = INFO[i]
    if (info) {
      if (info.where) {
        const where = document.createElement('p')
        where.className = 'pop-where'
        where.textContent = info.where
        body.append(where)
      }
      if (info.note) {
        const note = document.createElement('p')
        note.className = 'pop-note'
        note.textContent = info.note
        body.append(note)
      }
      const about = document.createElement('p')
      about.className = 'pop-about'
      about.textContent = info.about
      body.append(about)
    }
  }

  if (onToggle && i > 0) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = chosen ? 'pop-btn remove' : 'pop-btn'
    button.textContent = chosen ? 'Remove from trip' : 'Add to trip'
    button.addEventListener('click', onToggle)
    body.append(button)
  }

  root.append(body)
  return root
}
