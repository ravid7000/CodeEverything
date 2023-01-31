/**
 * rows = 4;
 * cols = 5;
 *
 * 1 8  9 16 17 even: rows * colIndex + 1 => 4 * 1 + 1 => 9, odd: rows * (colIndex + 1) => 4 * (1 + 1) => 8
 * 2 7 10 15 18
 * 3 6 11 14 19
 * 4 5 12 13 20
 */

import { stdout } from "../stream";

function generateMatrix(rows: number, cols: number) {
  const matrix: number[][] = [];

  for (let i = 0; i < rows; i++) {
    let currentRow: number[] = [];

    for (let j = 0; j < cols; j++) {
      if (i === 0) {
        // calcuate first row
        if (j % 2 === 0) {
          // for even
          currentRow.push(rows * j + 1);
        } else {
          // for odd
          currentRow.push(rows * (j + 1));
        }
      } else {
        if (j % 2 === 0) {
          // for even
          currentRow.push(matrix[i - 1][j] + 1);
        } else {
          // for odd
          currentRow.push(matrix[i - 1][j] - 1);
        }
      }
    }
    matrix.push(currentRow);
  }

  return matrix;
}

const testRows = 5;
const testCols = 5;

stdout(
  `rows: ${testRows}, cols: ${testCols}`,
  generateMatrix(testRows, testCols)
    .map((row) => row.join(","))
    .join("\n")
);
