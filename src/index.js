import React from 'react'
import { render } from 'react-dom'
// import BasicShapes from './BasicShapes'
// import Cardioid from './Cardioid'
// import LangtonAnt from './LangtonAnt';
// import Print10 from './Print10'
// import CSSTimeline from './CSSTimeline'
import TicTac from './Tictac'

const App = () => {
  return <TicTac />
}

render(<App />, document.getElementById('root'))
