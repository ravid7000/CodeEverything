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
            const vb = [0, 0, zw, hw].join(' ');
            setViewBox(vb);
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