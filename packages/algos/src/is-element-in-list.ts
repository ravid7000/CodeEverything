import Generators from "@code-everything/generators";
import { stdout } from "@code-everything/stream";

function isElementInList(list: number[], element: number) {
  return !!list.find((item) => item === element);
}

const testData = Generators.numberList(10);
const testElement = 9;

stdout(
  `input: ${testData}, Element: ${testElement}\noutput: ${isElementInList(
    testData,
    testElement
  )}\n`
);
