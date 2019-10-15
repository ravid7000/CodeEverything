import React from 'react'
import './index.css'

const Sketch = ({ children, width, height, viewBox }) => (
  <div className="container">
    <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" width={width} height={height}>
      {children}
    </svg>
  </div>
)

export default Sketch
