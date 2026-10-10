import { fmtNum } from '../algo/helpers'
import { placeName, type Entry } from '../data'

interface Props {
  values: number[][]
  entry: Entry
  pivot: number | null // row/column k being used as the intermediate node
  changed: Set<string> // cells updated during the current k ("i,j")
  last: { i: number; j: number } | null // the single most recent update
}

export function Matrix({ values, entry, pivot, changed, last }: Props) {
  const n = values.length
  const idx = Array.from({ length: n }, (_, i) => i)

  return (
    <div className="matrix-wrap">
      <table className="matrix">
        <thead>
          <tr>
            <th className="corner">km</th>
            {idx.map((j) => (
              <th key={j} className={j === pivot ? 'pivot' : ''} title={placeName(j, entry)}>
                {j + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {idx.map((i) => (
            <tr key={i}>
              <th className={i === pivot ? 'pivot' : ''} title={placeName(i, entry)}>
                {i + 1}
              </th>
              {idx.map((j) => {
                const v = values[i][j]
                const cls = [
                  v === Infinity ? 'inf' : '',
                  i === pivot || j === pivot ? 'pivot' : '',
                  changed.has(`${i},${j}`) ? 'changed' : '',
                  last && last.i === i && last.j === j ? 'last' : '',
                ].join(' ')
                return (
                  <td key={j} className={cls} title={`${placeName(i, entry)} → ${placeName(j, entry)}`}>
                    {fmtNum(v)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
