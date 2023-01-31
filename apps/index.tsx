import React from "react";
import { createRoot } from "react-dom/client";
// import { TicTacToeGame } from "./tic-tac-toe";
// import { AtlassianTree } from "./atlassian-tree";
import { KanbanBoard } from "./kanban-board";
// import { AnalyticsApp } from "./analytics";

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<KanbanBoard />);
