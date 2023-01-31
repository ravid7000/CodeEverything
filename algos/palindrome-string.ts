import Generators from "../generators";
import { stdout } from "../stream";

function isPalindromeString(str: string) {
  let i = 0;
  let j = str.length - 1;
  while (i <= j) {
    if (str.charAt(i++) !== str.charAt(j--)) {
      return false;
    }
  }
  return true;
}

const testData = `aabcaa`;

stdout(`input: ${testData}\noutput: ${isPalindromeString(testData)}\n`);
