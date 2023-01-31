import Generators from "../generators";
import { stdout } from "../stream";

function joinLists(list1: number[], list2: number[]) {
  const combined: number[] = [];
  list1.forEach((item) => combined.push(item));
  list2.forEach((item) => combined.push(item));
  return combined;
}

function alternateJoinLists(list1: number[], list2: number[]) {
  let i = 0;
  const combined: number[] = [];
  while (i < list1.length) {
    combined.push(list1[i]);
    if (list2[i] !== undefined) {
      combined.push(list2[i]);
    }
    i += 1;
  }

  if (i < list2.length) {
    while (i < list2.length) {
      combined.push(list2[i]);
      i += 1;
    }
  }

  return combined;
}

function joinSortedLists(list1: number[], list2: number[]) {
  const combined: number[] = [];
  let i = 0;
  let j = 0;
  while (i < list1.length && j < list2.length) {
    if (list1[i] < list2[j]) {
      combined.push(list1[i]);
      i += 1;
    } else if (list2[j] < list1[i]) {
      combined.push(list2[j]);
      j += 1;
    } else {
      combined.push(list1[i]);
      combined.push(list2[j]);
      i += 1;
      j += 1;
    }
  }

  if (i < list1.length) {
    while (i < list1.length) {
      combined.push(list1[i]);
      i += 1;
    }
  }

  if (j < list2.length) {
    while (j < list2.length) {
      combined.push(list2[j]);
      j += 1;
    }
  }

  return combined;
}

const testData1 = Generators.sortedNumberList(4, 20);
const testData2 = Generators.sortedNumberList(4);

stdout(`${testData1}\t${testData2}`, joinSortedLists(testData1, testData2));
