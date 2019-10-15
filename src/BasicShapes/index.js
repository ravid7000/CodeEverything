import React from 'react'
import Sketch from '../Components/Sketch'

const BasicShapes = () => {
  return (
    <Sketch width="600" height="400" viewBox="-150 -100 300 200">
      <line x1="-150" y1="0" x2="150" y2="0" stroke="#000" strokeWidth="1" />
      <line x1="0" y1="-100" x2="0" y2="100" stroke="#000" strokeWidth="1" />
    </Sketch>
  )
}

export default BasicShapes
