import React, { useState } from 'react'
import { range } from '../../utils'

const Grid = ({ width, height, spacing }) => {
  const [rows] = useState(range(Math.round(height / spacing)))
  const [cols] = useState(range(Math.round(width / spacing)))

  return (
    <g>
      {rows.map(row => (
        <line key={row} x1={0} y1={row * spacing} x2={width} y2={row * spacing} stroke="#ddd" />
      ))}
      {cols.map(col => (
        <line key={col} x1={col * spacing} y1={0} x2={col * spacing} y2={height} stroke="#ddd" />
      ))}
    </g>
  )
}

export default Grid
