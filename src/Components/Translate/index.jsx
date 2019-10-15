import React from 'react'

const Translate = ({ x, y, children }) => (
  <g transform={`translate(${x}, ${y})`}>{children}</g>
)

export default Translate
