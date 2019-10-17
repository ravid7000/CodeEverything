import React from 'react'
import { render } from 'react-dom'
// import BasicShapes from './BasicShapes'
// import Cardioid from './Cardioid'
import LangtonAnt from './LangtonAnt';

const App = () => {
  return <LangtonAnt />
}

render(<App />, document.getElementById('root'))
