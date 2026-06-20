import React from 'react';

export function Counter({ start = 0 }: { start?: number }) {
  const [count, setCount] = React.useState(start);
  return (
    <div style={{ marginTop: 16, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
      <p style={{ margin: '0 0 8px' }}>Island counter (separate React root)</p>
      <button type="button" onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
