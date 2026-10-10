import { useEffect, useMemo, useState } from 'react'
import { engine } from './algo'
import { ENTRIES, PRESETS, REPO_URL, selectionOf, type EntryKey } from './data'
import type { Model } from './model'
import { AboutPage } from './pages/AboutPage'
import { HowPage } from './pages/HowPage'
import { PlanPage } from './pages/PlanPage'

type Page = 'plan' | 'how' | 'about'

const NAV: { page: Page; label: string }[] = [
  { page: 'plan', label: 'Plan a trip' },
  { page: 'how', label: 'How it works' },
  { page: 'about', label: 'About' },
]

const pageFromHash = (): Page => {
  const h = window.location.hash.replace('#', '')
  return h === 'how' || h === 'about' ? h : 'plan'
}

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash)
  const [entryKey, setEntryKey] = useState<EntryKey>('wharf')
  // a sensible trip is ready from the start, so nobody faces an empty screen
  const [selected, setSelected] = useState<boolean[]>(() => selectionOf(PRESETS[0].nodes))

  useEffect(() => {
    const onHash = () => {
      setPage(pageFromHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const model: Model = useMemo(() => {
    const entry = ENTRIES[entryKey]
    return { entryKey, entry, fw: engine.floydWarshall(entry.graph) }
  }, [entryKey])

  return (
    <div className="app">
      <header className="site-head">
        <a className="brand" href="#plan">
          Guimaras <span>Pathfinder</span>
        </a>
        <nav aria-label="Main">
          {NAV.map((n) => (
            <a key={n.page} href={`#${n.page}`} aria-current={page === n.page ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            GitHub <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </nav>
      </header>

      <main>
        {page === 'plan' && (
          <>
            <div className="hero">
              <h1>Plan a day in Guimaras</h1>
              <p>Pick where you start and the places you want to see. We&rsquo;ll find a short route and tell you how long it takes.</p>
            </div>
            <PlanPage model={model} setEntryKey={setEntryKey} selected={selected} setSelected={setSelected} />
          </>
        )}
        {page === 'how' && <HowPage model={model} selected={selected} setSelected={setSelected} />}
        {page === 'about' && <AboutPage />}
      </main>
    </div>
  )
}
