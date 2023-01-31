import Generators from "../generators";
import { stdout } from "../stream";

function fibonacciNumbers(k: number) {
  let numbers: number[] = [0, 1];
  let i = 1;
  while (i < k) {
    numbers.push(numbers[i - 1] + numbers[i]);
    i += 1;
  }
  return numbers;
}

let testData = Generators.randomInRange(100, 100);

stdout(testData, fibonacciNumbers(testData));
