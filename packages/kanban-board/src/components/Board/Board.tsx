import React from "react";

// styles
import "./board.styles.css";

// types
interface BoardProps {
  children?: React.ReactNode;
}

export const Board = ({ children }: BoardProps) => {
  return (
    <div className="board">
      <div className="board-content">{children}</div>
    </div>
  );
};
