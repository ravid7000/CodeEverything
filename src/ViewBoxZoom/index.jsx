import React, { useEffect, useState } from 'react';
import Sketch from '../Components/Sketch';

const [width, height] = [700, 400];
let zoomLevel = 1;

const ViewBoxZoom = () => {
    const [viewBox, setViewBox] = useState([0, 0, width, height].join(' '))

    useEffect(() => {
        window.mouseWheel = function() {
            zoomLevel = Math.max(zoomLevel + window.mouseWheelDeltaY / 100, 1);
            const zw = width / zoomLevel;
            const hw = height / zoomLevel;
            const wm = zw / 2;
            const hm = hw / 2;
            // const left = Math.max(0, window.mouseX - wm);
            // const top = Math.max(0, window.mouseY - hm);
            // const right = Math.min(width, window.mouseX + wm);
            // const bottom = Math.min(height, window.mouseY + hm);
            // const vb = [left, top, right, bottom].join(' ');
            // console.log(vb);
            console.log(window.mouseX, window.mouseY)
            // setViewBox(vb);
            return false;
        }
    }, [])

    return (
        <Sketch width={width} height={height} viewBox={viewBox}>
            <line x1="10" y1="10" x2="100" y2="40" stroke="#000" />
        </Sketch>
    )
}

export default ViewBoxZoom;