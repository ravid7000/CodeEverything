import Generators from "@code-everything/generators";
import { stdout } from "@code-everything/stream";

function findElementsOnOddPosition(list: number[]) {
  let i = 1;
  let oddList: number[] = [];
  while (i < list.length) {
    oddList.push(list[i]);
    i += 2;
  }
  return oddList;
}

const testData = Generators.numberList(5);

stdout(`input: ${testData}\nOutput: ${findElementsOnOddPosition(testData)}\n`);
