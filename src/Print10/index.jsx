import React from 'react';
import Sketch from '../Components/Sketch';
import { range } from '../utils';

const Print10 = () => {
    const [width, height] = [600, 600]
    const rows = range(40);
    const cols = range(40);
    let x = 0;
    let y = 0;
    const spacing = 15

    return (
        <Sketch width={width} height={height}>
            {rows.map((line, idp) => {
                const col = cols.map((line, idx) => {
                    let li
                    if (Math.random(1) < 0.5) {
                        li = <line key={`${idp}-${idx}`} x1={x} y1={y} x2={x + spacing} y2={y + spacing} stroke="black" strokeWidth="2"  />
                    } else {
                        li = <line key={`${idp}-${idx}`} x1={x} y1={y + spacing} x2={x + spacing} y2={y} stroke="black" strokeWidth="2"  />
                    }
                    x += spacing;
                    return li
                })
                y += spacing
                x = 0;
                return col
            })}
        </Sketch>
    )
}

export default Print10;
