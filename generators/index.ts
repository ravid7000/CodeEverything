function randomInRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomStringGen(length: number) {
  let str = "";
  for (let i = 0; i < length; i++) {
    str = str + String.fromCharCode(randomInRange(97, 122));
  }
  return str;
}

function randomNumberListGen(length: number, upper: number = 10) {
  let list: number[] = [];
  for (let i = 0; i < length; i++) {
    list.push(randomInRange(1, upper));
  }
  return list;
}

function randomStringListGen(length: number) {
  let list: string[] = [];
  for (let i = 0; i < length; i++) {
    list.push(randomStringGen(randomInRange(1, 10)));
  }
  return list;
}

function randomNumberSortedListGen(length: number, upper: number = 10) {
  let list: number[] = [];
  for (let i = 0; i < length; i++) {
    list.push(randomInRange(1, upper));
  }
  list.sort((a, b) => a - b);
  return list;
}

function randomStringSortedListGen(length: number) {
  let list: string[] = [];
  for (let i = 0; i < length; i++) {
    list.push(randomStringGen(1));
  }
  list.sort();
  return list;
}

const Generators = {
  string: randomStringGen,
  numberList: randomNumberListGen,
  stringList: randomStringListGen,
  sortedNumberList: randomNumberSortedListGen,
  sortedStringList: randomStringSortedListGen,
  randomInRange,
};

export default Generators;
