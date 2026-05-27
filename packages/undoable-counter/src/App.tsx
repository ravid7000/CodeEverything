import { useState } from "react";

interface HistoryItem {
  operation: string;
  before: number;
  after: number;
}

export function App() {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryItem[]>([]);

  const applyOperation = (operation: string, fn: (n: number) => number) => {
    const before = count;
    const after = fn(before);
    setCount(after);
    setHistory((prev) => [...prev, { operation, before, after }]);
    setRedoStack([]); // Clear redo stack on new action
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastAction]);
    setCount(lastAction.before);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const lastUndoneAction = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setHistory((prev) => [...prev, lastUndoneAction]);
    setCount(lastUndoneAction.after);
  };

  const handleReset = () => {
    setCount(0);
    setHistory([]);
    setRedoStack([]);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Undoable Counter</h1>
      
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <button onClick={handleUndo} disabled={history.length === 0}>Undo</button>
        <button onClick={handleRedo} disabled={redoStack.length === 0}>Redo</button>
        <button onClick={handleReset}>Reset</button>
      </div>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <button onClick={() => applyOperation("/2", (n) => n / 2)}>/2</button>
        <button onClick={() => applyOperation("-1", (n) => n - 1)}>-1</button>
        <div style={{ fontSize: "24px", fontWeight: "bold", minWidth: "50px", textAlign: "center" }}>
          {count}
        </div>
        <button onClick={() => applyOperation("+1", (n) => n + 1)}>+1</button>
        <button onClick={() => applyOperation("x2", (n) => n * 2)}>x2</button>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>History</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>Operation</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>Before</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "8px" }}>After</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((item, index) => (
              <tr key={history.length - index}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{item.operation}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{item.before}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{item.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
