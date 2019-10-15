import React from 'react'
import { render } from 'react-dom'
// import BasicShapes from './BasicShapes'
import Cardioid from './Cardioid'

const App = () => {
  return <Cardioid />
}

render(<App />, document.getElementById('root'))
