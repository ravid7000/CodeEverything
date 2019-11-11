import React from 'react'
import Sketch from '../Components/Sketch'

const BasicShapes = () => {
  return (
    <Sketch width="600" height="400">
      <line x1="200" y1="200" x2="220" y2="200" stroke="blue" opacity="0.5" />
      <line x1="220" y1="200" x2="220" y2="180" stroke="blue" opacity="0.5" />
      <line x1="220" y1="180" x2="240" y2="180" stroke="blue" opacity="0.5" />
    </Sketch>
  )
}

export default BasicShapes
