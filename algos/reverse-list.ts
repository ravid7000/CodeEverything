function reverseAList(list: number[]) {
  let i = 0;
  let j = list.length - 1;
  while (i < j) {
    let temp = list[i];
    list[i] = list[j];
    list[j] = temp;
    i += 1;
    j -= 1;
  }
  return list;
}

const testData = [1, 2, 3, 4, 5, 6, 7];

process.stdout.write(JSON.stringify(reverseAList(testData)));
