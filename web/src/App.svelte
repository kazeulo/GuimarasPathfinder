<script lang="ts">
  import { engine } from './algo'
  import { ENTRIES, PRESETS, REPO_URL, selectionOf } from './data'
  import type { Model } from './model'
  import ThemeToggle from './components/ThemeToggle.svelte'
  import AboutPage from './pages/AboutPage.svelte'
  import HowPage from './pages/HowPage.svelte'
  import PlanPage from './pages/PlanPage.svelte'

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

  let page = $state<Page>(pageFromHash())
  // a sensible trip is ready from the start, so nobody faces an empty screen
  let selected = $state<boolean[]>(selectionOf(PRESETS[0].nodes))

  // Every trip starts at Jordan Wharf. The RoRo Port (for visitors bringing a vehicle) is only 0.1 km
  // different per leg, so it isn't offered; its data stays in data.ts for the checks against the SP.
  const model: Model = {
    entryKey: 'wharf',
    entry: ENTRIES.wharf,
    fw: engine.floydWarshall(ENTRIES.wharf.graph),
  }

  const setSelected = (s: boolean[]) => {
    selected = s
  }
  const onHashChange = () => {
    page = pageFromHash()
    window.scrollTo(0, 0)
  }
</script>

<svelte:window onhashchange={onHashChange} />

<div class="app">
  <header class="site-head">
    <a class="brand" href="#plan">
      <img src="{import.meta.env.BASE_URL}images/logo-icon-96.png" alt="" width="36" height="36" />
      <span class="brand-name">Guimaras <span>Pathfinder</span></span>
    </a>
    <div class="head-right">
      <nav aria-label="Main">
        {#each NAV as n (n.page)}
          <a href="#{n.page}" aria-current={page === n.page ? 'page' : undefined}>{n.label}</a>
        {/each}
      </nav>
      <ThemeToggle />
    </div>
  </header>

  <main>
    {#if page === 'plan'}
      <div class="hero">
        <h1>Plan a day in Guimaras</h1>
        <p>Pick where you start and the places you want to see. We&rsquo;ll find a short route and tell you how long it takes.</p>
      </div>
      <PlanPage {model} {selected} {setSelected} />
    {:else if page === 'how'}
      <HowPage {model} {selected} {setSelected} />
    {:else}
      <AboutPage />
    {/if}
  </main>

  <footer class="site-foot">
    <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
      View the source on GitHub<span class="sr-only"> (opens in a new tab)</span>
    </a>
  </footer>
</div>
