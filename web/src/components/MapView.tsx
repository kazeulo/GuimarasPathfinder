import { useState } from 'react'
import type { Graph } from '../algo/types'
import { POS, placeName, type Entry } from '../data'
import { fmtNum } from '../algo/helpers'

export interface Segment {
  a: number
  b: number
  cls: string
}

export interface Overlay {
  nodeClass?: Record<number, string>
  segments?: Segment[]
  badges?: Record<number, string>
  labels?: number[]
}

interface Props {
  graph: Graph
  entry: Entry
  overlay?: Overlay
  onNodeClick?: (i: number) => void
}

const R = 8.5

export function MapView({ graph, entry, overlay = {}, onNodeClick }: Props) {
  const [weights, setWeights] = useState(false)
  const { nodeClass = {}, segments = [], badges = {}, labels = [] } = overlay
  const n = graph.length

  const edges: [number, number][] = []
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (graph[i][j] !== null) edges.push([i, j])

  return (
    <figure className="map">
      <svg viewBox="320 118 370 365" role="img" aria-label="Schematic map of the 15 points of interest in Guimaras and the roads between them">
        <g className="edges">
          {edges.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={POS[a][0]} y1={POS[a][1]} x2={POS[b][0]} y2={POS[b][1]} />
          ))}
        </g>

        {weights && (
          <g className="weights">
            {edges.map(([a, b]) => (
              <text key={`w${a}-${b}`} x={(POS[a][0] + POS[b][0]) / 2} y={(POS[a][1] + POS[b][1]) / 2}>
                {fmtNum(graph[a][b] as number)}
              </text>
            ))}
          </g>
        )}

        <g className="segments">
          {segments.map((s, idx) => (
            <line
              key={`${s.a}-${s.b}-${s.cls}-${idx}`}
              className={`seg ${s.cls}`}
              pathLength={1}
              x1={POS[s.a][0]}
              y1={POS[s.a][1]}
              x2={POS[s.b][0]}
              y2={POS[s.b][1]}
            />
          ))}
        </g>

        <g className="nodes">
          {POS.map(([x, y], i) => {
            const cls = nodeClass[i] ?? ''
            const showLabel = labels.includes(i)
            const left = x > 600
            return (
              <g
                key={i}
                className={`node ${i === 0 ? 'port' : ''} ${cls}`}
                transform={`translate(${x} ${y})`}
                onClick={onNodeClick ? () => onNodeClick(i) : undefined}
                style={onNodeClick ? { cursor: 'pointer' } : undefined}
              >
                <title>{`${i + 1}. ${placeName(i, entry)}`}</title>
                {i === 0 ? (
                  <rect x={-R} y={-R} width={R * 2} height={R * 2} rx={3} />
                ) : (
                  <circle r={R} />
                )}
                <text className="num" y={3}>
                  {i + 1}
                </text>
                {badges[i] && (
                  <g className="badge" transform={`translate(${R},${-R})`}>
                    <circle r={6.5} />
                    <text y={2.6}>{badges[i]}</text>
                  </g>
                )}
                {showLabel && (
                  <text className="label" x={left ? -R - 4 : R + 4} y={3} textAnchor={left ? 'end' : 'start'}>
                    {placeName(i, entry)}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>
      <figcaption>
        <label>
          <input type="checkbox" checked={weights} onChange={(e) => setWeights(e.target.checked)} /> Show road distances (km)
        </label>
        <span className="hint">Schematic layout traced from the paper&rsquo;s Figure 3.1 &mdash; lines are direct roads, not true geometry.</span>
      </figcaption>
    </figure>
  )
}
