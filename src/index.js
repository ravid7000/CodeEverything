import React from 'react'
import { render } from 'react-dom'
import BasicShapes from './BasicShapes'
// import ViewBoxZoom from './ViewBoxZoom'
// import Cardioid from './Cardioid'
// import LangtonAnt from './LangtonAnt';
// import Print10 from './Print10'
import { initializeEventListener } from './helpers/events';

const App = () => {
  return <BasicShapes />
}

const rootElm = document.getElementById('root');

render(<App />, rootElm);

// Global event listener helper functions;
initializeEventListener(document.querySelector('svg'));
