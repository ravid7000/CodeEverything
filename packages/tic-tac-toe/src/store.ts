import { Reducer, useReducer } from "react";

export type Player = "x" | "o";
export type BoardRow = Array<Player | null>;
export type Board = BoardRow[];

export type InitialState = {
  player: Player | null;
  turnCount: number;
  score: {
    x: number;
    o: number;
  };
  result: {
    winner: Player | null;
    isDraw: boolean;
  };
  board: Board;
};

function createBoard(size: number = 3): Board {
  return Array(size)
    .fill([])
    .map(() => {
      return Array(size).fill(null);
    });
}

const initialState: InitialState = {
  player: null,
  turnCount: 0,
  score: {
    x: 0,
    o: 0,
  },
  result: {
    winner: null,
    isDraw: false,
  },
  board: createBoard(),
};

type ReducerAction = {
  type:
    | "reset"
    | "updatePlayer"
    | "updateScore"
    | "updateResult"
    | "updateBoard"
    | "startGame";
  value: any;
};

const reducer: Reducer<InitialState, ReducerAction> = (state, action) => {
  switch (action.type) {
    case "reset": {
      return {
        ...initialState,
        player: null,
        score: state.score,
        result: {
          winner: null,
          isDraw: false,
        },
        board: createBoard(),
      };
    }
    case "startGame": {
      return {
        ...state,
        player: action.value,
      };
    }
    case "updatePlayer": {
      return {
        ...state,
        player: action.value,
        turnCount: state.turnCount + 1,
      };
    }
    case "updateScore": {
      return {
        ...state,
        score: action.value,
      };
    }
    case "updateResult": {
      if (action.value.winner) {
        alert(action.value.winner);
      }
      return {
        ...state,
        result: action.value,
      };
    }
    case "updateBoard": {
      return {
        ...state,
        board: action.value,
      };
    }
    default: {
      return state;
    }
  }
};

const findWinnerOrDraw = (board: Board, turnCount: number) => {
  let winner: Player | null = null;
  // check all rows
  for (let i = 0; i < board.length; i++) {
    let firstSelected = board[i][0];
    let allSame = true;
    for (let j = 1; j < board[i].length; j++) {
      allSame = firstSelected === board[i][j] && allSame;
    }
    if (allSame) {
      winner = firstSelected;
      break;
    }
  }

  // check all cols
  if (!winner) {
    for (let j = 0; j < board.length; j++) {
      const firstSelected = board[0][j];
      let allSame = true;
      for (let i = 0; i < board.length; i++) {
        allSame = firstSelected === board[i][j] && allSame;
      }

      if (allSame) {
        winner = firstSelected;
        break;
      }
    }
  }

  // check left - right diagonal
  if (!winner) {
    const firstSelected = board[0][0];
    let allSame = true;
    for (let k = 0; k < board.length; k++) {
      allSame = firstSelected === board[k][k] && allSame;
    }

    if (allSame) {
      winner = firstSelected;
    }
  }

  // check right - left diagonal
  if (!winner) {
    const firstSelected = board[0][board.length - 1];
    let allSame = true;
    for (
      let i = 1, j = board.length - 2;
      i < board.length && j >= 0;
      i++, j--
    ) {
      allSame = firstSelected === board[i][j] && allSame;
    }

    if (allSame) {
      winner = firstSelected;
    }
  }

  return {
    winner,
    isDraw: !winner && turnCount === board.length * board.length,
  };
};

export function useGameEngine() {
  const [gameState, dispatch] = useReducer(reducer, initialState);

  const start = () => {
    dispatch({ type: "startGame", value: "x" });
  };

  const reset = () => {
    dispatch({ type: "reset", value: null });
  };

  const addTurn = (row: number, col: number) => {
    if (
      gameState.player !== null &&
      gameState.board[row][col] === null &&
      gameState.result.winner === null
    ) {
      const newBoard = [...gameState.board];
      newBoard[row][col] = gameState.player;
      dispatch({ type: "updateBoard", value: newBoard });
      const nextPlayer = gameState.player === "x" ? "o" : "x";
      dispatch({ type: "updatePlayer", value: nextPlayer });
      dispatch({
        type: "updateResult",
        value: findWinnerOrDraw(newBoard, gameState.turnCount + 1),
      });
    }
  };

  return {
    states: gameState,
    actions: {
      start,
      reset,
      addTurn,
    },
  };
}
