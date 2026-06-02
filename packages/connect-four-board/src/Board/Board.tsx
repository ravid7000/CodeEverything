import { useMemo, useState } from "react";
import "./board.css"

const BOARD_SIZE = {
  ROWS: 6,
  COLS: 7
} as const;

const createBoard = (boardSize: typeof BOARD_SIZE) => {
  return Array(boardSize.ROWS).fill(0).map((_, rowIndex) => {
    return {
      id: `row_${rowIndex}`,
      cols: Array(boardSize.COLS).fill(0).map((_, colIndex) => {
        return `${rowIndex}_${colIndex}`
      })
    }
  })
}

export function Board() {
  const [boardSize] = useState(() => createBoard(BOARD_SIZE))
  const inputRow = useMemo(() => {
    return boardSize.length > 0 ? boardSize[0] : null
  }, [boardSize]);
  const [turn, setTurn] = useState<"p1" | "p2">("p1")

  return (
    <div className="board">
      <div className="board-row">
        {inputRow?.cols.map((col) => {
          return (
            <button key={col} className={`board-col ${turn === "p1" ? "board-player1" : "board-player2"}`} data-id={col}>
            </button>
          )
        })}
      </div>

      <div className="board-matrix">
        {boardSize.map((row) => {
          return (
            <div key={row.id} className="board-row" data-id={row.id}>
              {row.cols.map((col) => {
                return (
                  <div key={col} className="board-col" data-id={col} />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}