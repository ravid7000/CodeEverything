import { stdout } from "../stream";

function numbersToDigitList(num: number) {
  const digits: number[] = [];
  let allDigits = Math.ceil(Math.log10(Math.abs(num)));
  for (let i = 0; i < allDigits; i++) {
    let denominator = Math.pow(10, allDigits - i - 1);
    let divident = Math.floor(num / denominator);
    digits.push(divident);
    num %= denominator;
  }

  return digits;
}

const testData = 2;

stdout(testData, numbersToDigitList(testData));
