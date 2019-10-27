import React, { useState } from 'react';
import './style.css';

// n is the size of grid
function createBorad(n) {
    let board = [];
    for (let i = 0; i < n; i++) {
        board[i] = []
        for (let j = 0; j < n; j++) {
            board[i][j] = ''
        }
    }
    return board;
}

const checkWinner = (board) => {
    // 1. check all rows
    const n = board.length;
    // i for rows
    // j for cols
    for(let i = 0; i < n; i++) {
        let equals = 1
        let pl = ''
        for (let j = 0; j < n; j++) {
            if (j > 0 && board[i][j - 1] === board[i][j]) {
                equals += 1;
                pl = board[i][j];
            }
        }
        if (equals === n) {
            // winner found
            return winner;
        }
    }

    // 2. check cols
    for(let j = 0; j < n; j++) {
        let equals = 1
        let pl = ''
        for (let i = 0; i < n; i++) {
            if (i > 0 && board[i - 1][j] === board[i][j]) {
                equals += 1;
                pl = board[i][j];
            }
        }
        if (equals === n) {
            // winner found
            return winner;
        }
    }

    // 2. check diagonal 1
    for(let j = 0; j < n; j++) {
        let equals = 1
        let pl = ''
        if (j > 0 && board[j - 1][j - 1] === board[i][j]) {
            equals += 1;
            pl = board[j][j];
        }
        if (equals === n) {
            // winner found
            return winner;
        }
    }
}

const TicTac = () => {
    const [gridSize, setGridSize] = useState(3);
    const [board, setBoard] = useState(createBorad(gridSize));
    const [player, setPlayer] = useState(0);

    const cellClick = (x, y) => {
        let brd = board.slice(0);
        if (brd[x][y] === '') {
            brd[x][y] = player === 0 ? '0' : 'x';
            setBoard(brd);
            checkWinner(brd);
        }
    }

    const togglePlayer = () => {
        setPlayer(player === 0 ? 1 : 0)
    }

    return (
        <div className="grid">
            {board.map((rows, rowIdx) => (
                <div key={rowIdx} className="row">
                    {rows.map((col, colIdx) => (
                        <div key={colIdx} className="col" onClick={() => cellClick(rowIdx, colIdx)}>
                            {col}
                        </div>
                    ))}
                </div>
            ))}

            <button onClick={togglePlayer}>Player {player === 0 ? '0' : 'x'}</button>
        </div>
    )
}

export default TicTac;