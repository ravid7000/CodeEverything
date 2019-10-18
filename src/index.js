import React from 'react'
import { render } from 'react-dom'
// import BasicShapes from './BasicShapes'
import Cardioid from './Cardioid'
// import LangtonAnt from './LangtonAnt';
// import Print10 from './Print10'

const App = () => {
  return <Cardioid />
}

render(<App />, document.getElementById('root'))
