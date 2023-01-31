import React from "react";
import { Board } from "./store";

interface BoardProps {
  board: Board;
  onClick?: (row: number, col: number) => void;
}

export const GameBoard = ({ board, onClick }: BoardProps) => {
  const handleClick = (row: number, col: number) => {
    if (typeof onClick === "function") {
      onClick(row, col);
    }
  };
  return (
    <div className="game-board">
      {board.map((row, rowIndex) => {
        return (
          <div className="game-board--row" key={`row-${rowIndex}`}>
            {row.map((cell, cellIndex) => {
              return (
                <div
                  className="game-board--cell"
                  onClick={() => handleClick(rowIndex, cellIndex)}
                  key={`col-${cellIndex}`}
                >
                  {cell || ""}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
