import React, { useState, useEffect } from 'react';
import Sketch from '../Components/Sketch';

const ANT_UP = 1;
const ANT_RIGHT = 2;
const ANT_DOWN = 3;
const ANT_LEFT = 4;
let dir = ANT_UP;
let grid = []
const [width, height] = [500, 500];
let antPos = { x: 250, y: 250 };

function setup() {
    let rows = []
    for (let i = 0; i < width; i++) {
        let cols = []
        for (let j = 0; j < height; j++) {
            cols.push(0);
        }
        rows.push(cols)
    }
    grid = rows;
}

setup();

function setAntPos(pos) {
    antPos = pos;
}

const turnRight = () => {
    dir += 1;
    if (dir > ANT_LEFT) {
        dir = ANT_UP;
    }
}

const turnLeft = () => {
    dir -= 1
    if (dir < ANT_UP) {
        dir = ANT_LEFT;
    }
}

function moveAhead() {
    let { x, y } = antPos;
    if (dir === ANT_UP) {
        y -= 5;
    } else if (dir === ANT_RIGHT) {
        x += 5;
    } else if (dir === ANT_DOWN) {
        y += 5;
    } else if (dir === ANT_LEFT) {
        x -= 5;
    }

    if (x < 0) {
        x = width - 5;
    } else if (x + 5 > width) {
        x = 0;
    }
    if (y < 0) {
        y = height - 5;
    } else if (y + 5 > height) {
        y = 0;
    }
    setAntPos({ x, y });
}


const LangtonAnt = () => {
    const state = grid[antPos.x][antPos.y];
    const [update, setUpdate] = useState(0);
    useEffect(() => {
        window.requestAnimationFrame(() => {
            setUpdate(update < 3 ? update + 1 : 0);
        })
    }, [update])

    if (state === 1) {
        turnLeft();
        grid[antPos.x][antPos.y] = 0;
        moveAhead();
    } else if (state !== -1) {
        turnRight();
        grid[antPos.x][antPos.y] = 1;
        moveAhead();
    }

    return (
        <Sketch width={width} height={height}>
            {grid.map((row, x) => {
                return row.map((col, y) => {
                    if (col === 1) {
                        return (
                            <rect key={`${x}-${y}`} x={x + 5} y={y + 5} width={5} height={5} fill="black" />
                            )
                        }
                        return null;
                    })
                })}
            <rect key={`${antPos.x}-${antPos.y}`} x={antPos.x + 5} y={antPos.y + 5} width={5} height={5} fill="red" />
        </Sketch>
    )
}

export default LangtonAnt;
