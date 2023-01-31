import Generators from "../generators";
import { stdout } from "../stream";

function rotateList(list: number[], rotation: number) {
  const temp: number[] = [];
  for (let i = rotation; i < list.length; i++) {
    temp.push(list[i]);
  }
  for (let i = 0; i < rotation; i++) {
    temp.push(list[i]);
  }
  return temp;
}

const inputData = Generators.sortedNumberList(5);

stdout(inputData, rotateList(inputData, 2));
