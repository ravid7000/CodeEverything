import React from "react";
import { InitialState, Player } from "./store";

interface GameScoreProps {
  score: InitialState["score"];
  player: Player | null;
}

export const GameScore = ({ score, player }: GameScoreProps) => {
  return (
    <div className="game-score">
      <div>Player X = {score.x}</div>
      <div>Player O = {score.o}</div>
      <div className="player-turn">Player turn = {player}</div>
    </div>
  );
};
