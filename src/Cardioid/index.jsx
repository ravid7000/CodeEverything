import React from 'react'
import Sketch from '../Components/Sketch'
import Translate from '../Components/Translate'
import Grid from '../Components/Grid'
import './style.css'

function makeCardioid() {
  let x = 0;
  let y = 0;
  let a = 5;
  let phi = 0;
  const TWO_PI = Math.PI * 2;
  let pathstr = '';
  const cos = Math.cos
  const sin = Math.sin
  const angle = TWO_PI / 50

  // 2a(1-cos(phi)) * cos(phi)
  // 2a(1-cos(phi)) * sin(phi)

  while (phi < TWO_PI) {
    x = 2 * a * (1 - cos(phi)) * cos(phi)
    y = 2 * a * (1 - cos(phi)) * sin(phi)

    if (!pathstr) {
      pathstr = `M${x},${y} `
    } else {
      pathstr += `L${x},${y} `
    }

    phi += angle;
  }
  pathstr += 'z'
  console.log(pathstr)
  return pathstr;
}


function makeHeart() {
  let x = 0;
  let y = 0;
  let a = 5;
  let phi = 0;
  const TWO_PI = Math.PI * 2;
  let pathstr = '';
  const cos = Math.cos
  const sin = Math.sin
  const angle = TWO_PI / 150

  // 2a(1-cos(phi)) * cos(phi)
  // 2a(1-cos(phi)) * sin(phi)

  while (phi < TWO_PI) {
    y = 16 * sin(phi) * sin(phi) * sin(phi)
    x = 13 * cos(phi) - 5 * cos(2 * phi) - 2 * cos(3 * phi) - cos(4 * phi)

    if (!pathstr) {
      pathstr = `M${x},${y} `
    } else {
      pathstr += `L${x},${y} `
    }

    phi += angle;
  }
  pathstr += 'z'
  console.log(pathstr)
  return pathstr;
}

const Cardioid = () => {
  const width = 600
  const height = 600

  return (
    <Sketch width={width} height={height}>
    <Grid width={width} height={height} spacing={60} />
      <Translate x={width/2} y={height/2}>
        <g class="heart-group">
          <path d={makeHeart()} class="cardioid flip" stroke="#000" strokeWidth="0" />
        </g>
      </Translate>
    </Sketch>
  )
}

export default Cardioid
