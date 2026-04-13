// Data Types in Typescript
// Numbers
// 1,2,3,4,5,6,7,8,9,0 -7,-3, 0.12, 21.23 decimal
// 0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f hexadecimal
// 0,1 binary
// 0,1,2,3,4,5,6,7 octadecimal

// Strings
// 'abcdedfa', 'a', '623878234', '*&^%$#@!_+))///', '1'

// '1' => 1, Number('1') => 1 ^ 1, '1' - '1' => '11'
// 'a' => Not a number Number('a') => NaN
// String(1) => '1'

// Boolean
// true, false
// 0, 1

// undefined, null
//

// Object
// { a: 1, b: 2, c: { a: 2, b: 4 } }
// | a | b | c |
// | 1 | 2 | a | b |
//         | 2 | 4 |

// Array
// [1,2,3,4,5,6,7,'a',false, null]
// ['a','b','c','d']
// [{ a: 1 }, { b: 1 }]

// function isEven(input: number) {
//   if (input % 2 === 0) {
//     return true;
//   }
//   return false;
// }

// function Greet(name: string) {
//   return "Welcome " + name;
// }

// console.log(Greet("Rakhi"));

// console.log(Math.random());
// console.log(Math.imul(4, 5));
// console.log(Math.abs(-1 * 90));

// const str = "askdfjalkjdf";
// let variableStr: string = "abced";

// let bool: boolean = false;

// variableStr = "this aA aA ias a string";

// console.log(variableStr.includes("ias"));
// console.log(variableStr.indexOf("a", 9));
// console.log(variableStr.lastIndexOf("a"));

// let aIndex: number = variableStr.indexOf("a");

// console.log(variableStr.search(/aA/));

// let str: string = "aaabcdaabc";
// console.log(str.lastIndexOf('b'));
// let aIndex: number = str.indexOf("cd");
// console.log(str.indexOf("b", aIndex));

// let cdIndex: number = str.lastIndexOf("cd");
// // console.log(str.lastIndexOf("b"));

let str = "aaabcdaabctyukl4asdfhgjhkjagfhgaqaa";
let count: number = 0;
// let aIndex: number = str.indexOf("4"); // 0

// while (aIndex !== -1) {
//   count = count + 1; // 5
//   aIndex = str.indexOf("4", aIndex + 1); // -1
// }

for (let i: number = 0; i < str.length; i++) {
  let char = str.charAt(i) + str.charAt(i + 1);
  if (char === "aa") {
    count = count + 1;
  }
}

console.log(count);
