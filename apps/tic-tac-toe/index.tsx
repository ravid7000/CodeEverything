import React from "react";
import { GameBoard } from "./board";
import { GameScore } from "./score";
import { useGameEngine } from "./store";
import "./styles.css";

export const TicTacToeGame = () => {
  const { states, actions } = useGameEngine();

  console.log(states);

  return (
    <div className="game">
      <GameScore score={states.score} player={states.player} />
      <GameBoard board={states.board} onClick={actions.addTurn} />
      <div className="game-controls">
        {!states.player ? (
          <button className="btn" onClick={actions.start}>
            Start
          </button>
        ) : (
          <button className="btn" onClick={actions.reset}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
