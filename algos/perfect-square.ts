import Generators from "../generators";
import { stdout } from "../stream";

function findPerfectSquaresUptoLength(len: number) {
  const squares: number[] = [];
  for (let i = 1; i <= len; i++) {
    squares.push(Math.pow(i, 2));
  }
  return squares;
}

const testData = Generators.randomInRange(4, 5);

stdout(testData, findPerfectSquaresUptoLength(testData));
